import { query } from '../config/database';
import { logger } from '../utils/logger';
import type { User, Session, Proposal, Payment } from '../types';

export interface UserWithPassword extends User {
  password_hash: string | null;
}

export async function createUser(id: string, email: string, firstName?: string, lastName?: string): Promise<User> {
  const result = await query(
    `INSERT INTO users (id, email, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, email, firstName ?? null, lastName ?? null]
  );
  return result.rows[0];
}

export async function upsertUser(id: string, email: string, firstName?: string, lastName?: string): Promise<User> {
  const result = await query(
    `INSERT INTO users (id, email, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET first_name = COALESCE(EXCLUDED.first_name, users.first_name), last_name = COALESCE(EXCLUDED.last_name, users.last_name)
     RETURNING *`,
    [id, email, firstName ?? null, lastName ?? null]
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT id, email, first_name, last_name, subscription_tier, subscription_started_at, subscription_ended_at, proposal_count_this_month, proposal_limit_this_month, billing_period, created_at FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  return result.rows[0] || null;
}

export async function findUserByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
  const result = await query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  return result.rows[0] || null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query(
    'SELECT id, email, first_name, last_name, subscription_tier, subscription_started_at, subscription_ended_at, proposal_count_this_month, proposal_limit_this_month, billing_period, created_at FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return result.rows[0] || null;
}

export async function findUserForProposalCheck(id: string): Promise<Pick<User, 'id' | 'subscription_tier' | 'subscription_ended_at' | 'proposal_count_this_month' | 'proposal_limit_this_month'> | null> {
  const result = await query(
    'SELECT id, subscription_tier, subscription_ended_at, proposal_count_this_month, proposal_limit_this_month FROM users WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
  return result.rows[0] || null;
}

export async function createSession(
  token: string,
  plan: string,
  email: string,
  expiresAt: Date,
  proposalsLimit: number,
  paymentReference?: string,
  userId?: string
): Promise<Session> {
  const result = await query(
    `INSERT INTO sessions (token, plan, email, expires_at, proposals_limit, payment_reference, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [token, plan, email, expiresAt, proposalsLimit, paymentReference || null, userId || null]
  );
  return result.rows[0];
}

export async function findSessionByToken(token: string): Promise<Session | null> {
  const result = await query('SELECT * FROM sessions WHERE token = $1', [token]);
  return result.rows[0] || null;
}

export async function findSessionByPaymentReference(reference: string): Promise<Session | null> {
  const result = await query('SELECT * FROM sessions WHERE payment_reference = $1', [reference]);
  return result.rows[0] || null;
}

export async function findActiveSessionByUserId(userId: string): Promise<Session | null> {
  const result = await query(
    `SELECT * FROM sessions WHERE user_id = $1 AND expires_at > NOW() AND proposals_used < proposals_limit ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function findPaymentByReference(reference: string): Promise<Payment | null> {
  const result = await query('SELECT * FROM payments WHERE flutterwave_reference = $1', [reference]);
  return result.rows[0] || null;
}

export async function atomicIncrementSessionProposals(id: string): Promise<Session | null> {
  const result = await query(
    `UPDATE sessions SET proposals_used = proposals_used + 1
     WHERE id = $1 AND expires_at > NOW() AND proposals_used < proposals_limit
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

export async function saveProposal(
  userId: string | null,
  sessionId: string | null,
  jobDescription: string,
  platform: string,
  length: string,
  generatedProposal: string
): Promise<Proposal> {
  const result = await query(
    `INSERT INTO proposals (user_id, session_id, job_description, platform, length, generated_proposal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, sessionId, jobDescription, platform, length, generatedProposal]
  );
  return result.rows[0];
}

export async function getProposalsByUserId(userId: string): Promise<Proposal[]> {
  const result = await query(
    'SELECT * FROM proposals WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function createPayment(
  userId: string | null,
  sessionId: string | null,
  amount: number,
  paymentType: string,
  flutterwaveReference: string
): Promise<Payment> {
  const result = await query(
    `INSERT INTO payments (user_id, session_id, amount, payment_type, flutterwave_reference) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, sessionId, amount, paymentType, flutterwaveReference]
  );
  return result.rows[0];
}

export async function updatePaymentStatus(reference: string, status: string): Promise<void> {
  await query(
    `UPDATE payments SET status = $1, completed_at = NOW() WHERE flutterwave_reference = $2 AND status = 'pending'`,
    [status, reference]
  );
}

const PLAN_LIMITS: Record<string, number> = {
  starter: 30,
  pro: 0,
};

export function getProposalLimit(plan: string): number {
  if (!(plan in PLAN_LIMITS)) {
    logger.warn(`Unknown plan tier "${plan}", using safe default`);
    return plan === 'pro' ? 0 : 5;
  }
  return PLAN_LIMITS[plan];
}

export async function updateUserSubscription(userId: string, plan: string, expiresAt: Date, billingPeriod?: string): Promise<void> {
  const limit = getProposalLimit(plan);
  await query(
    `UPDATE users SET subscription_tier = $1, subscription_started_at = NOW(), subscription_ended_at = $2, proposal_limit_this_month = $3, proposal_count_this_month = 0, billing_period = $4 WHERE id = $5`,
    [plan, expiresAt, limit, billingPeriod || 'monthly', userId]
  );
}

export async function cancelUserSubscription(userId: string): Promise<void> {
  await query(
    `UPDATE users SET subscription_tier = 'free', subscription_started_at = NULL, subscription_ended_at = NULL, proposal_count_this_month = 0, proposal_limit_this_month = NULL, billing_period = NULL WHERE id = $1`,
    [userId]
  );
}

export async function getFreelancerProfile(userId: string): Promise<{ profile_text: string } | null> {
  const result = await query('SELECT profile_text FROM freelancer_profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || null;
}

export async function upsertFreelancerProfile(userId: string, profileText: string): Promise<void> {
  await query(
    `INSERT INTO freelancer_profiles (user_id, profile_text, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET profile_text = $2, updated_at = NOW()`,
    [userId, profileText]
  );
}

export async function createAuditLog(
  userId: string | null,
  action: string,
  resource: string,
  resourceId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await query(
    `INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata) VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, resource, resourceId, metadata ?? null]
  );
}
