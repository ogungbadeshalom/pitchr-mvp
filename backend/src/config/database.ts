import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
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
  const fs = require('fs');
  const path = require('path');
  const devDir = path.join(__dirname, '../database/migrations');
  const prodDir = path.join(__dirname, '../../src/database/migrations');
  const migrationDir = fs.existsSync(devDir) ? devDir : prodDir;
  if (!fs.existsSync(migrationDir)) {
    console.error('Migration directory not found:', migrationDir);
    return;
  }
  const files = fs.readdirSync(migrationDir).sort();
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
      await query(sql);
      console.log(`Migration ${file} applied`);
    }
  }
}

export { getPool };
