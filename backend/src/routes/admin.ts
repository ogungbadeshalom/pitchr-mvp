import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/admin';
import { query } from '../config/database';
import { createAuditLog, listReferralLinks, createReferralLink, deleteReferralLink } from '../database/queries';
import { AppError } from '../utils/errors';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_TIERS = ['free', 'starter', 'pro'];

router.get('/analytics', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [stats, signupTrend, proposalTrend, revenueTrend] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)::int AS total_users,
          (SELECT COUNT(*) FROM proposals)::int AS total_proposals,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed')::float AS total_revenue,
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at > NOW() - INTERVAL '24 hours')::int AS signups_24h,
          (SELECT COUNT(*) FROM proposals WHERE created_at > NOW() - INTERVAL '24 hours')::int AS proposals_24h,
          (SELECT COUNT(*) FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours')::int AS payments_24h,
          (SELECT COALESCE(SUM(amount), 0))::float AS revenue_24h FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '24 hours'
      `),
      query(`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS count
        FROM users WHERE created_at > NOW() - INTERVAL '7 days' AND deleted_at IS NULL
        GROUP BY DATE(created_at) ORDER BY date
      `),
      query(`
        SELECT DATE(created_at) AS date, COUNT(*)::int AS count
        FROM proposals WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date
      `),
      query(`
        SELECT DATE(created_at) AS date, COALESCE(SUM(amount), 0)::float AS amount
        FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY date
      `),
    ]);

    res.json({
      overview: stats.rows[0],
      signup_trend: signupTrend.rows,
      proposal_trend: proposalTrend.rows,
      revenue_trend: revenueTrend.rows,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = ((req.query.search as string) || '').trim();
    const pageStr = req.query.page as string;
    const page = Math.min(Math.max(1, parseInt(pageStr) || 1), 1000);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    let countQuery: string;
    let dataQuery: string;
    const params: unknown[] = [];
    const searchPattern = `%${search}%`;

    if (search) {
      countQuery = `SELECT COUNT(*)::int AS total FROM users WHERE deleted_at IS NULL AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)`;
      dataQuery = `SELECT id, email, first_name, last_name, subscription_tier, proposal_count_this_month, proposal_limit_this_month, billing_period, created_at FROM users WHERE deleted_at IS NULL AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1) ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(searchPattern, limit, offset);
    } else {
      countQuery = `SELECT COUNT(*)::int AS total FROM users WHERE deleted_at IS NULL`;
      dataQuery = `SELECT id, email, first_name, last_name, subscription_tier, proposal_count_this_month, proposal_limit_this_month, billing_period, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, search ? [searchPattern] : []),
      query(dataQuery, params),
    ]);

    res.json({
      users: dataResult.rows,
      total: countResult.rows[0].total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    if (!UUID_REGEX.test(userId)) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Invalid user ID format' });
    }

    const { subscription_tier, proposal_limit_this_month, proposal_count_this_month, deleted_at } = req.body;

    const existingCheck = await query('SELECT id, subscription_tier, proposal_limit_this_month, proposal_count_this_month FROM users WHERE id = $1 AND deleted_at IS NULL', [userId]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const existing = existingCheck.rows[0];
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (subscription_tier !== undefined) {
      if (!VALID_TIERS.includes(subscription_tier)) {
        return res.status(400).json({ error: 'VALIDATION', message: `Invalid subscription tier. Must be one of: ${VALID_TIERS.join(', ')}` });
      }
      updates.push(`subscription_tier = $${idx++}`);
      values.push(subscription_tier);
    }
    if (proposal_limit_this_month !== undefined) {
      if (typeof proposal_limit_this_month !== 'number' || proposal_limit_this_month < 0) {
        return res.status(400).json({ error: 'VALIDATION', message: 'proposal_limit_this_month must be a non-negative number' });
      }
      updates.push(`proposal_limit_this_month = $${idx++}`);
      values.push(proposal_limit_this_month);
    }
    if (proposal_count_this_month !== undefined) {
      if (typeof proposal_count_this_month !== 'number' || proposal_count_this_month < 0) {
        return res.status(400).json({ error: 'VALIDATION', message: 'proposal_count_this_month must be a non-negative number' });
      }
      updates.push(`proposal_count_this_month = $${idx++}`);
      values.push(proposal_count_this_month);
    }
    if (deleted_at !== undefined) {
      if (deleted_at !== null && isNaN(Date.parse(deleted_at))) {
        return res.status(400).json({ error: 'VALIDATION', message: 'deleted_at must be a valid timestamp or null' });
      }
      updates.push(`deleted_at = $${idx++}`);
      values.push(deleted_at);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'VALIDATION', message: 'No fields to update' });
    }

    updates.push(`updated_at = $${idx++}`);
    values.push(new Date());
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, first_name, last_name, subscription_tier, proposal_count_this_month, proposal_limit_this_month, billing_period, deleted_at, created_at`,
      values
    );

    const adminUserId = (req as any).userId;
    const changes: Record<string, unknown> = {};
    if (subscription_tier !== undefined && subscription_tier !== existing.subscription_tier) changes.subscription_tier = { from: existing.subscription_tier, to: subscription_tier };
    if (proposal_limit_this_month !== undefined && proposal_limit_this_month !== existing.proposal_limit_this_month) changes.proposal_limit = { from: existing.proposal_limit_this_month, to: proposal_limit_this_month };
    if (proposal_count_this_month !== undefined && proposal_count_this_month !== existing.proposal_count_this_month) changes.proposal_count = { from: existing.proposal_count_this_month, to: proposal_count_this_month };
    if (Object.keys(changes).length > 0) {
      await createAuditLog(adminUserId, 'admin_edit_user', 'users', userId, changes);
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get('/transactions', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pageStr = req.query.page as string;
    const page = Math.min(Math.max(1, parseInt(pageStr) || 1), 1000);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*)::int AS total FROM payments`),
      query(
        `SELECT p.*, u.email AS user_email, u.first_name, u.last_name
         FROM payments p
         LEFT JOIN users u ON p.user_id = u.id
         ORDER BY p.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);

    res.json({
      transactions: dataResult.rows,
      total: countResult.rows[0].total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/referral-links', requireAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const links = await listReferralLinks();
    res.json({ links });
  } catch (err) {
    next(err);
  }
});

router.post('/referral-links', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, marketer_name, type } = req.body;
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new AppError('Referral code is required', 'VALIDATION_ERROR', 400);
    }
    if (!marketer_name || typeof marketer_name !== 'string' || marketer_name.trim() === '') {
      throw new AppError('Marketer name is required', 'VALIDATION_ERROR', 400);
    }
    const linkType = (type === 'marketer') ? 'marketer' : 'affiliate';
    await createReferralLink(code.trim().toLowerCase(), marketer_name.trim(), linkType);
    const links = await listReferralLinks();
    res.status(201).json({ links });
  } catch (err) {
    next(err);
  }
});

router.delete('/referral-links/:code', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    await deleteReferralLink(code.toLowerCase());
    res.json({ message: 'Referral link removed' });
  } catch (err) {
    next(err);
  }
});

export default router;
