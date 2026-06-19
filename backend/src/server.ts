import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { middleware } from 'supertokens-node/framework/express';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { initSuperTokens } from './config/supertokens';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import proposalsRouter from './routes/proposals';
import paymentsRouter from './routes/payments';
import sessionsRouter from './routes/sessions';
import userRouter from './routes/user';
import adminRouter from './routes/admin';

export function createApp() {
  initSuperTokens();

  const app = express();

  app.set('trust proxy', 1);

  const frontendUrl = process.env.FRONTEND_URL;
  if (process.env.NODE_ENV === 'production' && !frontendUrl) {
    console.error('FRONTEND_URL must be set in production');
    process.exit(1);
  }

  app.use(cors({
    origin: frontendUrl || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  // Custom auth routes before SuperTokens middleware to take priority
  app.use('/api/auth', authRouter);

  // SuperTokens middleware handles remaining /api/auth/* paths (session refresh, etc.)
  app.use(middleware());

  app.use('/api/health', healthRouter);
  app.use('/api/proposals', proposalsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/user', userRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);

  return app;
}
