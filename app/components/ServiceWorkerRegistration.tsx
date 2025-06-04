'use client'

import { useEffect } from 'react'
import { logger } from '@/app/lib/logger';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isProduction = process.env.NODE_ENV === 'production';

    if (isSafari && isProduction) {
      logger.debug(`Safari production mode detected. Protocol: ${window.location.protocol}, Hostname: ${window.location.hostname}`);
      
      // If Safari, in production, on localhost (any protocol) -> aggressively clean up and skip Service Worker
      if (window.location.hostname === 'localhost') {
        logger.warn(
          'Safari production mode on localhost detected. ' +
          'Cleaning up any existing Service Workers and caches to prevent SSL/fetch errors. ' +
          'Service worker registration will be SKIPPED. ' +
          'For Safari Service Worker testing, please use a deployed environment with a valid SSL certificate. ' +
          `Current URL: ${window.location.href}`
        );
        
        // Aggressively clean up any existing Service Workers and caches for Safari on localhost
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            const unregisterPromises = registrations.map((registration) => {
              logger.debug('Unregistering existing Service Worker for Safari localhost', { metadata: { scope: registration.scope } });
              return registration.unregister();
            });
            return Promise.all(unregisterPromises);
          }).then((results) => {
            logger.debug('All Service Workers unregistered for Safari localhost');
            
            // Clear all caches after unregistering Service Workers
            if ('caches' in window) {
              return caches.keys().then((cacheNames) => {
                const deletePromises = cacheNames.map(cacheName => {
                  logger.debug('Clearing cache for Safari localhost cleanup', { metadata: { cacheName } });
                  return caches.delete(cacheName);
                });
                return Promise.all(deletePromises);
              });
            }
            return Promise.resolve([]);
          }).then(() => {
            logger.debug('All caches cleared for Safari localhost cleanup');
          }).catch((error) => {
            logger.warn('Error during Safari localhost Service Worker cleanup', { 
              metadata: { error: error instanceof Error ? error.message : String(error) } 
            });
          });
        }
        
        return; // Skip SW registration for Safari on localhost
      }
      
      // Safari-specific registration for deployed environments (not localhost)
      logger.debug('Attempting Safari-compatible Service Worker registration (deployed environment).');
      if ('serviceWorker' in navigator) {
        // Clear caches first to avoid conflicts - this part is specific to Safari on deployed environments
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            const deletePromises = cacheNames.map(cacheName => {
              logger.debug('Clearing cache for Safari (deployed environment)', { metadata: { cacheName } });
              return caches.delete(cacheName);
            });
            return Promise.all(deletePromises);
          }).catch(() => {
            logger.debug('Cache clearing for Safari (deployed environment) completed or failed.');
          });
        }
        
        navigator.serviceWorker.register('/sw.js', { 
          scope: '/',
          updateViaCache: 'none'
        }).then((registration) => {
          logger.debug('Safari Service Worker registered successfully');
          
          // Handle updates more carefully for Safari
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  logger.debug('New Safari service worker installed');
                  // Force activation without user prompt in Safari
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  // Auto-reload for Safari to avoid state conflicts
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
            }
          });
          
        }).catch((error) => {
          logger.warn('Safari Service Worker registration failed (this is expected if SSL issues exist)', { 
            metadata: { error: error instanceof Error ? error.message : String(error) } 
          });
          // Continue without service worker in Safari if registration fails
        });
      }
      return; // End of Safari-production block (for deployed environments)
    }
    
    // Non-Safari browsers or development mode for Safari
    if ('serviceWorker' in navigator) {
      if (isSafari && !isProduction) { // Safari in development mode
        logger.debug('Safari development mode detected - skipping Service Worker registration.');
        return;
      }

      // Standard registration for non-Safari browsers (any mode)
      logger.debug('Attempting standard Service Worker registration for non-Safari browser.');
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.debug('Service Worker registered successfully', { metadata: { data: registration } })
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker installed, prompt user to refresh
                  if (confirm('A new version is available. Refresh to update?')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          logger.error('Service Worker registration failed', { metadata: { error: error instanceof Error ? error.message : String(error) } })
        })

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        logger.debug('Message from SW', { metadata: { data: event.data } })
      })

      // Handle online/offline events
      window.addEventListener('online', () => {
        logger.debug('App is online')
        // Sync data when coming back online
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'SYNC_DATA' })
        }
      })

      window.addEventListener('offline', () => {
        logger.debug('App is offline')
      })
    }
  }, [])

  return null
}
