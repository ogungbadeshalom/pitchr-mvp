import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import Session from 'supertokens-node/recipe/session';
import { query } from '../config/database';
import { findUserByEmail, findUserByEmailWithPassword, findUserById, upsertUser } from '../database/queries';
import { signToken } from '../config/jwt';
import { AppError, UnauthorizedError } from '../utils/errors';
import { sendWelcomeEmail } from '../services/emailService';
import { authRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';

router.post('/signup', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 'VALIDATION_ERROR', 400);
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 'VALIDATION_ERROR', 400);
    }
    if (firstName && firstName.length > 100) {
      throw new AppError('First name must be under 100 characters', 'VALIDATION_ERROR', 400);
    }
    if (lastName && lastName.length > 100) {
      throw new AppError('Last name must be under 100 characters', 'VALIDATION_ERROR', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new AppError('Invalid email format', 'VALIDATION_ERROR', 400);
    }
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('An account with this email already exists', 'CONFLICT', 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, subscription_tier, proposal_count_this_month, proposal_limit_this_month, created_at`,
      [normalizedEmail, passwordHash, firstName || null, lastName || null]
    );
    const user = result.rows[0];
    const token = signToken(user.id);
    res.cookie('pitchr_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendWelcomeEmail(user.email, user.first_name || user.email).catch(err => logger.error('Failed to send welcome email', { error: String(err), email: user.email }));

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/signin', authRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 'VALIDATION_ERROR', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmailWithPassword(normalizedEmail);
    if (!user || !user.password_hash) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED', 401);
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED', 401);
    }
    const token = signToken(user.id);
    res.cookie('pitchr_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    next(err);
  }
});

router.post('/signout', (_req: Request, res: Response) => {
  res.clearCookie('pitchr_token', { httpOnly: true, secure: isProd, sameSite: 'lax' });
  res.json({ message: 'Signed out' });
});

router.post('/google-finish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, email } = req.body;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new AppError('Missing or invalid user id', 'VALIDATION_ERROR', 400);
    }
    if (!email || typeof email !== 'string') {
      throw new AppError('Missing user email', 'VALIDATION_ERROR', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();

    let userId = id;

    try {
      const session = await Session.getSession(req, res);
      const sessionUserId = session.getUserId();
      if (sessionUserId !== id) {
        throw new UnauthorizedError('Session mismatch');
      }
      userId = sessionUserId;
      logger.info('Google OAuth verified via SuperTokens session', { userId });
    } catch (sessionErr) {
      if (sessionErr instanceof UnauthorizedError) throw sessionErr;
      const existingUser = await findUserById(id) || await findUserByEmail(normalizedEmail);
      if (!existingUser) {
        logger.warn('Google OAuth: no SuperTokens session and user not found', { id, email: normalizedEmail });
        throw new UnauthorizedError('Authentication failed');
      }
      if (existingUser.email !== normalizedEmail) {
        logger.warn('Google OAuth: email mismatch with existing user', { id, expected: existingUser.email, received: normalizedEmail });
        throw new UnauthorizedError('Email mismatch');
      }
      userId = existingUser.id;
      logger.info('Google OAuth verified via DB fallback (SuperTokens session unavailable)', { userId });
    }

    const user = await upsertUser(userId, normalizedEmail);
    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }
    const token = signToken(user.id);
    res.cookie('pitchr_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
