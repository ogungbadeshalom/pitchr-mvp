import rateLimit from 'express-rate-limit';

export const sessionRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'RATE_LIMITED', message: 'Too many requests. Try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'RATE_LIMITED', message: 'Too many requests.' },
  standardHeaders: true,
  legacyHeaders: false,
});
