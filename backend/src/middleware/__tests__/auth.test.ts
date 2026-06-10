import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../config/jwt', () => ({
  verifyToken: vi.fn(),
}));

import { verifyToken } from '../../config/jwt';
import { requireAuth } from '../auth';
import { UnauthorizedError } from '../../utils/errors';

function mockReqRes() {
  const req = { cookies: {}, headers: {} } as unknown as Request;
  const res = {} as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
}

describe('requireAuth', () => {
  it('should pass with valid cookie token', async () => {
    const { req, res, next } = mockReqRes();
    req.cookies = { pitchr_token: 'valid-token' };
    (verifyToken as any).mockReturnValue({ userId: 'user-1' });

    await requireAuth(req, res, next);

    expect((req as any).userId).toBe('user-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('should pass with valid Bearer token', async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: 'Bearer valid-token' };
    (verifyToken as any).mockReturnValue({ userId: 'user-2' });

    await requireAuth(req, res, next);

    expect((req as any).userId).toBe('user-2');
    expect(next).toHaveBeenCalledWith();
  });

  it('should fail if no token provided', async () => {
    const { req, res, next } = mockReqRes();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(next.mock.calls[0][0].message).toBe('Authentication required');
  });

  it('should fail if token is invalid', async () => {
    const { req, res, next } = mockReqRes();
    req.cookies = { pitchr_token: 'bad-token' };
    (verifyToken as any).mockReturnValue(null);

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(next.mock.calls[0][0].message).toBe('Invalid or expired token');
  });
});
