'use client'
 
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { logger } from '@/app/lib/logger'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Application error', { metadata: { error: error instanceof Error ? error.message : String(error) } })
    
    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Replace with your error reporting service (Sentry, LogRocket, etc.)
      const errorReport = {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
      
      // Example: Send to your logging service
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      }).catch(() => {
        // Silently fail if error reporting fails
      })
    }
  }, [error])
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="flex justify-center mb-8">
          <ExclamationTriangleIcon className="w-24 h-24 text-red-500" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-300 mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-8 max-w-md">
          We&apos;re sorry, but something went wrong on our end. Please try again or contact support if the problem persists.
        </p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors mr-4"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-8 text-left bg-gray-800 p-4 rounded-lg">
            <summary className="text-gray-300 cursor-pointer">Error Details (Development Only)</summary>
            <pre className="text-red-400 text-sm mt-2 whitespace-pre-wrap">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
