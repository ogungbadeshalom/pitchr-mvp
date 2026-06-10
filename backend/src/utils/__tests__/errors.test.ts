import { describe, it, expect } from 'vitest';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, PaymentError, ForbiddenError, ConflictError } from '../errors';

describe('AppError', () => {
  it('should create with message, code, statusCode', () => {
    const err = new AppError('test', 'TEST_CODE', 418, { detail: 'extra' });
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST_CODE');
    expect(err.statusCode).toBe(418);
    expect(err.context).toEqual({ detail: 'extra' });
    expect(err.name).toBe('AppError');
  });
});

describe('ValidationError', () => {
  it('should use 400 status and VALIDATION_ERROR code', () => {
    const err = new ValidationError('Bad input', { field: 'email' });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Bad input');
    expect(err.context).toEqual({ field: 'email' });
  });
});

describe('UnauthorizedError', () => {
  it('should use 401 status and UNAUTHORIZED code', () => {
    const err = new UnauthorizedError('Invalid token');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });
});

describe('NotFoundError', () => {
  it('should use 404 status and NOT_FOUND code', () => {
    const err = new NotFoundError('User not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });
});

describe('PaymentError', () => {
  it('should use 402 status and PAYMENT_ERROR code', () => {
    const err = new PaymentError('Card declined');
    expect(err.statusCode).toBe(402);
    expect(err.code).toBe('PAYMENT_ERROR');
  });
});

describe('ForbiddenError', () => {
  it('should use 403 status and FORBIDDEN code', () => {
    const err = new ForbiddenError('No access');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ConflictError', () => {
  it('should use 409 status and CONFLICT code', () => {
    const err = new ConflictError('Email exists');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });
});
