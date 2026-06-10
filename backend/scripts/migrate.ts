import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { query, getPool } from '../src/config/database';
import fs from 'fs';

async function migrate() {
  const devDir = path.join(__dirname, '../src/database/migrations');
  const prodDir = path.join(__dirname, '../dist/database/migrations');
  const migrationDir = fs.existsSync(devDir) ? devDir : prodDir;

  if (!fs.existsSync(migrationDir)) {
    console.error('Migration directory not found:', migrationDir);
    process.exit(1);
  }

  const files = fs.readdirSync(migrationDir).sort();
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
      await query(sql);
      console.log(`Applied: ${file}`);
    }
  }
  console.log('All migrations applied');
  await (await getPool()).end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
