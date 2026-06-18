import { Router } from 'express';
import { z } from 'zod';
import { initSessionPayment, initSubscriptionPayment, verifyWebhookSignature, getSessionPrice, getSubscriptionPrice, getAnnualPrice, verifyFlutterwaveTransaction } from '../services/paymentService';
import { generateSessionToken, getSessionLimit, getSessionDuration } from '../services/sessionService';
import { sendReceipt } from '../services/emailService';
import { createSession, createPayment, updatePaymentStatus, updateUserSubscription, cancelUserSubscription, createAuditLog, findUserByEmail, findUserById, findPaymentByReference } from '../database/queries';
import { query } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { ValidationError } from '../utils/errors';
import { getFlutterwaveConfig } from '../config/flutterwave';
import { logger } from '../utils/logger';

const router = Router();

const initSessionSchema = z.object({
  plan: z.enum(['flash', 'power']),
  email: z.string().email().optional(),
});

const initSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'pro']),
  billing_period: z.enum(['monthly', 'annual']).optional().default('monthly'),
});

const confirmSubscriptionSchema = z.object({
  reference: z.string().startsWith('PROP_SUB_'),
});

router.post('/init-session', requireAuth, async (req, res, next) => {
  try {
    const parsed = initSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const { plan, email } = parsed.data;
    const userId = (req as any).userId;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await initSessionPayment(plan, user.email, frontendUrl);

    await createPayment(userId, null, getSessionPrice(plan), 'one_time', result.reference);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/init-subscription', requireAuth, async (req, res, next) => {
  try {
    const parsed = initSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const { plan, billing_period } = parsed.data;
    const userId = (req as any).userId;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await initSubscriptionPayment(plan, user.email, frontendUrl, userId, billing_period);

    const price = billing_period === 'annual' ? getAnnualPrice(plan) : getSubscriptionPrice(plan);
    await createPayment(userId, null, price, 'subscription', result.reference);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/confirm-subscription', requireAuth, async (req, res, next) => {
  try {
    const parsed = confirmSubscriptionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid reference', { errors: parsed.error.flatten().fieldErrors });
    }

    const { reference } = parsed.data;
    const parts = reference.replace('PROP_SUB_', '').split('_');
    const plan = parts[0] as string;
    const billingPeriod = parts[1] as string || 'monthly';
    const validPlans = ['starter', 'pro'];
    if (!validPlans.includes(plan)) {
      throw new ValidationError('Invalid plan in reference');
    }

    const userId = (req as any).userId;

    // 1. Check if payment record exists AND belongs to this user
    const payment = await findPaymentByReference(reference);
    if (payment && payment.user_id && payment.user_id !== userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'This payment does not belong to your account.' });
    }

    // 2. If already completed (webhook processed it), return success
    if (payment && payment.status === 'completed') {
      const user = await findUserById(userId);
      if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

      const safeUser = {
        id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name,
        subscription_tier: user.subscription_tier, subscription_started_at: user.subscription_started_at,
        subscription_ended_at: user.subscription_ended_at, proposal_count_this_month: user.proposal_count_this_month,
        proposal_limit_this_month: user.proposal_limit_this_month, billing_period: user.billing_period, created_at: user.created_at,
      };
      return res.json({ message: 'Subscription already active', user: safeUser });
    }

    // 3. In mock mode with a payment record, activate the subscription
    const isMock = getFlutterwaveConfig().secretKey === 'sk_placeholder';
    if (isMock && payment) {
      const days = billingPeriod === 'annual' ? 365 : 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      await updateUserSubscription(userId, plan, expiresAt, billingPeriod);
      try { await updatePaymentStatus(reference, 'completed'); } catch (err) { logger.error('Failed to update payment status in confirm-subscription', { reference, error: String(err) }); }
      await createAuditLog(userId, 'subscription_created', 'users', userId, { plan });

      const user = await findUserById(userId);
      if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

      const price = billingPeriod === 'annual' ? getAnnualPrice(plan) : getSubscriptionPrice(plan);
      sendReceipt(user.email, plan, price, reference).catch(() => {});

      const safeUser = {
        id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name,
        subscription_tier: user.subscription_tier, subscription_started_at: user.subscription_started_at,
        subscription_ended_at: user.subscription_ended_at, proposal_count_this_month: user.proposal_count_this_month,
        proposal_limit_this_month: user.proposal_limit_this_month, billing_period: user.billing_period, created_at: user.created_at,
      };
      return res.json({ message: 'Subscription activated', user: safeUser });
    }

    // 4. Mock mode but no payment record — forged reference
    if (isMock && !payment) {
      return res.status(402).json({ error: 'PAYMENT_NOT_FOUND', message: 'No payment record found for this reference.' });
    }

    // 5. Real mode: payment exists but not completed — verify with Flutterwave
    if (payment && payment.status === 'pending') {
      const verified = await verifyFlutterwaveTransaction(reference);

      if (verified && verified.status === 'successful') {
        await updatePaymentStatus(reference, 'completed');
        logger.info('Flutterwave verified: activating subscription', { reference });

        const days = billingPeriod === 'annual' ? 365 : 30;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await updateUserSubscription(userId, plan, expiresAt, billingPeriod);
        await createAuditLog(userId, 'subscription_created', 'users', userId, { plan });

        const user = await findUserById(userId);
        if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

        const price = billingPeriod === 'annual' ? getAnnualPrice(plan) : getSubscriptionPrice(plan);
        sendReceipt(user.email, plan, price, reference).catch(() => {});

        const safeUser = {
          id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name,
          subscription_tier: user.subscription_tier, subscription_started_at: user.subscription_started_at,
          subscription_ended_at: user.subscription_ended_at, proposal_count_this_month: user.proposal_count_this_month,
          proposal_limit_this_month: user.proposal_limit_this_month, billing_period: user.billing_period, created_at: user.created_at,
        };
        return res.json({ message: 'Subscription activated', user: safeUser });
      }

      return res.status(402).json({
        error: 'PAYMENT_PENDING',
        message: 'Your payment is still processing. This usually completes within 30 seconds. Please try again.',
      });
    }

    // 6. No payment record — forged reference
    return res.status(402).json({ error: 'PAYMENT_NOT_FOUND', message: 'No payment record found for this reference.' });
  } catch (err) {
    next(err);
  }
});

