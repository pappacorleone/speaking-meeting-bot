/**
 * WebSocket Disconnect Fallback Components
 *
 * UI components for handling WebSocket disconnection states,
 * reconnection attempts, and connection status visualization.
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { WebSocketConnectionState } from '@/types/events';

// =============================================================================
// Types
// =============================================================================

export interface WebSocketDisconnectFallbackProps {
  /** Current connection state */
  connectionState: WebSocketConnectionState;
  /** Number of reconnection attempts */
  reconnectCount: number;
  /** Maximum reconnection attempts before giving up */
  maxReconnectAttempts?: number;
  /** Error message if connection failed */
  error?: string | null;
  /** Manual reconnect handler */
  onReconnect?: () => void;
  /** Return to hub handler */
  onReturnToHub?: () => void;
  /** Children to show when connected */
  children?: React.ReactNode;
}

export interface ConnectionStatusBannerProps {
  /** Current connection state */
  connectionState: WebSocketConnectionState;
  /** Number of reconnection attempts */
  reconnectCount?: number;
  /** Max attempts for display */
  maxAttempts?: number;
  /** Show dismiss button */
  dismissible?: boolean;
  /** Called when dismissed */
  onDismiss?: () => void;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Icons
// =============================================================================

function WifiOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01"
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />
      <path
        d="M12 2a10 10 0 019.17 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function getConnectionConfig(state: WebSocketConnectionState) {
  switch (state) {
    case 'connecting':
      return {
        icon: LoadingSpinner,
        title: 'Connecting...',
        message: 'Establishing connection to the session.',
        bgColor: 'bg-status-info/10',
        textColor: 'text-status-info',
        borderColor: 'border-status-info/20',
        showSpinner: true,
      };
    case 'reconnecting':
      return {
        icon: RefreshIcon,
        title: 'Reconnecting...',
        message: 'Connection lost. Attempting to reconnect.',
        bgColor: 'bg-status-warning/10',
        textColor: 'text-status-warning',
        borderColor: 'border-status-warning/20',
        showSpinner: true,
      };
    case 'disconnected':
      return {
        icon: WifiOffIcon,
        title: 'Disconnected',
        message: 'You have been disconnected from the session.',
        bgColor: 'bg-status-error/10',
        textColor: 'text-status-error',
        borderColor: 'border-status-error/20',
        showSpinner: false,
      };
    case 'error':
      return {
        icon: WifiOffIcon,
        title: 'Connection Failed',
        message: 'Unable to establish a connection.',
        bgColor: 'bg-status-error/10',
        textColor: 'text-status-error',
        borderColor: 'border-status-error/20',
        showSpinner: false,
      };
    case 'connected':
    default:
      return {
        icon: WifiIcon,
        title: 'Connected',
        message: 'You are connected to the session.',
        bgColor: 'bg-status-active/10',
        textColor: 'text-status-active',
        borderColor: 'border-status-active/20',
        showSpinner: false,
      };
  }
}

// =============================================================================
// WebSocket Disconnect Fallback
// =============================================================================

/**
 * Full-page fallback UI for WebSocket disconnection.
 * Shows when connection is lost and cannot be restored.
 */
export function WebSocketDisconnectFallback({
  connectionState,
  reconnectCount,
  maxReconnectAttempts = 5,
  error,
  onReconnect,
  onReturnToHub,
  children,
}: WebSocketDisconnectFallbackProps) {
  const [showFallback, setShowFallback] = useState(false);

  // Show fallback when connection fails after max attempts or on error
  useEffect(() => {
    if (connectionState === 'error' ||
        (connectionState === 'disconnected' && reconnectCount >= maxReconnectAttempts)) {
      setShowFallback(true);
    } else if (connectionState === 'connected') {
      setShowFallback(false);
    }
  }, [connectionState, reconnectCount, maxReconnectAttempts]);

  // If connected, render children
  if (connectionState === 'connected' && !showFallback) {
    return <>{children}</>;
  }

  // Show reconnecting state inline while reconnecting
  if (connectionState === 'reconnecting' || connectionState === 'connecting') {
    return <>{children}</>;
  }

  // Show fallback UI for disconnected/error states
  if (!showFallback) {
    return <>{children}</>;
  }

  const config = getConnectionConfig(connectionState);
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className={cn(
            'mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4',
            config.bgColor
          )}>
            <Icon className={cn('w-10 h-10', config.textColor)} />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {error || config.message}
          </p>

          {reconnectCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Reconnection attempts: {reconnectCount}/{maxReconnectAttempts}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onReconnect && (
              <Button
                variant="default"
                className="flex-1"
                onClick={onReconnect}
              >
                <RefreshIcon className="w-4 h-4 mr-2" />
                Reconnect
              </Button>
            )}
            {onReturnToHub && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={onReturnToHub}
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Return to Hub
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            If this problem persists, try refreshing the page or check your internet connection.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Connection Status Banner
// =============================================================================

/**
 * Banner component showing current connection status.
 * Useful for displaying at the top of pages during connection issues.
 */
export function ConnectionStatusBanner({
  connectionState,
  reconnectCount = 0,
  maxAttempts = 5,
  dismissible = false,
  onDismiss,
  className,
}: ConnectionStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when connection state changes
  useEffect(() => {
    if (connectionState !== 'connected') {
      setDismissed(false);
    }
  }, [connectionState]);

  // Don't show if connected or dismissed
  if (connectionState === 'connected' || dismissed) {
    return null;
  }

  const config = getConnectionConfig(connectionState);
  const Icon = config.icon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2',
        config.bgColor,
        config.textColor,
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={cn('w-4 h-4 flex-shrink-0', config.showSpinner && 'animate-spin')} />
        <span className="text-sm font-medium truncate">
          {config.title}
          {connectionState === 'reconnecting' && reconnectCount > 0 && (
            <span className="font-normal"> (attempt {reconnectCount}/{maxAttempts})</span>
          )}
        </span>
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 focus:outline-none focus:ring-2 focus:ring-offset-1"
          aria-label="Dismiss"
        >
          <XIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Reconnecting Overlay
// =============================================================================

interface ReconnectingOverlayProps {
  /** Whether the overlay is visible */
  isVisible: boolean;
  /** Current reconnection attempt number */
  attemptNumber?: number;
  /** Maximum reconnection attempts */
  maxAttempts?: number;
  /** Message to display */
  message?: string;
}

/**
 * Full-screen overlay shown during reconnection attempts.
 * Useful for preventing user interaction while reconnecting.
 */
export function ReconnectingOverlay({
  isVisible,
  attemptNumber = 0,
  maxAttempts = 5,
  message = 'Reconnecting to session...',
}: ReconnectingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Reconnecting"
    >
      <div className="text-center p-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-warning/10 flex items-center justify-center">
          <LoadingSpinner className="w-8 h-8 text-status-warning" />
        </div>
        <h2 className="text-lg font-semibold mb-2">{message}</h2>
        {attemptNumber > 0 && (
          <p className="text-sm text-muted-foreground">
            Attempt {attemptNumber} of {maxAttempts}
          </p>
        )}
        <div className="mt-4 flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-status-warning rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-status-warning rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-status-warning rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
