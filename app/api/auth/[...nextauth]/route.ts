import { handlers } from '@/auth';
import { NextRequest } from 'next/server'; // NextResponse removed as it's no longer used

// Force Node.js Runtime for bcryptjs compatibility
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}
