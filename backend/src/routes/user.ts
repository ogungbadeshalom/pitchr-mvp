import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { findUserById, getFreelancerProfile, upsertFreelancerProfile } from '../database/queries';
import { query } from '../config/database';
import { ValidationError } from '../utils/errors';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }
    const profile = await getFreelancerProfile(userId);
    res.json({ user: { ...user, profile_text: profile?.profile_text || '' } });
  } catch (err) {
    next(err);
  }
});

const profileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
});

router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }

    const userId = (req as any).userId;
    const { first_name, last_name } = parsed.data;
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (first_name !== undefined) { updates.push(`first_name = $${idx++}`); values.push(first_name); }
    if (last_name !== undefined) { updates.push(`last_name = $${idx++}`); values.push(last_name); }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, first_name, last_name, subscription_tier, proposal_count_this_month, proposal_limit_this_month, billing_period, created_at`,
      values
    );

    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });

    res.json({ message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
});

const freelancerProfileSchema = z.object({
  profile_text: z.string().min(1, 'Profile text cannot be empty').max(5000, 'Profile must be under 5000 characters'),
});

router.get('/profile/freelancer', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const profile = await getFreelancerProfile(userId);
    res.json({ profile_text: profile?.profile_text || '' });
  } catch (err) {
    next(err);
  }
});

router.put('/profile/freelancer', requireAuth, async (req, res, next) => {
  try {
    const parsed = freelancerProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid input', { errors: parsed.error.flatten().fieldErrors });
    }
    const userId = (req as any).userId;
    await upsertFreelancerProfile(userId, parsed.data.profile_text);
    res.json({ message: 'Freelancer profile saved', profile_text: parsed.data.profile_text });
  } catch (err) {
    next(err);
  }
});

router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).userId;
    const result = await query('UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('pitchr_token', { httpOnly: true, secure: isProd, sameSite: 'lax' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
