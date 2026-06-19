import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

const router = Router();

router.get('/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const lower = code.toLowerCase();

    const linkResult = await query(
      'SELECT code, marketer_name, type FROM referral_links WHERE code = $1',
      [lower]
    );
    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Referral code not found' });
    }
    const link = linkResult.rows[0];

    const statsResult = await query(`
      SELECT
        COUNT(u.id)::int AS signups,
        COALESCE(SUM(p.amount), 0)::int AS total_revenue
      FROM referral_links rl
      LEFT JOIN users u ON u.referred_by = rl.code
      LEFT JOIN payments p ON p.user_id = u.id AND p.status = 'completed'
      WHERE rl.code = $1
    `, [lower]);

    const { signups, total_revenue } = statsResult.rows[0];
    const rate = link.type === 'marketer' ? 0.10 : 0.05;
    const commission_owed = Math.floor(total_revenue * rate);

    res.json({
      code: link.code,
      marketer_name: link.marketer_name,
      type: link.type,
      rate: link.type === 'marketer' ? 10 : 5,
      signups,
      total_revenue,
      commission_owed,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
