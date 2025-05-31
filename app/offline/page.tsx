'use client'

import React from 'react'
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
        <div className="mb-6">
          <WifiIcon className="w-16 h-16 text-white/70 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Offline</h1>
          <p className="text-white/70">
            It looks like you&apos;ve lost your internet connection. Some features may not be available.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={handleGoHome}
            className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors border border-white/20"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-8 text-sm text-white/50">
          <p className="mb-2">While offline, you can still:</p>
          <ul className="text-left space-y-1">
            <li>• View cached content</li>
            <li>• Use basic tools</li>
            <li>• Access saved data</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
