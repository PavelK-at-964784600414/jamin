'use client'

import { useEffect } from 'react'

interface PerformanceMetric {
  name: string
  value: number
  delta?: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
}

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return
    }

    // Monitor Long Tasks (>50ms)
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`, entry)
          }
        })
      })

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        // Long tasks not supported in all browsers
      }

      // Monitor Layout Shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        
        if (clsValue > 0.1) {
          console.warn(`High Cumulative Layout Shift: ${clsValue}`)
        }
      })

      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Layout shift not supported in all browsers
      }

      // Monitor Memory Usage (Chrome only)
      if ('memory' in performance) {
        const checkMemory = () => {
          const memory = (performance as any).memory
          const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
          const totalMB = Math.round(memory.totalJSHeapSize / 1048576)
          
          if (usedMB > 100) { // Warn if over 100MB
            console.warn(`High memory usage: ${usedMB}MB / ${totalMB}MB`)
          }
        }

        // Check memory every 30 seconds
        const memoryInterval = setInterval(checkMemory, 30000)
        
        return () => {
          clearInterval(memoryInterval)
          longTaskObserver.disconnect()
          layoutShiftObserver.disconnect()
        }
      }

      return () => {
        longTaskObserver.disconnect()
        layoutShiftObserver.disconnect()
      }
    }

    // Return undefined explicitly for the case when PerformanceObserver is not available
    return undefined
  }, [])

  return null
}
