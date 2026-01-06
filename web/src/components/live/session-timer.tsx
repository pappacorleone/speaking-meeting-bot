/**
 * Session Timer Component
 *
 * Displays elapsed time and time remaining for the session.
 * Updates every second via the session store's incrementElapsed action.
 *
 * Visual design:
 * - Shows elapsed time (mm:ss or hh:mm:ss)
 * - Shows time remaining as countdown
 * - Color coding based on time remaining (green, amber, red)
 * - Progress bar showing completion percentage
 */

'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { TimeRemainingData } from '@/types/events';

// =============================================================================
// Types
// =============================================================================

interface SessionTimerProps {
  /** Time remaining data from WebSocket events */
  timeRemaining: TimeRemainingData | null;
  /** Elapsed time in seconds (tracked locally) */
  elapsedSeconds: number;
  /** Total session duration in minutes */
  durationMinutes: number;
  /** Callback to increment elapsed seconds (called every second) */
  onTick?: () => void;
  /** Whether the session is active (controls timer ticking) */
  isActive?: boolean;
  /** Show elapsed time instead of remaining */
  showElapsed?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Optional className for container styling */
  className?: string;
}

type TimeStatus = 'normal' | 'warning' | 'critical';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Format seconds into mm:ss or hh:mm:ss
 */
function formatTime(totalSeconds: number, includeHours = false): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (includeHours || hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculate time remaining in seconds from duration and elapsed
 */
function calculateTimeRemaining(
  durationMinutes: number,
  elapsedSeconds: number
): number {
  const totalSeconds = durationMinutes * 60;
  return Math.max(0, totalSeconds - elapsedSeconds);
}

/**
 * Get status based on time remaining
 * - critical: < 2 minutes
 * - warning: < 5 minutes
 * - normal: >= 5 minutes
 */
function getTimeStatus(remainingSeconds: number): TimeStatus {
  if (remainingSeconds < 120) return 'critical';
  if (remainingSeconds < 300) return 'warning';
  return 'normal';
}

/**
 * Get colors based on time status
 */
function getStatusColors(status: TimeStatus): {
  text: string;
  bg: string;
  indicator: string;
  progress: string;
} {
  switch (status) {
    case 'critical':
      return {
        text: 'text-status-error',
        bg: 'bg-status-error/10',
        indicator: 'bg-status-error',
        progress: 'bg-status-error',
      };
    case 'warning':
      return {
        text: 'text-status-warning',
        bg: 'bg-status-warning/10',
        indicator: 'bg-status-warning',
        progress: 'bg-status-warning',
      };
    case 'normal':
      return {
        text: 'text-status-active',
        bg: 'bg-status-active/10',
        indicator: 'bg-status-active',
        progress: 'bg-secondary',
      };
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: TimeStatus): string {
  switch (status) {
    case 'critical':
      return 'Ending Soon';
    case 'warning':
      return '< 5 min';
    case 'normal':
      return 'Active';
  }
}

// =============================================================================
// Components
// =============================================================================

/**
 * Timer skeleton shown while loading
 */
export function SessionTimerSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', compact && 'gap-1.5')}>
      <div
        className={cn(
          'animate-pulse rounded-full bg-muted',
          compact ? 'h-2 w-2' : 'h-2.5 w-2.5'
        )}
      />
      <div
        className={cn(
          'animate-pulse rounded bg-muted',
          compact ? 'h-4 w-12' : 'h-5 w-16'
        )}
      />
    </div>
  );
}

/**
 * Main Session Timer component
 * Displays elapsed or remaining time with status indicator
 */
