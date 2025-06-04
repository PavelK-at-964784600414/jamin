'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { logger } from '@/app/lib/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', { metadata: { data: error, errorInfo } })
    
    this.setState({
      error,
      errorInfo,
    })

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error reporting service (e.g., Sentry, LogRocket)
      logger.error('Production error', { 
        metadata: { 
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        }
      })
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-6">
              <MusicalNoteIcon className="w-16 h-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h1>
            
            <p className="text-gray-400 mb-6">
              We&apos;re sorry, but something unexpected happened. The error has been logged and we&apos;ll look into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-gray-800 p-4 rounded-lg mb-6">
                <summary className="text-red-400 cursor-pointer mb-2">
                  Error Details (Development Mode)
                </summary>
                <pre className="text-xs text-gray-300 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
