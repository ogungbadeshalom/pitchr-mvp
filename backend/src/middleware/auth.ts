import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { query } from '../config/database';
import { UnauthorizedError } from '../utils/errors';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.pitchr_token || req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return next(new UnauthorizedError('Authentication required'));
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
  const result = await query('SELECT deleted_at FROM users WHERE id = $1', [decoded.userId]);
  if (result.rows.length === 0 || result.rows[0].deleted_at !== null) {
    return next(new UnauthorizedError('Account not found or suspended'));
  }
  (req as any).userId = decoded.userId;
  next();
}
