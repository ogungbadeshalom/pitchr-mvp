export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', 404, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'UNAUTHORIZED', 401, context);
  }
}

export class PaymentError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'PAYMENT_ERROR', 402, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'FORBIDDEN', 403, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFLICT', 409, context);
  }
}
