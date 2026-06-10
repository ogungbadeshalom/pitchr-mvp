import { Router } from 'express';
import { z } from 'zod';
import { generateProposal } from '../services/proposalEngine';
import { validateAndUseSession } from '../services/sessionService';
import { findUserById, saveProposal, getProposalsByUserId } from '../database/queries';
import { query } from '../config/database';
import { getDeepseekConfig } from '../config/deepseek';
import { verifyToken } from '../config/jwt';
import { requireAuth } from '../middleware/auth';
import { sessionRateLimit } from '../middleware/rateLimit';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const proposals = await getProposalsByUserId(userId);
    res.json({ proposals });
  } catch (err) {
    next(err);
  }
});

const generateSchema = z.object({
  job_description: z.string().min(10, 'Job description must be at least 10 characters').max(5000),
  platform: z.enum(['upwork', 'fiverr', 'other']),
  length: z.enum(['short', 'standard', 'detailed']),
  user_context: z.string().max(1000).optional(),
  session_token: z.string().optional(),
});

function isMockMode() {
  return getDeepseekConfig().apiKey === 'sk-placeholder';
}

router.post('/generate', sessionRateLimit, async (req, res, next) => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const { job_description, platform, length, user_context, session_token } = parsed.data;
    let sessionId: string | null = null;
    let userId: string | null = null;

    if (session_token) {
      if (isMockMode()) {
        logger.warn('Mock mode: skipping session validation');
      } else {
        const session = await validateAndUseSession(session_token);
        sessionId = session.id;
      }
    } else if (!isMockMode()) {
      const authToken = req.cookies?.pitchr_token || req.headers.authorization?.replace('Bearer ', '');
      const decoded = verifyToken(authToken);
      if (!decoded) {
        throw new UnauthorizedError('Authentication required. Please log in or provide a session token.');
      }

      const user = await findUserById(decoded.userId);
      if (!user || user.subscription_tier === 'free') {
        throw new ValidationError('Session token required. Purchase a session or subscribe to generate proposals.');
      }

      if (user.subscription_ended_at && new Date() > new Date(user.subscription_ended_at)) {
        throw new UnauthorizedError('Your subscription has expired.');
      }

      if (user.proposal_limit_this_month > 0 && user.proposal_count_this_month >= user.proposal_limit_this_month) {
        throw new UnauthorizedError('Monthly proposal limit reached.');
      }

      await query('UPDATE users SET proposal_count_this_month = proposal_count_this_month + 1 WHERE id = $1', [user.id]);
      userId = user.id;
    }

    const result = await generateProposal({
      jobDescription: job_description,
      platform,
      length,
      userContext: user_context,
    });

    try {
      await saveProposal(userId, sessionId, job_description, platform, length, result.proposal);
    } catch (dbErr) {
      if (isMockMode()) {
        logger.warn('Mock mode: DB unavailable, skipping proposal save');
      } else {
        throw new Error('Failed to save proposal');
      }
    }

    res.json({
      proposal: result.proposal,
      character_count: result.characterCount,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
