/**
 * Kill Switch Component
 *
 * Provides immediate pause/resume control for AI facilitation during a live session.
 * Per requirements:
 * - Immediate effect with no confirmation
 * - Both participants are notified (via WebSocket broadcast)
 * - Re-enable requires explicit action
 *
 * Variants:
 * - KillSwitch: Main toggle button with state display
 * - KillSwitchCompact: Minimal inline toggle
 * - KillSwitchBanner: Full-width banner showing paused state
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// =============================================================================
// Types
// =============================================================================

interface KillSwitchProps {
  /** Whether the facilitator is currently paused */
  isPaused: boolean;
  /** Called when pause/resume is triggered */
  onToggle: () => void | Promise<void>;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Disable the control */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

interface KillSwitchBannerProps extends KillSwitchProps {
  /** Optional message to display when paused */
  pausedMessage?: string;
}

// =============================================================================
// Icons
// =============================================================================

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <rect x="9" y="8" width="2.5" height="8" rx="1" fill="currentColor" />
      <rect x="12.5" y="8" width="2.5" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 8.5V15.5L16 12L10 8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="40 60"
      />
    </svg>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Main Kill Switch button component
 *
 * Displays a prominent button to pause/resume AI facilitation.
 * Shows current state and provides immediate toggle action.
 */
export function KillSwitch({
  isPaused,
  onToggle,
  isLoading = false,
  disabled = false,
  className,
}: KillSwitchProps) {
  const handleClick = React.useCallback(async () => {
    if (isLoading || disabled) return;
    await onToggle();
  }, [onToggle, isLoading, disabled]);

  return (
    <Button
      variant={isPaused ? 'secondary' : 'outline'}
      size="default"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'min-w-[180px] gap-2',
        isPaused && 'bg-secondary/90 hover:bg-secondary',
        className
      )}
      aria-label={isPaused ? 'Resume AI facilitation' : 'Pause AI facilitation'}
      aria-pressed={isPaused}
    >
      {isLoading ? (
        <>
          <LoadingSpinner className="w-4 h-4" />
          <span>{isPaused ? 'Resuming...' : 'Pausing...'}</span>
        </>
      ) : isPaused ? (
        <>
          <PlayIcon className="w-4 h-4" />
          <span>Resume AI</span>
        </>
      ) : (
        <>
          <PauseIcon className="w-4 h-4" />
          <span>Pause AI</span>
        </>
      )}
    </Button>
  );
}

// =============================================================================
// Compact Toggle Variant
// =============================================================================

/**
 * Compact inline toggle for kill switch
 *
 * Uses a switch control with label, suitable for toolbars or settings panels.
 */
export function KillSwitchCompact({
  isPaused,
  onToggle,
  isLoading = false,
  disabled = false,
  className,
}: KillSwitchProps) {
  const handleChange = React.useCallback(async () => {
    if (isLoading || disabled) return;
    await onToggle();
  }, [onToggle, isLoading, disabled]);

  return (
    <div
      className={cn(
        'flex items-center gap-3',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {isPaused ? (
          <PauseIcon className="w-4 h-4 text-muted-foreground" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-status-active animate-pulse" />
        )}
        <span className="text-sm font-medium">
          {isPaused ? 'AI Paused' : 'AI Active'}
        </span>
      </div>
      <Switch
        checked={!isPaused}
        onCheckedChange={handleChange}
        disabled={disabled || isLoading}
        aria-label={isPaused ? 'Resume AI facilitation' : 'Pause AI facilitation'}
      />
    </div>
  );
}

// =============================================================================
// Large Button Variant
// =============================================================================

/**
 * Large prominent kill switch button
 *
 * Used for critical situations where immediate visibility is needed.
 */
export function KillSwitchLarge({
  isPaused,
  onToggle,
  isLoading = false,
  disabled = false,
  className,
}: KillSwitchProps) {
  const handleClick = React.useCallback(async () => {
    if (isLoading || disabled) return;
    await onToggle();
  }, [onToggle, isLoading, disabled]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-6 rounded-card transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isPaused
          ? 'bg-secondary/10 hover:bg-secondary/20 border-2 border-secondary'
          : 'bg-muted/50 hover:bg-muted border-2 border-muted-foreground/20',
        className
      )}
      aria-label={isPaused ? 'Resume AI facilitation' : 'Pause AI facilitation'}
      aria-pressed={isPaused}
    >
      {isLoading ? (
        <LoadingSpinner className="w-12 h-12 text-muted-foreground" />
      ) : isPaused ? (
        <PlayIcon className="w-12 h-12 text-secondary" />
      ) : (
        <PauseIcon className="w-12 h-12 text-muted-foreground" />
      )}
      <span
        className={cn(
          'text-sm font-medium uppercase tracking-widest',
          isPaused ? 'text-secondary' : 'text-muted-foreground'
        )}
      >
        {isLoading
          ? isPaused
            ? 'Resuming...'
            : 'Pausing...'
          : isPaused
            ? 'Resume AI Facilitation'
            : 'Pause AI Facilitation'}
      </span>
    </button>
  );
}

