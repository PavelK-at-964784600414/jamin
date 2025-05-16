import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    console.log('Starting migration: Copy name to title for existing records...');
    
    // Copy name values to title where title is null
    await sql`
      UPDATE themes
      SET title = name
      WHERE title IS NULL AND name IS NOT NULL;
    `;
    
    // Count updated records
    const countResult = await sql`
      SELECT COUNT(*) FROM themes WHERE title IS NOT NULL;
    `;
    
    const count = countResult.rows[0].count;
    
    return NextResponse.json({ 
      message: 'Migration completed successfully', 
      updatedRecords: count
    });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
