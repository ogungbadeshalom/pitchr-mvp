import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFind = vi.hoisted(() => ({ fn: vi.fn(), inc: vi.fn() }));

vi.mock('../../database/queries', () => ({
  findSessionByToken: mockFind.fn,
  atomicIncrementSessionProposals: mockFind.inc,
}));

import { generateSessionToken, getSessionLimit, getSessionDuration, validateAndUseSession } from '../sessionService';

describe('generateSessionToken', () => {
  it('should return a token starting with sess_', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^sess_/);
    expect(token.length).toBeGreaterThan(10);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSessionToken()));
    expect(tokens.size).toBe(100);
  });
});

describe('getSessionLimit', () => {
  it('should return 5 for flash', () => {
    expect(getSessionLimit('flash')).toBe(5);
  });

  it('should return 20 for power', () => {
    expect(getSessionLimit('power')).toBe(20);
  });

  it('should return 5 for unknown plans', () => {
    expect(getSessionLimit('unknown')).toBe(5);
  });
});

describe('getSessionDuration', () => {
  it('should return 30 minutes for flash', () => {
    expect(getSessionDuration('flash')).toBe(30 * 60 * 1000);
  });

  it('should return 4 hours for power', () => {
    expect(getSessionDuration('power')).toBe(4 * 60 * 60 * 1000);
  });

  it('should return 30 minutes for unknown plans', () => {
    expect(getSessionDuration('unknown')).toBe(30 * 60 * 1000);
  });
});

describe('validateAndUseSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw UnauthorizedError if session not found', async () => {
    mockFind.fn.mockResolvedValue(null);
    await expect(validateAndUseSession('bad_token')).rejects.toThrow('Invalid session');
  });

  it('should throw UnauthorizedError if payment not completed', async () => {
    mockFind.fn.mockResolvedValue({
      id: '1', token: 't', plan: 'flash', email: 'a@b.com',
      expires_at: new Date(Date.now() + 3600000),
      proposals_used: 0, proposals_limit: 5,
      payment_reference: null, payment_status: 'pending',
    } as any);
    await expect(validateAndUseSession('t')).rejects.toThrow('Session not paid');
  });

  it('should throw UnauthorizedError if expired', async () => {
    mockFind.fn.mockResolvedValue({
      id: '1', token: 't', plan: 'flash', email: 'a@b.com',
      expires_at: new Date(Date.now() - 1000),
      proposals_used: 0, proposals_limit: 5,
      payment_reference: null, payment_status: 'completed',
    } as any);
    await expect(validateAndUseSession('t')).rejects.toThrow('Session expired');
  });

  it('should throw UnauthorizedError if limit reached', async () => {
    mockFind.fn.mockResolvedValue({
      id: '1', token: 't', plan: 'flash', email: 'a@b.com',
      expires_at: new Date(Date.now() + 3600000),
      proposals_used: 5, proposals_limit: 5,
      payment_reference: null, payment_status: 'completed',
    } as any);
    await expect(validateAndUseSession('t')).rejects.toThrow('Proposal limit reached');
  });

  it('should return session and increment usage on success', async () => {
    const session = {
      id: '1', token: 't', plan: 'flash', email: 'a@b.com',
      expires_at: new Date(Date.now() + 3600000),
      proposals_used: 2, proposals_limit: 5,
      payment_reference: null, payment_status: 'completed',
    };
    const updatedSession = { ...session, proposals_used: 3 };
    mockFind.fn.mockResolvedValue(session as any);
    mockFind.inc.mockResolvedValue(updatedSession as any);

    const result = await validateAndUseSession('t');
    expect(result.id).toBe('1');
    expect(result.proposals_used).toBe(3);
    expect(mockFind.inc).toHaveBeenCalledWith('1');
  });
});