export function SessionTimer({
  timeRemaining,
  elapsedSeconds,
  durationMinutes,
  onTick,
  isActive = true,
  showElapsed = false,
  compact = false,
  className,
}: SessionTimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Set up timer interval
  useEffect(() => {
    if (isActive && onTick) {
      intervalRef.current = setInterval(() => {
        onTick();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, onTick]);

  // Calculate time remaining (use WebSocket data if available, otherwise calculate)
  const remainingSeconds =
    timeRemaining?.totalSecondsRemaining ??
    calculateTimeRemaining(durationMinutes, elapsedSeconds);

  const percentComplete =
    timeRemaining?.percentComplete ??
    Math.min(100, (elapsedSeconds / (durationMinutes * 60)) * 100);

  const status = getTimeStatus(remainingSeconds);
  const colors = getStatusColors(status);

  // Determine which time to display
  const displayTime = showElapsed
    ? formatTime(elapsedSeconds)
    : formatTime(remainingSeconds);

  return (
    <div
      className={cn(
        'flex items-center',
        compact ? 'gap-1.5' : 'gap-2',
        className
      )}
      role="timer"
      aria-label={
        showElapsed
          ? `Elapsed time: ${displayTime}`
          : `Time remaining: ${displayTime}`
      }
    >
      {/* Status indicator dot */}
      <div
        className={cn(
          'rounded-full animate-pulse',
          compact ? 'h-2 w-2' : 'h-2.5 w-2.5',
          colors.indicator
        )}
        aria-hidden="true"
      />

      {/* Time display */}
      <span
        className={cn(
          'font-mono tabular-nums font-medium',
          compact ? 'text-sm' : 'text-base',
          colors.text
        )}
      >
        {displayTime}
      </span>

      {/* Progress bar (non-compact only) */}
      {!compact && (
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full transition-all duration-1000 ease-linear',
              colors.progress
            )}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Timer with Label variant
// =============================================================================

interface SessionTimerWithLabelProps extends SessionTimerProps {
  /** Label to display above/beside timer */
  label?: string;
  /** Position of label */
  labelPosition?: 'top' | 'left';
}

/**
 * Session Timer with label
 * Displays timer with a descriptive label
 */
export function SessionTimerWithLabel({
  label = 'Time Remaining',
  labelPosition = 'top',
  ...props
}: SessionTimerWithLabelProps) {
  const remainingSeconds =
    props.timeRemaining?.totalSecondsRemaining ??
    calculateTimeRemaining(props.durationMinutes, props.elapsedSeconds);

  const status = getTimeStatus(remainingSeconds);

  if (labelPosition === 'left') {
    return (
      <div className={cn('flex items-center gap-3', props.className)}>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <SessionTimer {...props} className="" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-1', props.className)}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <SessionTimer {...props} className="" />
      {status !== 'normal' && (
        <span
          className={cn(
            'text-[10px] font-medium uppercase tracking-wider',
            getStatusColors(status).text
          )}
        >
          {getStatusLabel(status)}
        </span>
      )}
    </div>
  );
}

// =============================================================================
// Compact HUD variant for video overlays
// =============================================================================

interface SessionTimerHUDProps {
  /** Time remaining data from WebSocket events */
  timeRemaining: TimeRemainingData | null;
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Total session duration in minutes */
  durationMinutes: number;
  /** Show elapsed instead of remaining */
  showElapsed?: boolean;
  /** Optional className for container styling */
  className?: string;
}

/**
 * Compact Session Timer for HUD overlays
 * Designed for visibility on video backgrounds
 */
export function SessionTimerHUD({
  timeRemaining,
  elapsedSeconds,
  durationMinutes,
  showElapsed = false,
  className,
}: SessionTimerHUDProps) {
  const remainingSeconds =
    timeRemaining?.totalSecondsRemaining ??
    calculateTimeRemaining(durationMinutes, elapsedSeconds);

  const status = getTimeStatus(remainingSeconds);

  const displayTime = showElapsed
    ? formatTime(elapsedSeconds)
    : formatTime(remainingSeconds);

  // HUD-specific colors (for dark video backgrounds)
  const dotColor =
    status === 'critical'
      ? 'bg-red-400'
      : status === 'warning'
        ? 'bg-amber-400'
        : 'bg-green-400';

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm',
        className
      )}
      role="timer"
      aria-label={
        showElapsed
          ? `Elapsed time: ${displayTime}`
          : `Time remaining: ${displayTime}`
      }
    >
      <div className={cn('h-2 w-2 rounded-full animate-pulse', dotColor)} />
      <span className="text-sm font-mono tabular-nums text-white/90">
        {displayTime}
      </span>
    </div>
  );
}

// =============================================================================
// Large display variant
// =============================================================================

interface SessionTimerLargeProps extends SessionTimerProps {
  /** Show both elapsed and remaining */
  showBoth?: boolean;
}

/**
 * Large Session Timer display
 * For prominent timer display in session screens
 */
export function SessionTimerLarge({
  timeRemaining,
  elapsedSeconds,
  durationMinutes,
  showBoth = false,
  className,
}: SessionTimerLargeProps) {
  const remainingSeconds =
    timeRemaining?.totalSecondsRemaining ??
    calculateTimeRemaining(durationMinutes, elapsedSeconds);

  const percentComplete =
    timeRemaining?.percentComplete ??
    Math.min(100, (elapsedSeconds / (durationMinutes * 60)) * 100);

  const status = getTimeStatus(remainingSeconds);
  const colors = getStatusColors(status);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Main time display */}
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div
          className={cn(
            'h-3 w-3 rounded-full animate-pulse',
            colors.indicator
          )}
        />

        {/* Time */}
        <span
          className={cn(
            'text-3xl font-mono tabular-nums font-bold',
            colors.text
          )}
        >
          {formatTime(remainingSeconds, true)}
        </span>
      </div>

      {/* Status badge */}
      <div
        className={cn(
          'px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider',
          colors.bg,
          colors.text
        )}
      >
        {status === 'normal' ? 'Time Remaining' : getStatusLabel(status)}
      </div>

      {/* Progress bar */}
      <div className="w-48 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear',
            colors.progress
          )}
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Optional elapsed time */}
      {showBoth && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Elapsed:</span>
          <span className="font-mono tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Dual Timer variant (elapsed + remaining)
// =============================================================================

interface SessionTimerDualProps {
  /** Time remaining data from WebSocket events */
  timeRemaining: TimeRemainingData | null;
  /** Elapsed time in seconds */
  elapsedSeconds: number;
  /** Total session duration in minutes */
  durationMinutes: number;
  /** Optional className for container styling */
  className?: string;
}

/**
 * Dual Session Timer
 * Shows both elapsed and remaining time side by side
 */
export function SessionTimerDual({
  timeRemaining,
  elapsedSeconds,
  durationMinutes,
  className,
}: SessionTimerDualProps) {
  const remainingSeconds =
    timeRemaining?.totalSecondsRemaining ??
    calculateTimeRemaining(durationMinutes, elapsedSeconds);

  const percentComplete =
    timeRemaining?.percentComplete ??
    Math.min(100, (elapsedSeconds / (durationMinutes * 60)) * 100);

  const status = getTimeStatus(remainingSeconds);
  const colors = getStatusColors(status);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Elapsed and remaining row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Elapsed</span>
          <span className="font-mono tabular-nums font-medium">
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={cn('font-mono tabular-nums font-medium', colors.text)}>
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-muted-foreground">Remaining</span>
        </div>
      </div>

      {/* Full-width progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'absolute left-0 top-0 h-full transition-all duration-1000 ease-linear',
            colors.progress
          )}
          style={{ width: `${percentComplete}%` }}
        />
        {/* Current position marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-0.5 bg-foreground transition-all duration-1000 ease-linear"
          style={{ left: `${percentComplete}%` }}
        />
      </div>

      {/* Duration label */}
      <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
        {durationMinutes} minute session
      </p>
    </div>
  );
}

export default SessionTimer;
