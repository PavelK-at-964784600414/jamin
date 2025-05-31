import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/app/lib/rate-limiter'

export async function POST(request: NextRequest) {
  // Only accept error reports in production
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ error: 'Not available in development' }, { status: 404 })
  }

  try {
    // Rate limiting
    const clientIp = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = checkRateLimit(clientIp)
    
    if (rateLimitResult.isLimited) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.resetSeconds?.toString() || '60'
          }
        }
      )
    }

    const errorData = await request.json()
    
    // Basic validation
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json({ error: 'Invalid error data' }, { status: 400 })
    }

    // Log the error (replace with your preferred logging service)
    console.error('Client-side error reported:', {
      ...errorData,
      ip: clientIp,
      reportedAt: new Date().toISOString(),
    })

    // TODO: Send to your error tracking service
    // Examples:
    // - Sentry: Sentry.captureException(new Error(errorData.message))
    // - LogRocket: LogRocket.captureException(new Error(errorData.message))
    // - Custom logging service: await logToService(errorData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in error reporting endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
