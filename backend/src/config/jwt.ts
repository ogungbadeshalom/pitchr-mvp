import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('JWT_SECRET is not set in production');
      throw new Error('JWT_SECRET must be configured in production');
    }
    logger.warn('JWT_SECRET not set, using dev fallback. Set JWT_SECRET in production.');
    return 'pitchr-dev-secret-change-in-production';
  }
  return secret;
}

const EXPIRES_IN = '7d';

export function signToken(userId: string): string {
  return jwt.sign({ userId }, getSecret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}
