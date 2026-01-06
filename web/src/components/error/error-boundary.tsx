/**
 * Error Boundary Components
 *
 * React error boundaries for catching and displaying errors gracefully.
 * Provides fallback UI and error recovery options.
 */

'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// =============================================================================
// Types
// =============================================================================

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Called when the error boundary resets */
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// =============================================================================
// Icons
// =============================================================================

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9v4m0 4h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23 4v6h-6M1 20v-6h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 22V12h6v10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// Error Boundary Class Component
// =============================================================================

/**
 * React Error Boundary for catching JavaScript errors in child components.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.reset);
        }
        return this.props.fallback;
      }

      // Default fallback
      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Default Error Fallback
// =============================================================================

interface DefaultErrorFallbackProps {
  error: Error;
  onReset?: () => void;
  showHome?: boolean;
}

/**
 * Default error fallback UI with retry and home navigation options.
 */
export function DefaultErrorFallback({
  error,
  onReset,
  showHome = true,
}: DefaultErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mb-4">
            <AlertTriangleIcon className="w-8 h-8 text-status-error" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred'}
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                Error details
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                {error.stack || error.toString()}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onReset && (
              <Button
                variant="default"
                className="flex-1"
                onClick={onReset}
              >
                <RefreshIcon className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            {showHome && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => (window.location.href = '/hub')}
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Specialized Error Fallbacks
// =============================================================================

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  onGoBack?: () => void;
  showDetails?: boolean;
}

/**
 * Full-page error fallback for page-level errors.
 */
export function PageErrorFallback({
  title = 'Page Error',
  message = 'We encountered an error loading this page.',
  error,
  onRetry,
  onGoBack,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-status-error/10 flex items-center justify-center mb-6">
        <AlertTriangleIcon className="w-10 h-10 text-status-error" />
      </div>

      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>

      {showDetails && error && (
        <details className="mb-6 text-left w-full max-w-md">
          <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
            Technical details
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-48">
            {error.stack || error.message}
          </pre>
        </details>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshIcon className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            Go Back
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/hub')}
        >
          <HomeIcon className="w-4 h-4 mr-2" />
          Return to Hub
        </Button>
      </div>
    </div>
  );
}

/**
 * Inline error fallback for component-level errors.
 */
export function InlineErrorFallback({
  title = 'Error',
  message = 'Something went wrong.',
  error,
  onRetry,
  showDetails = process.env.NODE_ENV === 'development',
}: Omit<ErrorFallbackProps, 'onGoBack'>) {
  return (
    <div className="flex flex-col items-center p-6 text-center border border-status-error/20 bg-status-error/5 rounded-card">
      <AlertTriangleIcon className="w-8 h-8 text-status-error mb-3" />
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{message}</p>

      {showDetails && error && (
        <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded mb-3 max-w-full overflow-hidden text-ellipsis">
          {error.message}
        </p>
      )}

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshIcon className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Compact error indicator for tight spaces.
 */
export function CompactErrorFallback({
  message = 'Error',
  onRetry,
}: Pick<ErrorFallbackProps, 'message' | 'onRetry'>) {
  return (
    <div className="flex items-center gap-2 p-2 text-sm text-status-error bg-status-error/5 rounded">
      <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-status-error rounded"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Session-Specific Error Fallback
// =============================================================================

interface SessionErrorFallbackProps {
  error: Error;
  sessionId?: string;
  onRetry?: () => void;
}

/**
 * Session-specific error fallback with session context.
 */
export function SessionErrorFallback({
  error,
  sessionId,
  onRetry,
}: SessionErrorFallbackProps) {
  const isNotFound = error.message.toLowerCase().includes('not found');
  const isConnectionError = error.message.toLowerCase().includes('connection') ||
    error.message.toLowerCase().includes('network');

  let title = 'Session Error';
  let message = error.message;

  if (isNotFound) {
    title = 'Session Not Found';
    message = 'This session may have ended or the link may be invalid.';
  } else if (isConnectionError) {
    title = 'Connection Lost';
    message = 'Unable to connect to the session. Please check your internet connection.';
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mb-4">
        <AlertTriangleIcon className="w-8 h-8 text-status-error" />
      </div>

      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">{message}</p>

      {sessionId && (
        <p className="text-xs text-muted-foreground mb-4">
          Session ID: {sessionId}
        </p>
      )}

      <div className="flex gap-3">
        {onRetry && isConnectionError && (
          <Button onClick={onRetry}>
            <RefreshIcon className="w-4 h-4 mr-2" />
            Reconnect
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => (window.location.href = '/hub')}
        >
          <HomeIcon className="w-4 h-4 mr-2" />
          Return to Hub
        </Button>
      </div>
    </div>
  );
}
