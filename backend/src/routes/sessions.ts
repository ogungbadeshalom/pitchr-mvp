import { Router } from 'express';
import { z } from 'zod';
import { generateSessionToken, getSessionLimit, getSessionDuration } from '../services/sessionService';
import { createSession, updatePaymentStatus, createAuditLog, findSessionByPaymentReference, findPaymentByReference, findActiveSessionByUserId } from '../database/queries';
import { verifyFlutterwaveTransaction } from '../services/paymentService';
import { query } from '../config/database';
import { PaymentError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { getFlutterwaveConfig } from '../config/flutterwave';
import { requireAuth } from '../middleware/auth';
import { sessionRateLimit } from '../middleware/rateLimit';

const router = Router();

const REFERENCE_REGEX = /^PROP_(flash|power)_\d+$/;

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

router.post('/claim', sessionRateLimit, async (req, res, next) => {
  try {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid reference', { errors: parsed.error.flatten().fieldErrors });
    }

    const { reference } = parsed.data;
    const refMatch = reference.match(REFERENCE_REGEX);
    if (!refMatch) {
      throw new ValidationError('Invalid payment reference');
    }
    const plan = refMatch[1] as 'flash' | 'power';

    const payment = await findPaymentByReference(reference);

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
      logger.warn('Payment completed but no session found, recreating', { reference });
      const token = generateSessionToken();
      const limit = getSessionLimit(plan);
      const duration = getSessionDuration(plan);
      const expiresAt = new Date(Date.now() + duration);

      const session = await createSession(token, plan, payment.flutterwave_reference ? `receipt@pitchr.ng` : 'receipt@pitchr.ng', expiresAt, limit, reference, payment.user_id ?? undefined);
      await query('UPDATE sessions SET payment_status = $1 WHERE id = $2', ['completed', session.id]);
      await createAuditLog(null, 'session_claimed', 'sessions', '', { plan, token, reference });
      logger.info('Session recreated for completed payment', { plan, reference });

      return res.json({
        token,
        plan,
        expiresAt: expiresAt.getTime(),
        limit,
      });
    }

    const isMock = getFlutterwaveConfig().secretKey === 'sk_placeholder';
    if (isMock && payment) {
      try {
        await updatePaymentStatus(reference, 'completed');
        logger.info('Payment status updated to completed', { reference });
      } catch (err) {
        logger.error('Failed to update payment status', { reference, error: String(err) });
      }
      const token = generateSessionToken();
      const limit = getSessionLimit(plan);
      const duration = getSessionDuration(plan);
      const expiresAt = new Date(Date.now() + duration);

      const email = (payment as any).email || 'receipt@pitchr.ng';
      const session = await createSession(token, plan, email, expiresAt, limit, reference);
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

    if (isMock && !payment) {
      logger.warn('Session claim rejected: no payment record found', { reference });
      throw new PaymentError('No payment record found for this reference.');
    }

    if (payment && payment.status === 'pending') {
      logger.info('Verifying pending payment with Flutterwave', { reference });
      const verified = await verifyFlutterwaveTransaction(reference);

      if (verified && verified.status === 'successful') {
        await updatePaymentStatus(reference, 'completed');
        logger.info('Flutterwave verified: payment completed, creating session', { reference });

        const token = generateSessionToken();
        const limit = getSessionLimit(plan);
        const duration = getSessionDuration(plan);
        const expiresAt = new Date(Date.now() + duration);

        if (!verified.email) {
          logger.warn('No email from Flutterwave verification, skipping session creation', { reference });
          throw new PaymentError('Could not verify payment details. Please try again or contact support.');
        }

        const session = await createSession(token, plan, verified.email, expiresAt, limit, reference, payment.user_id ?? undefined);
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

      logger.warn('Flutterwave verify: payment still pending or unavailable', { reference, flwResult: verified?.status ?? 'null' });
      throw new PaymentError('Your payment is still processing. This usually completes within 30 seconds. Please wait and try again.');
    }

    logger.warn('Session claim rejected: no payment record found', { reference });
    throw new PaymentError('No payment record found for this reference.');
  } catch (err) {
    next(err);
  }
});

export default router;
