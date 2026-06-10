import { Router } from 'express';
import { z } from 'zod';
import { initSessionPayment, initSubscriptionPayment, verifyWebhookSignature, getSubscriptionPrice } from '../services/paymentService';
import { generateSessionToken, getSessionLimit, getSessionDuration } from '../services/sessionService';
import { createSession, createPayment, updatePaymentStatus, updateUserSubscription, cancelUserSubscription, createAuditLog, findUserByEmail, findUserById } from '../database/queries';
import { query } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { ValidationError } from '../utils/errors';

const router = Router();

const initSessionSchema = z.object({
  plan: z.enum(['flash', 'power']),
  email: z.string().email(),
});

const initSubscriptionSchema = z.object({
  plan: z.enum(['starter', 'pro', 'ultra']),
});

const confirmSubscriptionSchema = z.object({
  reference: z.string().startsWith('PROP_SUB_'),
});

router.post('/init-session', async (req, res, next) => {
  try {
    const parsed = initSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const { plan, email } = parsed.data;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await initSessionPayment(plan, email, frontendUrl);

    await createPayment(null, null, getSubscriptionPrice(plan), 'one_time', result.reference);

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

    const { plan } = parsed.data;
    const userId = (req as any).userId;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await initSubscriptionPayment(plan, user.email, frontendUrl, userId);

    await createPayment(userId, null, getSubscriptionPrice(plan), 'subscription', result.reference);

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
    const plan = reference.replace('PROP_SUB_', '').split('_')[0] as string;
    const validPlans = ['starter', 'pro', 'ultra'];
    if (!validPlans.includes(plan)) {
      throw new ValidationError('Invalid plan in reference');
    }

    const userId = (req as any).userId;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await updateUserSubscription(userId, plan, expiresAt);

    try { await updatePaymentStatus(reference, 'completed'); } catch { /* ok if no payment record yet */ }

    await createAuditLog(userId, 'subscription_created', 'users', userId, { plan });

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

    const safeUser = {
      id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name,
      subscription_tier: user.subscription_tier, subscription_started_at: user.subscription_started_at,
      subscription_ended_at: user.subscription_ended_at, proposal_count_this_month: user.proposal_count_this_month,
      proposal_limit_this_month: user.proposal_limit_this_month, created_at: user.created_at,
    };
    res.json({ message: 'Subscription activated', user: safeUser });
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

  if (event === 'charge.completed' && data.status === 'successful') {
    const { tx_ref, customer } = data;

    await updatePaymentStatus(tx_ref, 'completed');

    if (tx_ref.startsWith('PROP_flash_') || tx_ref.startsWith('PROP_power_')) {
      const plan = tx_ref.startsWith('PROP_flash_') ? 'flash' : 'power';
      const token = generateSessionToken();
      const limit = getSessionLimit(plan);
      const duration = getSessionDuration(plan);
      const expiresAt = new Date(Date.now() + duration);

      const session = await createSession(token, plan, customer.email, expiresAt, limit);
      await query('UPDATE sessions SET payment_status = $1 WHERE id = $2', ['completed', session.id]);
      await createAuditLog(null, 'session_created', 'sessions', '', { plan, token });
    }

    if (tx_ref.startsWith('PROP_SUB_')) {
      const plan = tx_ref.replace('PROP_SUB_', '').split('_')[0];
      const user = await findUserByEmail(customer.email);
      if (user) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await updateUserSubscription(user.id, plan, expiresAt);
        await createAuditLog(user.id, 'subscription_created', 'users', user.id, { plan });
      }
    }

    return res.status(200).json({ status: 'success' });
  }

  res.status(200).json({ status: 'ignored' });
});

export default router;
