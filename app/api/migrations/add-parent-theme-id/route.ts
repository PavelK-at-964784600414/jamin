import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Add parent_theme_id column to themes table if it doesn't exist
    await sql`
      ALTER TABLE themes
      ADD COLUMN IF NOT EXISTS parent_theme_id INT,
      ADD COLUMN IF NOT EXISTS instrument VARCHAR(64),
      ADD COLUMN IF NOT EXISTS title VARCHAR(64),
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS genre VARCHAR(64);
    `;
    
    // Add a foreign key constraint to parent_theme_id
    await sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints tc
          WHERE tc.constraint_name = 'themes_parent_theme_id_fkey'
        ) THEN
          ALTER TABLE themes
          ADD CONSTRAINT themes_parent_theme_id_fkey
          FOREIGN KEY (parent_theme_id) REFERENCES themes(id);
        END IF;
      END $$;
    `;

    return NextResponse.json({ message: 'Database migration completed successfully' });
  } catch (error) {
    console.error('Database migration failed:', error);
    return NextResponse.json({ error: 'Database migration failed' }, { status: 500 });
  }
}
