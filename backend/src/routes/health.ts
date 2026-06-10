import { Router } from 'express';
import { query } from '../config/database';

const router = Router();

router.get('/', async (_req, res) => {
  const checks: Record<string, string> = {};
  try {
    await query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }
  const allOk = Object.values(checks).every((s) => s === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    ...checks,
  });
});

export default router;
