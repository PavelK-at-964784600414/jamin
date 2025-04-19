import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { analyticsMiddleware } from './analyticsMiddleware';

export default function middleware(request: NextRequest) {
  // Apply analytics middleware
  const response = analyticsMiddleware(request);

  // Apply authentication middleware
  return NextAuth(authConfig).auth(request, response);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.mp3$|.*\\.wav$).*)'],
};