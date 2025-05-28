import { NextRequest, NextResponse } from 'next/server';
import { fetchCollaborationData } from '@/app/lib/data';

export async function GET(request: NextRequest) {
  try {
    const collaborations = await fetchCollaborationData();
    return NextResponse.json(collaborations);
  } catch (error) {
    console.error('Failed to fetch collaboration data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaboration data' },
      { status: 500 }
    );
  }
}
