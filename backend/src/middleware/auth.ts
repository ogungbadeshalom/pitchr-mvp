import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { UnauthorizedError } from '../utils/errors';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.pitchr_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return next(new UnauthorizedError('Authentication required'));
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
  (req as any).userId = decoded.userId;
  next();
}
