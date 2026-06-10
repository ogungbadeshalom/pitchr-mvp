import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'pitchr-dev-secret-change-in-production';
const EXPIRES_IN = '7d';

export function signToken(userId: string): string {
  return jwt.sign({ userId }, SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}
