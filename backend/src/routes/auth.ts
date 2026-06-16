import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database';
import { findUserByEmail, findUserByEmailWithPassword, findUserById, upsertUser } from '../database/queries';
import { signToken } from '../config/jwt';
import { AppError } from '../utils/errors';
import { sendWelcomeEmail } from '../services/emailService';

const router = Router();

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 'VALIDATION_ERROR', 400);
    }
    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 'VALIDATION_ERROR', 400);
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      throw new AppError('An account with this email already exists', 'CONFLICT', 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, subscription_tier, proposal_count_this_month, proposal_limit_this_month, created_at`,
      [email, passwordHash, firstName || null, lastName || null]
    );
    const user = result.rows[0];
    const token = signToken(user.id);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('pitchr_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendWelcomeEmail(user.email, user.first_name || user.email).catch(() => {});

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

router.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 'VALIDATION_ERROR', 400);
    }
    const user = await findUserByEmailWithPassword(email);
    if (!user || !user.password_hash) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED', 401);
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid email or password', 'UNAUTHORIZED', 401);
    }
    const token = signToken(user.id);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('pitchr_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    next(err);
  }
});

router.post('/signout', (_req: Request, res: Response) => {
  res.clearCookie('pitchr_token', { httpOnly: true, sameSite: 'lax' });
  res.json({ message: 'Signed out' });
});

router.post('/google-finish', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, email } = req.body;
    if (!id || !email) {
      throw new AppError('Missing user info', 'VALIDATION_ERROR', 400);
    }
    const user = await upsertUser(id, email);
    if (!user) {
      throw new AppError('User not found', 'NOT_FOUND', 404);
    }
    const token = signToken(user.id);
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('pitchr_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
});

export default router;
