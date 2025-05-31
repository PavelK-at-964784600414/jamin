'use client';

import { lazy, Suspense } from 'react';
import { withLazyLoading, LoadingSpinner } from '../components/LazyLoader';

// Lazy load heavy tool components
const LazyChordGenerator = lazy(() => import('@/app/ui/tools/ChordGenerator'));
const LazyMetronome = lazy(() => import('@/app/ui/tools/Metronome'));
const LazyInstrumentAssistant = lazy(() => import('@/app/ui/tools/InstrumentAssistant'));
const LazyFretboardDetector = lazy(() => import('@/app/ui/tools/FretboardDetector'));
const LazyFretboardVisualizer = lazy(() => import('@/app/ui/tools/FretboardVisualizer'));

// Wrap components with lazy loading higher-order component
export const ChordGeneratorLazy = withLazyLoading(LazyChordGenerator, {
  fallback: <LoadingSpinner size="lg" />
});

export const MetronomeLazy = withLazyLoading(LazyMetronome, {
  fallback: <LoadingSpinner size="lg" />
});

export const InstrumentAssistantLazy = withLazyLoading(LazyInstrumentAssistant, {
  fallback: <LoadingSpinner size="lg" />
});

export const FretboardDetectorLazy = withLazyLoading(LazyFretboardDetector, {
  fallback: <LoadingSpinner size="lg" />
});

export const FretboardVisualizerLazy = withLazyLoading(LazyFretboardVisualizer, {
  fallback: <LoadingSpinner size="lg" />
});

// Export direct lazy components for dynamic imports
export {
  LazyChordGenerator,
  LazyMetronome,
  LazyInstrumentAssistant,
  LazyFretboardDetector,
  LazyFretboardVisualizer
};
