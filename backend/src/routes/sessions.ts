import { Router } from 'express';
import { z } from 'zod';
import { generateSessionToken, getSessionLimit, getSessionDuration } from '../services/sessionService';
import { createSession, updatePaymentStatus, createAuditLog, findSessionByPaymentReference, findPaymentByReference, findActiveSessionByUserId } from '../database/queries';
import { verifyFlutterwaveTransaction } from '../services/paymentService';
import { query } from '../config/database';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { getFlutterwaveConfig } from '../config/flutterwave';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/active', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const session = await findActiveSessionByUserId(userId);
    if (!session) {
      return res.json({ session: null });
    }
    res.json({
      session: {
        token: session.token,
        plan: session.plan,
        expiresAt: new Date(session.expires_at).getTime(),
        proposalsUsed: session.proposals_used,
        proposalsLimit: session.proposals_limit,
      },
      server_time: Date.now(),
    });
  } catch (err) {
    next(err);
  }
});

const claimSchema = z.object({
  reference: z.string(),
});

router.post('/claim', async (req, res, next) => {
  try {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid reference', { errors: parsed.error.flatten().fieldErrors });
    }

    const { reference } = parsed.data;
    const isFlash = reference.startsWith('PROP_flash');
    const isPower = reference.startsWith('PROP_power');
    if (!isFlash && !isPower) {
      throw new ValidationError('Invalid payment reference');
    }

    // 1. Check if payment record exists
    const payment = await findPaymentByReference(reference);

    // 2. If payment already completed (webhook processed it), return existing session
    if (payment && payment.status === 'completed') {
      const existingSession = await findSessionByPaymentReference(reference);
      if (existingSession) {
        return res.json({
          token: existingSession.token,
          plan: existingSession.plan,
          expiresAt: new Date(existingSession.expires_at).getTime(),
          limit: existingSession.proposals_limit,
        });
      }
      // Edge case: payment completed but no session? Shouldn't happen, but recreate
      logger.warn('Payment completed but no session found, recreating', { reference });
    }

    // 3. In mock mode (no real Flutterwave), create session immediately
    const isMock = getFlutterwaveConfig().secretKey === 'sk_placeholder';
    if (isMock && payment) {
      try {
        await updatePaymentStatus(reference, 'completed');
        logger.info('Payment status updated to completed', { reference });
      } catch (err) {
        logger.error('Failed to update payment status', { reference, error: String(err) });
      }
      const plan = isFlash ? 'flash' : 'power';
      const token = generateSessionToken();
      const limit = getSessionLimit(plan);
      const duration = getSessionDuration(plan);
      const expiresAt = new Date(Date.now() + duration);

      const session = await createSession(token, plan, 'receipt@pitchr.ng', expiresAt, limit, reference);
      await query('UPDATE sessions SET payment_status = $1 WHERE id = $2', ['completed', session.id]);
      await createAuditLog(null, 'session_claimed', 'sessions', '', { plan, token, reference });
      logger.info('Session claimed (mock mode)', { plan, reference });

      return res.json({
        token,
        plan,
        expiresAt: expiresAt.getTime(),
        limit,
      });
    }

    // 4. In mock mode but no payment record — reject (forged reference)
    if (isMock && !payment) {
      logger.warn('Session claim rejected: no payment record found', { reference });
      return res.status(402).json({ error: 'PAYMENT_NOT_FOUND', message: 'No payment record found for this reference.' });
    }

    // 5. Real mode: payment exists but not yet completed — verify with Flutterwave directly
    if (payment && payment.status === 'pending') {
      logger.info('Verifying pending payment with Flutterwave', { reference });
      const verified = await verifyFlutterwaveTransaction(reference);

      if (verified && verified.status === 'successful') {
        await updatePaymentStatus(reference, 'completed');
        logger.info('Flutterwave verified: payment completed, creating session', { reference });

        const plan = isFlash ? 'flash' : 'power';
        const token = generateSessionToken();
        const limit = getSessionLimit(plan);
        const duration = getSessionDuration(plan);
        const expiresAt = new Date(Date.now() + duration);

        const session = await createSession(token, plan, verified.email || 'user@pitchr.ng', expiresAt, limit, reference, payment.user_id || undefined);
        await query('UPDATE sessions SET payment_status = $1 WHERE id = $2', ['completed', session.id]);
        await createAuditLog(null, 'session_claimed', 'sessions', '', { plan, token, reference });
        logger.info('Session created after Flutterwave verification', { plan, reference });

        return res.json({
          token,
          plan,
          expiresAt: expiresAt.getTime(),
          limit,
        });
      }

      // Flutterwave couldn't verify or says pending — tell user to wait
      logger.warn('Flutterwave verify: payment still pending or unavailable', { reference, flwResult: verified?.status || 'null' });
      return res.status(402).json({
        error: 'PAYMENT_PENDING',
        message: 'Your payment is still processing. This usually completes within 30 seconds. Please wait and try again.',
      });
    }

    // 6. No payment record at all — forged reference
    logger.warn('Session claim rejected: no payment record found', { reference });
    return res.status(402).json({ error: 'PAYMENT_NOT_FOUND', message: 'No payment record found for this reference.' });
  } catch (err) {
    next(err);
  }
});

export default router;
