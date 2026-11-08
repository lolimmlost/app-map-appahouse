import pg from 'pg';
import { config } from 'dotenv';

config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  // ADD VALUE IF NOT EXISTS is idempotent, so this is safe to re-run
  await pool.query("ALTER TYPE integration_type ADD VALUE IF NOT EXISTS 'home_assistant'");
  await pool.query("ALTER TYPE widget_type ADD VALUE IF NOT EXISTS 'home_assistant'");
  console.log('Migration completed successfully - added home_assistant integration and widget types');
} catch (e) {
  console.error('Error:', e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
