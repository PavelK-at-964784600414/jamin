'use client'

import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // Replace with your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: send to Google Analytics, Vercel Analytics, etc.
    console.log('Web Vital:', metric)
    
    // You can send to your analytics service here
    // Example for Google Analytics:
    // gtag('event', metric.name, {
    //   event_category: 'Web Vitals',
    //   event_label: metric.id,
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   non_interaction: true,
    // })
  }
}

export function reportWebVitals() {
  try {
    onCLS(sendToAnalytics)
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
    onINP(sendToAnalytics) // Replaces FID in web-vitals v3+
  } catch (err) {
    console.error('Error collecting web vitals:', err)
  }
}
