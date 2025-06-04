'use client';

import { useEffect } from 'react';
import { loadOpenCV } from '@/app/lib/opencv-utils';
import { logger } from '@/app/lib/logger';

export default function OpenCVPreloader() {
  useEffect(() => {
    // Start loading OpenCV in the background as soon as the app starts
    loadOpenCV().catch((error) => {
      logger.warn('OpenCV preload failed', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      // Don't throw error, just log it - the individual components will handle their own loading
    });
  }, []);

  // This component doesn't render anything
  return null;
}
