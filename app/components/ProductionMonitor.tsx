'use client'

import { useEffect, useRef, useCallback } from 'react'

interface AnalyticsEvent {
  name: string
  properties: Record<string, any>
  timestamp: number
}

interface ErrorEvent {
  message: string
  stack?: string
  url: string
  line?: number
  column?: number
  timestamp: number
  userAgent: string
  userId?: string
}

interface PerformanceEvent {
  name: string;
  value: number;
  type: 'navigation' | 'resource' | 'paint' | 'lcp' | 'fid' | 'cls' | 'custom';
  timestamp: number;
  details?: Record<string, any>;
}

interface NetworkEvent {
  url: string;
  method: string;
  status: number;
  duration: number;
  size?: number;
  type: 'xhr' | 'fetch' | 'beacon';
  timestamp: number;
  error?: string;
}

export default function ProductionMonitor() {
  const analyticsQueue = useRef<AnalyticsEvent[]>([])
  const errorQueue = useRef<ErrorEvent[]>([])
  const performanceQueue = useRef<PerformanceEvent[]>([]) // Added for future use
  const networkQueue = useRef<NetworkEvent[]>([]) // Added for future use
  const isOnline = useRef(navigator.onLine)
  const sessionId = useRef(generateSessionId())

  const flushQueuedData = useCallback((isUnloading = false) => {
    if (!isOnline.current && !isUnloading) {
      console.log('[ProductionMonitor] Offline - queuing data')
      return
    }

    const analyticsToSend = [...analyticsQueue.current]
    const errorsToSend = [...errorQueue.current]
    
    // Clear queues
    analyticsQueue.current = []
    errorQueue.current = []

    // Send analytics data
    if (analyticsToSend.length > 0) {
      try {
        if (isUnloading && navigator.sendBeacon) {
          // Use sendBeacon for immediate sends (page unload)
          navigator.sendBeacon('/api/analytics', JSON.stringify({
            events: analyticsToSend,
            sessionId: sessionId.current
          }))
        } else {
          fetch('/api/analytics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              events: analyticsToSend,
              sessionId: sessionId.current
            })
          }).catch((error) => {
            console.error('[ProductionMonitor] Failed to send analytics:', error)
            // Re-queue failed events
            analyticsQueue.current.unshift(...analyticsToSend)
          })
        }
        
        console.log(`[ProductionMonitor] Sent ${analyticsToSend.length} analytics events`)
      } catch (error) {
        console.error('[ProductionMonitor] Failed to send analytics:', error)
        // Re-queue failed events
        analyticsQueue.current.unshift(...analyticsToSend)
      }
    }

    // Send error data
    if (errorsToSend.length > 0) {
      try {
        if (isUnloading && navigator.sendBeacon) {
          navigator.sendBeacon('/api/errors', JSON.stringify({
            errors: errorsToSend,
            sessionId: sessionId.current
          }))
        } else {
          fetch('/api/errors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              errors: errorsToSend,
              sessionId: sessionId.current
            })
          }).catch((error) => {
            console.error('[ProductionMonitor] Failed to send errors:', error)
            // Re-queue failed errors
            errorQueue.current.unshift(...errorsToSend)
          })
        }
        
        console.log(`[ProductionMonitor] Sent ${errorsToSend.length} error events`)
      } catch (error) {
        console.error('[ProductionMonitor] Failed to send errors:', error)
        // Re-queue failed errors
        errorQueue.current.unshift(...errorsToSend)
      }
    }
  }, [isOnline])

  const trackEvent = useCallback((event: AnalyticsEvent | ErrorEvent | PerformanceEvent | NetworkEvent) => {
    // TODO: Implement specific queuing logic based on event type
    // For now, all events are pushed to analyticsQueue as a placeholder
    if ('message' in event && 'stack' in event) { // Heuristic for ErrorEvent
      errorQueue.current.push(event as ErrorEvent);
      if (errorQueue.current.length > 20) {
        flushQueuedData();
      }
    } else if ('value' in event && ('type' in event && ['navigation', 'resource', 'paint', 'lcp', 'fid', 'cls', 'custom'].includes(event.type))) { // Heuristic for PerformanceEvent
      performanceQueue.current.push(event as PerformanceEvent);
      if (performanceQueue.current.length > 50) {
        // Potentially flush performance data separately or with analytics
        flushQueuedData(); 
      }
    } else if ('url' in event && 'status' in event && 'method' in event) { // Heuristic for NetworkEvent
      networkQueue.current.push(event as NetworkEvent);
      if (networkQueue.current.length > 50) {
        // Potentially flush network data separately or with analytics
        flushQueuedData();
      }
    } else if ('name' in event && 'properties' in event) { // Heuristic for AnalyticsEvent
      analyticsQueue.current.push(event as AnalyticsEvent);
      if (analyticsQueue.current.length > 50) {
        flushQueuedData();
      }
    } else {
      console.warn('[ProductionMonitor] Unknown event type - not queuing:', event);
      // Do not push to any queue if the type is truly unknown and unhandled by heuristics
      // analyticsQueue.current.push(event as AnalyticsEvent); 
    }
  }, [flushQueuedData]);

  const trackPageView = useCallback(() => {
    const event: AnalyticsEvent = {
      name: 'page_view',
      properties: {
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        title: document.title,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        language: navigator.language,
      },
      timestamp: Date.now(),
    }
    trackEvent(event)
  }, [trackEvent])

  const queueErrorEvent = useCallback((error: ErrorEvent) => {
    errorQueue.current.push(error)
    
    // Send errors immediately if online
    if (isOnline.current) {
      flushQueuedData()
    }
  }, [flushQueuedData])

  const setupErrorMonitoring = useCallback(() => {
    // Global error handler
    window.addEventListener('error', (event) => {
      const errorEvent: ErrorEvent = {
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        userId: getCurrentUserId()
      }
      
      queueErrorEvent(errorEvent)
      
      // Track as analytics event too
      trackEvent({ // Explicitly cast to AnalyticsEvent if that's the intent
        name: 'error_captured',
        properties: {
          message: errorEvent.message,
          url: errorEvent.url,
          line: errorEvent.line,
          col: errorEvent.column,
          isUnhandledRejection: false,
        },
        timestamp: errorEvent.timestamp,
      } as AnalyticsEvent);
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason || {};
      const errorEvent: ErrorEvent = {
        message: reason.message || 'Unhandled promise rejection',
        stack: reason.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        userId: getCurrentUserId()
      };
      queueErrorEvent(errorEvent);
      trackEvent({ // Explicitly cast to AnalyticsEvent
        name: 'error_captured',
        properties: {
          message: errorEvent.message,
          url: errorEvent.url,
          isUnhandledRejection: true,
        },
        timestamp: errorEvent.timestamp,
      } as AnalyticsEvent);
    });
  }, [trackEvent, queueErrorEvent]); // Added queueErrorEvent dependency

  const setupPerformanceMonitoring = useCallback(() => {
    // Example: Track LCP (Largest Contentful Paint)
    // This requires the 'web-vitals' library or manual implementation
    // For simplicity, this is a placeholder.
    // In a real scenario, you'd use PerformanceObserver or web-vitals library
    // and call trackEvent with PerformanceEvent data.
    console.log('[ProductionMonitor] Performance monitoring setup (placeholder)');

    // Example of how you might track a custom performance event
    const startTime = performance.now();
    // ... some operation ...
    const endTime = performance.now();
    const customPerfEvent: PerformanceEvent = {
        name: 'custom_operation_duration',
        value: endTime - startTime,
        type: 'custom',
        timestamp: Date.now(),
        details: { operationName: 'some_specific_task' }
    };
    trackEvent(customPerfEvent);

  }, [trackEvent]); // Added trackEvent

  const setupNetworkMonitoring = useCallback(() => {
    // Example: Monkey-patch fetch and XHR to intercept requests
    // This is a simplified example and might need a more robust solution
    console.log('[ProductionMonitor] Network monitoring setup (placeholder)');
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      let response;
      let error;
      try {
        response = await originalFetch(...args);
        return response;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        const duration = Date.now() - startTime;
        const networkEvent: NetworkEvent = {
          url: args[0] instanceof Request ? args[0].url : String(args[0]),
          method: args[0] instanceof Request ? args[0].method : (args[1]?.method || 'GET').toUpperCase(),
          status: response?.status || (error ? 0 : -1), // 0 for network error, -1 for unknown
          duration,
          type: 'fetch',
          timestamp: startTime,
          size: parseInt(response?.headers.get('content-length') || '0', 10) || undefined,
          error: error ? (error as Error).message : undefined,
        };
        trackEvent(networkEvent);
      }
    };
  }, [trackEvent]); // Added trackEvent

  const setupUserTracking = useCallback(() => {
    // Example: Track user interactions or custom events
    console.log('[ProductionMonitor] User tracking setup (placeholder)');
    // document.addEventListener('click', (event) => {
    //   if (event.target instanceof HTMLElement) {
    //     const targetElement = event.target as HTMLElement;
    //     const analyticsEvent: AnalyticsEvent = {
    //       name: 'user_click',
    //       properties: {
    //         target_tag: targetElement.tagName,
    //         target_id: targetElement.id,
    //         target_class: targetElement.className,
    //         text: targetElement.innerText?.substring(0, 50) // Limit text length
    //       },
    //       timestamp: Date.now()
    //     };
    //     trackEvent(analyticsEvent);
    //   }
    // });
  }, []); // Remove unnecessary trackEvent dependency

  useEffect(() => {
    console.log('[ProductionMonitor] Initializing...');

    const handleOnline = () => {
      console.log('[ProductionMonitor] Back online');
      isOnline.current = true;
      flushQueuedData(); // Attempt to flush any queued data
    };

    const handleOffline = () => {
      console.log('[ProductionMonitor] Offline');
      isOnline.current = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushQueuedData(true); // Force immediate send when page is hidden
      }
    };

    const handlePageHide = () => {
      flushQueuedData(true); // More reliable for unload
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide); // More reliable for unload

    // Initial page view
    trackPageView()

    // Setup monitoring
    setupErrorMonitoring()
    setupPerformanceMonitoring()
    setupNetworkMonitoring()
    setupUserTracking()

    // Interval to flush queues
    const flushInterval = setInterval(flushQueuedData, 30000) // Send every 30 seconds

    // Send data on page unload
    const handleBeforeUnload = () => {
      flushQueuedData(true) // Force immediate send
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      console.log('[ProductionMonitor] Cleaning up...');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload); // ensure this is also cleaned up

      // Final flush on component unmount or page unload
      flushQueuedData(true)
      clearInterval(flushInterval)
    }
  }, [trackPageView, setupErrorMonitoring, setupPerformanceMonitoring, setupNetworkMonitoring, setupUserTracking, flushQueuedData]) // Added flushQueuedData

  function generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  function getCurrentUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      // Check localStorage
      const userId = localStorage.getItem('userId')
      if (userId) return userId
      
      // Check sessionStorage
      const sessionUserId = sessionStorage.getItem('userId')
      if (sessionUserId) return sessionUserId
      
      // Check cookies (simple implementation)
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'userId') return value
      }
    } catch (error) {
      // Ignore errors accessing storage
    }
    
    return undefined
  }

  return null
}
