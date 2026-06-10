import { v4 as uuidv4 } from 'uuid';
import { findSessionByToken, incrementSessionProposalsUsed } from '../database/queries';
import { UnauthorizedError } from '../utils/errors';
import type { Session } from '../types';

const SESSION_LIMITS: Record<string, number> = {
  flash: 5,
  power: 20,
};

const SESSION_DURATIONS: Record<string, number> = {
  flash: 30 * 60 * 1000,
  power: 4 * 60 * 60 * 1000,
};

export function generateSessionToken(): string {
  return `sess_${uuidv4()}`;
}

export function getSessionLimit(plan: string): number {
  return SESSION_LIMITS[plan] || 5;
}

export function getSessionDuration(plan: string): number {
  return SESSION_DURATIONS[plan] || 30 * 60 * 1000;
}

export async function validateAndUseSession(token: string): Promise<Session> {
  const session = await findSessionByToken(token);
  if (!session) throw new UnauthorizedError('Invalid session');
  if (session.payment_status !== 'completed') throw new UnauthorizedError('Session not paid');
  if (new Date() > new Date(session.expires_at)) throw new UnauthorizedError('Session expired');
  if (session.proposals_used >= session.proposals_limit) throw new UnauthorizedError('Proposal limit reached');
  await incrementSessionProposalsUsed(session.id);
  return session;
}
