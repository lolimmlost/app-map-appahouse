import pg from 'pg';
import { config } from 'dotenv';

config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('ALTER TABLE integrations ADD COLUMN IF NOT EXISTS username TEXT');
  await pool.query('ALTER TABLE integrations ADD COLUMN IF NOT EXISTS password TEXT');
  console.log('Migration completed successfully');
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
}
