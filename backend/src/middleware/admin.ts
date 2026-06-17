import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../database/queries';
import { UnauthorizedError } from '../utils/errors';
import { requireAuth } from './auth';

async function checkAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).userId;
    const user = await findUserById(userId);
    if (!user) return next(new UnauthorizedError('User not found'));

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return next(new UnauthorizedError('Admin access required'));
    }

    (req as any).user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const requireAdmin = [requireAuth, checkAdmin];
