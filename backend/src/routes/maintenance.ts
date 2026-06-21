import { Router, Request, Response, NextFunction } from 'express';
import { requireAdmin } from '../middleware/admin';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

const router = Router();

interface MaintenanceState {
  active: boolean;
  message: string;
}

const state: MaintenanceState = {
  active: false,
  message: 'Some features may be temporarily unavailable while we make improvements.',
};

router.get('/maintenance', (_req: Request, res: Response) => {
  res.json({ active: state.active, message: state.message });
});

router.post('/admin/maintenance', requireAdmin, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { active, message } = req.body;
    if (typeof active !== 'boolean') {
      throw new AppError('active must be a boolean', 'VALIDATION_ERROR', 400);
    }
    if (active && (!message || typeof message !== 'string' || message.trim() === '')) {
      throw new AppError('message is required when maintenance is active', 'VALIDATION_ERROR', 400);
    }
    state.active = active;
    if (active) state.message = message.trim();
    logger.info('Maintenance mode updated', { active: state.active, message: state.message });
    res.json({ active: state.active, message: state.message });
  } catch (err) {
    next(err);
  }
});

export default router;
