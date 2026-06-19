import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('JWT_SECRET not set, using dev fallback. Set JWT_SECRET in production.');
      return 'pitchr-dev-secret-change-in-production';
    }
    logger.error('JWT_SECRET is not set');
    throw new Error('JWT_SECRET must be configured in production/staging');
  }
  return secret;
}

const EXPIRES_IN = '7d';

export function signToken(userId: string): string {
  return jwt.sign({ userId }, getSecret(), { algorithm: 'HS256', expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getSecret(), { algorithms: ['HS256'] }) as { userId: string };
    return decoded;
  } catch (err) {
    logger.warn('JWT verify failed', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}
