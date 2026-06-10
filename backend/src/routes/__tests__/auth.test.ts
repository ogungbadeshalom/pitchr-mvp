import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserByEmailWithPassword: vi.fn(),
  signToken: vi.fn(() => 'test-jwt-token'),
  hash: vi.fn(() => 'hashed-password'),
  compare: vi.fn(),
}));

vi.mock('../../config/database', () => ({ query: mocks.query }));
vi.mock('../../database/queries', () => ({
  findUserByEmail: mocks.findUserByEmail,
  findUserByEmailWithPassword: mocks.findUserByEmailWithPassword,
}));
vi.mock('../../config/jwt', () => ({ signToken: mocks.signToken }));

import bcrypt from 'bcryptjs';
bcrypt.hash = mocks.hash;
bcrypt.compare = mocks.compare;

import express from 'express';
import authRouter from '../auth';

function createAuthApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.code || 'INTERNAL_ERROR', message: err.message });
  });
  return app;
}

import request from 'supertest';

describe('POST /api/auth/signup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should fail if email is missing', async () => {
    const res = await request(createAuthApp()).post('/api/auth/signup').send({ password: 'test1234!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('should fail if password is missing', async () => {
    const res = await request(createAuthApp()).post('/api/auth/signup').send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('should fail if password too short', async () => {
    const res = await request(createAuthApp()).post('/api/auth/signup').send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
  });

  it('should fail if email exists', async () => {
    mocks.findUserByEmail.mockResolvedValue({ id: 'existing' });
    const res = await request(createAuthApp()).post('/api/auth/signup').send({ email: 'a@b.com', password: 'longenough' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('CONFLICT');
  });

  it('should create user on success', async () => {
    mocks.findUserByEmail.mockResolvedValue(null);
    mocks.query.mockResolvedValue({
      rows: [{ id: 'new-id', email: 'new@test.com', subscription_tier: 'free', proposal_count_this_month: 0, proposal_limit_this_month: 0 }],
    });
    const res = await request(createAuthApp()).post('/api/auth/signup').send({ email: 'new@test.com', password: 'test1234!', firstName: 'T', lastName: 'U' });
    expect(res.status).toBe(201);
    expect(res.body.user.subscription_tier).toBe('free');
    expect(res.body.token).toBe('test-jwt-token');
  });
});

describe('POST /api/auth/signin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should fail if email missing', async () => {
    const res = await request(createAuthApp()).post('/api/auth/signin').send({ password: 'x' });
    expect(res.status).toBe(400);
  });

  it('should fail if user not found', async () => {
    mocks.findUserByEmailWithPassword.mockResolvedValue(null);
    const res = await request(createAuthApp()).post('/api/auth/signin').send({ email: 'no@user.com', password: 'test1234!' });
    expect(res.status).toBe(401);
  });

  it('should fail if password wrong', async () => {
    mocks.findUserByEmailWithPassword.mockResolvedValue({ id: 'u1', email: 'a@b.com', password_hash: 'hash' });
    mocks.compare.mockResolvedValue(false);
    const res = await request(createAuthApp()).post('/api/auth/signin').send({ email: 'a@b.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('should sign in successfully', async () => {
    const user = { id: 'u1', email: 'a@b.com', password_hash: 'hash', first_name: 'Test', subscription_tier: 'starter', proposal_count_this_month: 2, proposal_limit_this_month: 10 };
    mocks.findUserByEmailWithPassword.mockResolvedValue(user);
    mocks.compare.mockResolvedValue(true);
    const res = await request(createAuthApp()).post('/api/auth/signin').send({ email: 'a@b.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body.user.subscription_tier).toBe('starter');
    expect(res.body.token).toBe('test-jwt-token');
  });
});

describe('POST /api/auth/signout', () => {
  it('should clear cookie and return ok', async () => {
    const res = await request(createAuthApp()).post('/api/auth/signout').send();
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Signed out');
  });
});
