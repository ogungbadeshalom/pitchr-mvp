import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    });
    pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  return { rows: result.rows, rowCount: result.rowCount, duration };
}

export async function runMigrations() {
  const fs = await import('fs');
  const path = await import('path');
  const devDir = path.default.join(__dirname, '../database/migrations');
  const prodDir = path.default.join(__dirname, '../../src/database/migrations');
  const migrationDir = fs.existsSync(devDir) ? devDir : prodDir;
  if (!fs.existsSync(migrationDir)) {
    logger.error('Migration directory not found', { dir: migrationDir });
    return;
  }
  const files = fs.readdirSync(migrationDir).sort();
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.default.join(migrationDir, file), 'utf-8');
      await query(sql);
      logger.info(`Migration ${file} applied`);
    }
  }
}

export { getPool };
