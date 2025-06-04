import { NextRequest, NextResponse } from 'next/server';
import { fetchCollaborationData } from '@/app/lib/data';
import { logger } from '@/app/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const collaborations = await fetchCollaborationData();
    return NextResponse.json(collaborations);
  } catch (error) {
    logger.error('Failed to fetch collaboration data', { metadata: { error: error instanceof Error ? error.message : String(error) } });
    return NextResponse.json(
      { error: 'Failed to fetch collaboration data' },
      { status: 500 }
    );
  }
}
