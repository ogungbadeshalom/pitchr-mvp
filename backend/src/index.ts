// dotenv must load BEFORE any other imports resolve
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { createApp } from './server';
import { runMigrations } from './config/database';
import { logger } from './utils/logger';

const PORT = Number(process.env.PORT) || 5001;

async function main() {
  await runMigrations();
  logger.info('Database migrations applied');

  const app = createApp();

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  logger.error('Failed to start server', { error: err });
  process.exit(1);
});
