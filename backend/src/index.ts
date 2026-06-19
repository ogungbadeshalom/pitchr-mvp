// dotenv must load BEFORE any other imports resolve
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createApp } from './server';
import { runMigrations, getPool } from './config/database';
import { logger } from './utils/logger';

const PORT = Number(process.env.PORT) || 5001;

async function main() {
  await runMigrations();
  logger.info('Database migrations applied');

  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down...');
    server.close();
    const pool = getPool();
    await pool.end();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down...');
    server.close();
    const pool = getPool();
    await pool.end();
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
