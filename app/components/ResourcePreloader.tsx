'use client'

import { useEffect } from 'react'

export function ResourcePreloader() {
  useEffect(() => {
    // Preload critical assets
    const criticalAssets = [
      '/members/user.png',
      '/hero-desktop.png',
      '/hero-mobile.png',
    ]

    criticalAssets.forEach((asset) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = asset
      document.head.appendChild(link)
    })

    // Preload critical fonts (already handled by Next.js font optimization)
    // But we can add font-display: swap to improve loading
    const style = document.createElement('style')
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }
      @font-face {
        font-family: 'Lusitana';
        font-display: swap;
      }
    `
    document.head.appendChild(style)

    // Prefetch likely next pages
    const prefetchUrls = [
      '/dashboard/themes',
      '/dashboard/tools',
      '/dashboard/members',
    ]

    prefetchUrls.forEach((url) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      document.head.appendChild(link)
    })
  }, [])

  return null
}