router.post('/cancel-subscription', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    await cancelUserSubscription(userId);
    await createAuditLog(userId, 'subscription_cancelled', 'users', userId, {});
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

router.post('/webhook', async (req, res) => {
  const signature = req.headers['verif-hash'] as string;

  if (process.env.FLUTTERWAVE_SECRET_KEY !== 'sk_placeholder' && !verifyWebhookSignature(JSON.stringify(req.body), signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  logger.info('Webhook received', { event, tx_ref: data?.tx_ref, status: data?.status });

  if (event === 'charge.completed' && data.status === 'successful') {
    const { tx_ref, customer } = data;

    await updatePaymentStatus(tx_ref, 'completed');

      if (tx_ref.startsWith('PROP_flash_') || tx_ref.startsWith('PROP_power_')) {
      const plan = tx_ref.startsWith('PROP_flash_') ? 'flash' : 'power';
      const token = generateSessionToken();
      const limit = getSessionLimit(plan);
      const duration = getSessionDuration(plan);
      const expiresAt = new Date(Date.now() + duration);
      const user = await findUserByEmail(customer.email);

      const session = await createSession(token, plan, customer.email, expiresAt, limit, tx_ref, user?.id);
      await query('UPDATE sessions SET payment_status = $1 WHERE id = $2', ['completed', session.id]);
      await createAuditLog(user?.id || null, 'session_created', 'sessions', '', { plan, token });
      sendReceipt(customer.email, `session_${plan}`, data.amount, tx_ref).catch(() => {});
    }

    if (tx_ref.startsWith('PROP_SUB_')) {
      const parts = tx_ref.replace('PROP_SUB_', '').split('_');
      const plan = parts[0];
      const billingPeriod = parts[1] || 'monthly';
      const user = await findUserByEmail(customer.email);
      if (user) {
        const days = billingPeriod === 'annual' ? 365 : 30;
        const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
        await updateUserSubscription(user.id, plan, expiresAt, billingPeriod);
        await createAuditLog(user.id, 'subscription_created', 'users', user.id, { plan, billingPeriod });
        sendReceipt(customer.email, plan, data.amount, tx_ref).catch(() => {});
      }
    }

    return res.status(200).json({ status: 'success' });
  }

  res.status(200).json({ status: 'ignored' });
});

export default router;
