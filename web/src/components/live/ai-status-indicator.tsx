/**
 * AI Status Indicator Component
 *
 * Displays the current state of the AI facilitator during a live session.
 * Uses animated visual cues to communicate AI state to users.
 *
 * States:
 * - idle: Default state, subtle appearance
 * - listening: Subtle pulse animation, AI is observing
 * - preparing: Loading spinner, AI is processing/formulating
 * - intervening: Active glow animation, AI is speaking/acting
 * - paused: Gray/dimmed, facilitation is paused
 */

'use client';

import { cn } from '@/lib/utils';
import type { AIStatus } from '@/types/events';

// =============================================================================
// Types
// =============================================================================

interface AIStatusIndicatorProps {
  /** Current AI status */
  status: AIStatus;
  /** Optional status message to display */
  message?: string;
  /** Optional compact mode for smaller displays */
  compact?: boolean;
  /** Optional className for container styling */
  className?: string;
  /** Show the status label */
  showLabel?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get human-readable label for AI status
 */
function getStatusLabel(status: AIStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'listening':
      return 'Listening';
    case 'preparing':
      return 'Processing';
    case 'intervening':
      return 'Speaking';
    case 'paused':
      return 'Paused';
  }
}

/**
 * Get icon/visual styling based on status
 */
function getStatusStyles(status: AIStatus): {
  ring: string;
  bg: string;
  text: string;
  dot: string;
  animation: string;
} {
  switch (status) {
    case 'idle':
      return {
        ring: 'ring-muted/50',
        bg: 'bg-muted/20',
        text: 'text-muted-foreground',
        dot: 'bg-muted-foreground/50',
        animation: '',
      };
    case 'listening':
      return {
        ring: 'ring-secondary/50',
        bg: 'bg-secondary/10',
        text: 'text-secondary',
        dot: 'bg-secondary',
        animation: 'animate-pulse',
      };
    case 'preparing':
      return {
        ring: 'ring-status-info/50',
        bg: 'bg-status-info/10',
        text: 'text-status-info',
        dot: 'bg-status-info',
        animation: 'animate-spin',
      };
    case 'intervening':
      return {
        ring: 'ring-status-active/50',
        bg: 'bg-status-active/10',
        text: 'text-status-active',
        dot: 'bg-status-active',
        animation: 'animate-glow',
      };
    case 'paused':
      return {
        ring: 'ring-muted/30',
        bg: 'bg-muted/10',
        text: 'text-muted-foreground/70',
        dot: 'bg-muted-foreground/50',
        animation: '',
      };
  }
}

// =============================================================================
// Components
// =============================================================================

/**
 * Animated dot indicator for AI state
 */
function AIStatusDot({
  status,
  size = 'md',
}: {
  status: AIStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  const styles = getStatusStyles(status);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // For "preparing" status, show a spinner ring instead of a dot
  if (status === 'preparing') {
    return (
      <div
        className={cn(
          'rounded-full border-2 border-current border-t-transparent',
          sizeClasses[size],
          styles.text,
          styles.animation
        )}
        role="status"
        aria-label="AI processing"
      />
    );
  }

  return (
    <div className="relative">
      {/* Glow effect for intervening state */}
      {status === 'intervening' && (
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-sm',
            sizeClasses[size],
            styles.dot,
            'animate-pulse'
          )}
        />
      )}
      {/* Main dot */}
      <div
        className={cn(
          'relative rounded-full',
          sizeClasses[size],
          styles.dot,
          status === 'listening' && styles.animation
        )}
      />
    </div>
  );
}

/**
 * Circular ring indicator with icon
 */
function AIStatusRing({
  status,
  size = 'md',
}: {
  status: AIStatus;
  size?: 'sm' | 'md' | 'lg';
}) {
  const styles = getStatusStyles(status);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full ring-2',
        sizeClasses[size],
        styles.ring,
        styles.bg
      )}
    >
      {/* Glow effect for intervening */}
      {status === 'intervening' && (
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-glow',
            styles.bg
          )}
        />
      )}

      {/* Status icon */}
      <div className={cn('relative', iconSizeClasses[size])}>
        {status === 'idle' && <IdleIcon className={cn('w-full h-full', styles.text)} />}
        {status === 'listening' && <ListeningIcon className={cn('w-full h-full', styles.text, styles.animation)} />}
        {status === 'preparing' && <PreparingIcon className={cn('w-full h-full', styles.text, styles.animation)} />}
        {status === 'intervening' && <InterveningIcon className={cn('w-full h-full', styles.text)} />}
        {status === 'paused' && <PausedIcon className={cn('w-full h-full', styles.text)} />}
      </div>
    </div>
  );
}

// =============================================================================
// Icons (inline SVG for animation control)
// =============================================================================

function IdleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simple circle for idle state */}
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function ListeningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ear/listening icon with sound waves */}
      <path
        d="M12 3C7.58 3 4 6.58 4 11c0 2.76 1.4 5.18 3.5 6.62V20h1v-2h7v2h1v-2.38c2.1-1.44 3.5-3.86 3.5-6.62 0-4.42-3.58-8-8-8z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M9 11h6M9 14h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PreparingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circular loading indicator */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 60"
      />
    </svg>
  );
}

function InterveningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speech bubble icon for AI speaking */}
      <path
        d="M12 3C6.48 3 2 6.58 2 11c0 1.82.64 3.5 1.72 4.87L3 21l5.13-.72C9.34 20.75 10.64 21 12 21c5.52 0 10-3.58 10-8s-4.48-8-10-8z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Sound wave indicators */}
      <circle cx="8" cy="11" r="1.5" fill="currentColor" />
      <circle cx="12" cy="11" r="1.5" fill="currentColor" />
      <circle cx="16" cy="11" r="1.5" fill="currentColor" />
    </svg>
  );
}

function PausedIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pause icon */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <rect x="9" y="8" width="2" height="8" rx="1" fill="currentColor" />
      <rect x="13" y="8" width="2" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main AI Status Indicator component
 */
export function AIStatusIndicator({
  status,
  message,
  compact = false,
  className,
  showLabel = true,
}: AIStatusIndicatorProps) {
  const styles = getStatusStyles(status);
  const label = getStatusLabel(status);

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={`AI facilitator ${label.toLowerCase()}`}
      >
        <AIStatusDot status={status} size="sm" />
        {showLabel && (
          <span className={cn('text-[10px] font-medium uppercase tracking-wider', styles.text)}>
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`AI facilitator ${label.toLowerCase()}`}
    >
      <AIStatusRing status={status} size="md" />
      {showLabel && (
        <div className="text-center">
          <p className={cn('text-xs font-medium uppercase tracking-wider', styles.text)}>
            {label}
          </p>
          {message && (
            <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px] truncate">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compact Badge Variant
// =============================================================================

interface AIStatusBadgeProps {
  status: AIStatus;
  message?: string;
  className?: string;
}

/**
 * Badge-style AI status indicator for toolbar/header use
 */
export function AIStatusBadge({ status, message, className }: AIStatusBadgeProps) {
  const styles = getStatusStyles(status);
  const label = getStatusLabel(status);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        styles.bg,
        'ring-1',
        styles.ring,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`AI facilitator ${label.toLowerCase()}`}
    >
      <AIStatusDot status={status} size="sm" />
      <span className={cn('text-xs font-medium', styles.text)}>
        {message || label}
      </span>
    </div>
  );
}

// =============================================================================
// HUD Overlay Variant
// =============================================================================

interface AIStatusHUDProps {
  status: AIStatus;
  message?: string;
  className?: string;
}

/**
 * HUD overlay variant for video overlays (light text on dark/video backgrounds)
 */
export function AIStatusHUD({ status, message, className }: AIStatusHUDProps) {
  const label = getStatusLabel(status);

  // Color mapping for HUD (always visible on dark backgrounds)
  const hudColors = {
    idle: { dot: 'bg-white/50', text: 'text-white/70' },
    listening: { dot: 'bg-green-400', text: 'text-green-300' },
    preparing: { dot: 'bg-blue-400', text: 'text-blue-300' },
    intervening: { dot: 'bg-yellow-400', text: 'text-yellow-300' },
    paused: { dot: 'bg-white/30', text: 'text-white/50' },
  };

  const colors = hudColors[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`AI facilitator ${label.toLowerCase()}`}
    >
      {/* Animated dot */}
      <div className="relative">
        {status === 'intervening' && (
          <div className={cn('absolute inset-0 rounded-full blur-sm animate-pulse', colors.dot)} />
        )}
        {status === 'preparing' ? (
          <div
            className={cn(
              'w-2 h-2 rounded-full border border-current border-t-transparent animate-spin',
              colors.text
            )}
          />
        ) : (
          <div
            className={cn(
              'relative w-2 h-2 rounded-full',
              colors.dot,
              status === 'listening' && 'animate-pulse'
            )}
          />
        )}
      </div>
      <span className={cn('text-[10px] font-medium uppercase tracking-wider', colors.text)}>
        {message || label}
      </span>
    </div>
  );
}

// =============================================================================
// Large Display Variant
// =============================================================================

interface AIStatusLargeProps {
  status: AIStatus;
  message?: string;
  className?: string;
}

/**
 * Large display variant for full-screen states (e.g., waiting for AI)
 */
export function AIStatusLarge({ status, message, className }: AIStatusLargeProps) {
  const styles = getStatusStyles(status);
  const label = getStatusLabel(status);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`AI facilitator ${label.toLowerCase()}`}
    >
      {/* Large animated ring */}
      <div className="relative">
        {/* Outer glow for intervening */}
        {status === 'intervening' && (
          <div
            className={cn(
              'absolute -inset-2 rounded-full animate-glow opacity-50',
              styles.bg
            )}
          />
        )}
        {/* Main ring */}
        <div
          className={cn(
            'relative w-20 h-20 rounded-full flex items-center justify-center ring-4',
            styles.ring,
            styles.bg
          )}
        >
          <div className="w-12 h-12">
            {status === 'idle' && <IdleIcon className={cn('w-full h-full', styles.text)} />}
            {status === 'listening' && <ListeningIcon className={cn('w-full h-full', styles.text, styles.animation)} />}
            {status === 'preparing' && <PreparingIcon className={cn('w-full h-full', styles.text, styles.animation)} />}
            {status === 'intervening' && <InterveningIcon className={cn('w-full h-full', styles.text)} />}
            {status === 'paused' && <PausedIcon className={cn('w-full h-full', styles.text)} />}
          </div>
        </div>
      </div>

      {/* Label and message */}
      <div className="text-center space-y-1">
        <p className={cn('text-sm font-semibold uppercase tracking-widest', styles.text)}>
          AI Facilitator: {label}
        </p>
        {message && (
          <p className="text-sm text-muted-foreground max-w-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default AIStatusIndicator;
