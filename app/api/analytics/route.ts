import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/app/lib/rate-limiter'

interface AnalyticsEvent {
  name: string
  properties: Record<string, any>
  timestamp: number
}

interface AnalyticsRequest {
  events: AnalyticsEvent[]
  sessionId: string
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIP = request.ip || 
                    request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 
                    'unknown'

    const rateLimitResult = checkRateLimit(clientIP)
    
    if (rateLimitResult.isLimited) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.resetSeconds || 60
        },
        { status: 429 }
      )
    }

    // Parse request body
    const body: AnalyticsRequest = await request.json()
    
    // Validate request
    if (!body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      )
    }

    if (!body.sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Process analytics events
    const processedEvents = body.events.map(event => ({
      ...event,
      clientIP,
      sessionId: body.sessionId,
      receivedAt: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || '',
      url: request.url
    }))

    // Log events (in production, you'd send to analytics service)
    console.log('[Analytics] Received events:', {
      count: processedEvents.length,
      sessionId: body.sessionId,
      clientIP,
      events: processedEvents.map(e => ({
        name: e.name,
        timestamp: e.timestamp,
        url: e.properties?.url
      }))
    })

    // In production, you would:
    // 1. Send to analytics service (Google Analytics, Mixpanel, Amplitude, etc.)
    // 2. Store in database for custom analytics
    // 3. Forward to data warehouse
    
    // Example integrations:
    await Promise.all([
      // sendToGoogleAnalytics(processedEvents),
      // sendToMixpanel(processedEvents),
      // storeInDatabase(processedEvents),
      logAnalyticsEvents(processedEvents)
    ])

    return NextResponse.json({ 
      success: true,
      processed: processedEvents.length,
      sessionId: body.sessionId
    })

  } catch (error) {
    console.error('[Analytics] Error processing events:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

// Log analytics events for debugging/monitoring
async function logAnalyticsEvents(events: any[]) {
  // Group events by type for better logging
  const eventsByType = events.reduce((acc, event) => {
    if (!acc[event.name]) {
      acc[event.name] = []
    }
    acc[event.name].push(event)
    return acc
  }, {} as Record<string, any[]>)

  for (const [eventType, eventList] of Object.entries(eventsByType)) {
    const events = eventList as any[]
    console.log(`[Analytics] ${eventType}: ${events.length} events`)
    
    // Log specific important events with more detail
    if (['javascript_error', 'slow_resource', 'web_vital_cls'].includes(eventType)) {
      events.forEach(event => {
        console.log(`[Analytics] ${eventType} details:`, {
          timestamp: new Date(event.timestamp).toISOString(),
          properties: event.properties,
          sessionId: event.sessionId
        })
      })
    }
  }
}

// Example function to send to Google Analytics
async function sendToGoogleAnalytics(events: any[]) {
  // Implementation would depend on your GA setup
  // This is just a placeholder
  console.log('[Analytics] Would send to Google Analytics:', events.length, 'events')
}

// Example function to send to Mixpanel
async function sendToMixpanel(events: any[]) {
  // Implementation would use Mixpanel API
  console.log('[Analytics] Would send to Mixpanel:', events.length, 'events')
}

// Example function to store in database
async function storeInDatabase(events: any[]) {
  // Implementation would store in your database
  console.log('[Analytics] Would store in database:', events.length, 'events')
}

export async function GET() {
  return NextResponse.json(
    { message: 'Analytics endpoint is active' },
    { status: 200 }
  )
}
