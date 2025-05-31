'use client';

import { Suspense, ComponentType } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface LazyLoaderProps {
  fallback?: React.ReactNode;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner = ({ size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div 
        className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  options: LazyLoaderProps = {}
) {
  const { 
    fallback = <LoadingSpinner />
  } = options;

  return function LazyWrapper(props: P) {
    return (
      <ErrorBoundary>
        <Suspense fallback={fallback}>
          <Component {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

export { LoadingSpinner };
