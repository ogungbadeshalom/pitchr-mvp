import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/admin';
import { query } from '../config/database';

const router = Router();

router.get('/analytics', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [stats, signupTrend, proposalTrend, revenueTrend] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)::int AS total_users,
          (SELECT COUNT(*) FROM proposals)::int AS total_proposals,
          (SELECT COALESCE(SUM(amount), 0))::float AS total_revenue,
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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
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
    const { subscription_tier, proposal_limit_this_month, proposal_count_this_month, deleted_at } = req.body;

    const existing = await query('SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL', [userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (subscription_tier !== undefined) {
      updates.push(`subscription_tier = $${idx++}`);
      values.push(subscription_tier);
    }
    if (proposal_limit_this_month !== undefined) {
      updates.push(`proposal_limit_this_month = $${idx++}`);
      values.push(proposal_limit_this_month);
    }
    if (proposal_count_this_month !== undefined) {
      updates.push(`proposal_count_this_month = $${idx++}`);
      values.push(proposal_count_this_month);
    }
    if (deleted_at !== undefined) {
      updates.push(`deleted_at = $${idx++}`);
      values.push(deleted_at);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'VALIDATION', message: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, first_name, last_name, subscription_tier, proposal_count_this_month, proposal_limit_this_month, billing_period, deleted_at, created_at`,
      values
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
