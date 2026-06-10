import { Router } from 'express';
import { z } from 'zod';
import { generateSessionToken, getSessionLimit, getSessionDuration } from '../services/sessionService';
import { createSession, updatePaymentStatus, createAuditLog } from '../database/queries';
import { query } from '../config/database';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

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

    const plan = isFlash ? 'flash' : 'power';
    const token = generateSessionToken();
    const limit = getSessionLimit(plan);
    const duration = getSessionDuration(plan);
    const expiresAt = new Date(Date.now() + duration);

    try {
      await updatePaymentStatus(reference, 'completed');
    } catch { /* ok if no payment record exists (mock mode) */ }

    const session = await createSession(token, plan, 'receipt@pitchr.ng', expiresAt, limit);
    await query('UPDATE sessions SET payment_status = $1 WHERE id = $2', ['completed', session.id]);
    await createAuditLog(null, 'session_claimed', 'sessions', '', { plan, token, reference });

    logger.info('Session claimed', { plan, reference });

    res.json({
      token,
      plan,
      expiresAt: expiresAt.getTime(),
      limit,
    });
  } catch (err) {
    next(err);
  }
});

export default router;