// =============================================================================
// Banner Variant
// =============================================================================

/**
 * Full-width banner displayed when AI facilitation is paused
 *
 * Shows paused state prominently with resume option.
 */
export function KillSwitchBanner({
  isPaused,
  onToggle,
  isLoading = false,
  disabled = false,
  pausedMessage = 'AI facilitation is paused. Both participants see this.',
  className,
}: KillSwitchBannerProps) {
  const handleResume = React.useCallback(async () => {
    if (isLoading || disabled) return;
    await onToggle();
  }, [onToggle, isLoading, disabled]);

  if (!isPaused) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 rounded-lg',
        'bg-status-warning/10 border border-status-warning/30',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <PauseIcon className="w-5 h-5 text-status-warning flex-shrink-0" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-status-warning">
            Facilitation Paused
          </p>
          <p className="text-xs text-muted-foreground">{pausedMessage}</p>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleResume}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="w-3 h-3" />
            <span>Resuming...</span>
          </>
        ) : (
          <>
            <PlayIcon className="w-3 h-3" />
            <span>Resume</span>
          </>
        )}
      </Button>
    </div>
  );
}

// =============================================================================
// HUD Overlay Variant
// =============================================================================

interface KillSwitchHUDProps extends KillSwitchProps {
  /** Position of the HUD */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * HUD overlay variant for video backgrounds
 *
 * Semi-transparent floating button suitable for overlaying on video feeds.
 */
export function KillSwitchHUD({
  isPaused,
  onToggle,
  isLoading = false,
  disabled = false,
  position = 'bottom-right',
  className,
}: KillSwitchHUDProps) {
  const handleClick = React.useCallback(async () => {
    if (isLoading || disabled) return;
    await onToggle();
  }, [onToggle, isLoading, disabled]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={cn(
        'absolute flex items-center gap-2 px-3 py-2 rounded-full',
        'bg-black/60 backdrop-blur-sm',
        'text-white text-xs font-medium uppercase tracking-wider',
        'transition-all hover:bg-black/80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        'disabled:pointer-events-none disabled:opacity-50',
        positionClasses[position],
        isPaused && 'ring-2 ring-amber-400/50',
        className
      )}
      aria-label={isPaused ? 'Resume AI facilitation' : 'Pause AI facilitation'}
      aria-pressed={isPaused}
    >
      {isLoading ? (
        <LoadingSpinner className="w-4 h-4" />
      ) : isPaused ? (
        <>
          <PlayIcon className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400">Paused</span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-300">AI Active</span>
        </>
      )}
    </button>
  );
}

// =============================================================================
// Paused State Overlay
// =============================================================================

interface KillSwitchOverlayProps {
  /** Whether the facilitator is currently paused */
  isPaused: boolean;
  /** Called when resume is triggered */
  onResume: () => void | Promise<void>;
  /** Whether the resume action is in progress */
  isLoading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Full-screen overlay shown when AI facilitation is paused
 *
 * Provides clear visual indication that facilitation is paused
 * with prominent resume button.
 */
export function KillSwitchOverlay({
  isPaused,
  onResume,
  isLoading = false,
  className,
}: KillSwitchOverlayProps) {
  if (!isPaused) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        'animate-in fade-in duration-200',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label="AI facilitation paused"
    >
      <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
        {/* Large pause icon */}
        <div className="w-24 h-24 rounded-full bg-status-warning/10 flex items-center justify-center ring-4 ring-status-warning/30">
          <PauseIcon className="w-12 h-12 text-status-warning" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-serif font-medium">
            AI Facilitation Paused
          </h2>
          <p className="text-sm text-muted-foreground">
            The AI facilitator has been paused. All interventions and data
            tracking have stopped. Both participants see this message.
          </p>
        </div>

        {/* Resume button */}
        <Button
          variant="secondary"
          size="lg"
          onClick={onResume}
          disabled={isLoading}
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <LoadingSpinner className="w-4 h-4" />
              <span>Resuming...</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              <span>Resume Facilitation</span>
            </>
          )}
        </Button>

        {/* Note */}
        <p className="text-xs text-muted-foreground">
          Either participant can resume facilitation at any time.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Default Export
// =============================================================================

export default KillSwitch;
