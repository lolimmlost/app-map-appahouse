import pg from 'pg';
import { config } from 'dotenv';

config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query("ALTER TYPE widget_type ADD VALUE IF NOT EXISTS 'notes'");
  console.log('Migration completed successfully - added notes widget type');
} catch (e) {
  // If the value already exists, postgres will throw an error
  if (e.message.includes('already exists')) {
    console.log('Notes widget type already exists');
  } else {
    console.error('Error:', e.message);
  }
} finally {
  await pool.end();
}
