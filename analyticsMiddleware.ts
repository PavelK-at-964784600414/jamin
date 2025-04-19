import { NextRequest, NextResponse } from 'next/server';

export function analyticsMiddleware(request: NextRequest) {
  // Track analytics
  const ipAddress = request.headers.get('x-forwarded-for') || request.ip || 'Unknown IP';
  console.log('Tracking analytics for:', request.url);
  console.log('User agent:', request.headers.get('user-agent'));
  console.log('IP address:', ipAddress);

  // Check for suspicious activities
  const userAgent = request.headers.get('user-agent') || '';
  if (userAgent.includes('suspicious-bot')) {
    console.warn('Suspicious activity detected from:', userAgent, 'IP address:', ipAddress);
    // You can add more logic here to handle suspicious activities
  }

  return NextResponse.next();
}