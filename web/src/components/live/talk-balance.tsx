/**
 * Talk Balance Component
 *
 * Displays a horizontal bicolor bar showing the real-time talk balance
 * between two participants. Updates every 1-2 seconds via WebSocket.
 *
 * Visual design:
 * - Horizontal bar split proportionally between participants
 * - Participant names and percentages shown at each end
 * - Color coding based on balance status (balanced, mild, severe imbalance)
 */

'use client';

import { cn } from '@/lib/utils';
import type { TalkBalanceMetrics, BalanceStatus } from '@/types/session';

// =============================================================================
// Types
// =============================================================================

interface TalkBalanceProps {
  /** Balance metrics from WebSocket events */
  balance: TalkBalanceMetrics | null;
  /** Optional compact mode for smaller displays */
  compact?: boolean;
  /** Optional className for container styling */
  className?: string;
  /** Show percentage labels */
  showPercentages?: boolean;
  /** Show participant names */
  showNames?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get colors for the balance bar based on status
 */
function getBalanceColors(status: BalanceStatus): {
  left: string;
  right: string;
  statusBg: string;
  statusText: string;
} {
  switch (status) {
    case 'balanced':
      return {
        left: 'bg-secondary',
        right: 'bg-primary',
        statusBg: 'bg-status-active/10',
        statusText: 'text-status-active',
      };
    case 'mild_imbalance':
      return {
        left: 'bg-status-warning',
        right: 'bg-primary',
        statusBg: 'bg-status-warning/10',
        statusText: 'text-status-warning',
      };
    case 'severe_imbalance':
      return {
        left: 'bg-status-error',
        right: 'bg-primary',
        statusBg: 'bg-status-error/10',
        statusText: 'text-status-error',
      };
  }
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: BalanceStatus): string {
  switch (status) {
    case 'balanced':
      return 'Balanced';
    case 'mild_imbalance':
      return 'Uneven';
    case 'severe_imbalance':
      return 'Imbalanced';
  }
}

// =============================================================================
// Components
// =============================================================================

/**
 * Balance bar skeleton shown while loading
 */
function TalkBalanceSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('w-full', compact ? 'space-y-1' : 'space-y-2')}>
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
      <div
        className={cn(
          'w-full animate-pulse rounded-full bg-muted',
          compact ? 'h-2' : 'h-3'
        )}
      />
    </div>
  );
}

/**
 * Main Talk Balance component
 */
export function TalkBalance({
  balance,
  compact = false,
  className,
  showPercentages = true,
  showNames = true,
}: TalkBalanceProps) {
  // Show skeleton while loading
  if (!balance) {
    return <TalkBalanceSkeleton compact={compact} />;
  }

  const { participantA, participantB, status } = balance;
  const colors = getBalanceColors(status);
  const statusLabel = getStatusLabel(status);

  // Ensure percentages are valid (0-100)
  const leftPercent = Math.max(0, Math.min(100, participantA.percentage));
  const rightPercent = Math.max(0, Math.min(100, participantB.percentage));

  return (
    <div className={cn('w-full', compact ? 'space-y-1' : 'space-y-2', className)}>
      {/* Header row: Names and status */}
      <div className="flex items-center justify-between text-xs">
        {/* Left participant */}
        <div className="flex items-center gap-1.5">
          {showNames && (
            <span className="font-medium text-foreground truncate max-w-[80px]">
              {participantA.name}
            </span>
          )}
          {showPercentages && (
            <span className="text-muted-foreground tabular-nums">
              {Math.round(leftPercent)}%
            </span>
          )}
        </div>

        {/* Center: Status badge */}
        <div
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
            colors.statusBg,
            colors.statusText
          )}
        >
          {statusLabel}
        </div>

        {/* Right participant */}
        <div className="flex items-center gap-1.5">
          {showPercentages && (
            <span className="text-muted-foreground tabular-nums">
              {Math.round(rightPercent)}%
            </span>
          )}
          {showNames && (
            <span className="font-medium text-foreground truncate max-w-[80px]">
              {participantB.name}
            </span>
          )}
        </div>
      </div>

      {/* Balance bar */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-muted',
          compact ? 'h-2' : 'h-3'
        )}
        role="progressbar"
        aria-label="Talk balance"
        aria-valuenow={leftPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Left segment (Participant A) */}
        <div
          className={cn(
            'absolute left-0 top-0 h-full transition-all duration-500 ease-out',
            colors.left
          )}
          style={{ width: `${leftPercent}%` }}
        />
        {/* Right segment (Participant B) - starts where left ends */}
        <div
          className={cn(
            'absolute right-0 top-0 h-full transition-all duration-500 ease-out',
            colors.right
          )}
          style={{ width: `${rightPercent}%` }}
        />
      </div>

      {/* Optional: Section header for context */}
      {!compact && (
        <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
          Talk Balance
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Compact variant for overlay/HUD usage
// =============================================================================

interface TalkBalanceCompactProps {
  balance: TalkBalanceMetrics | null;
  className?: string;
}

/**
 * Compact Talk Balance for HUD overlays
 * Shows just the bar with minimal percentages, no names
 */
export function TalkBalanceCompact({
  balance,
  className,
}: TalkBalanceCompactProps) {
  if (!balance) {
    return (
      <div className={cn('w-full', className)}>
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted/50" />
      </div>
    );
  }

  const { participantA, participantB, status } = balance;
  const leftPercent = Math.max(0, Math.min(100, participantA.percentage));
  const rightPercent = Math.max(0, Math.min(100, participantB.percentage));

  // Color classes for HUD overlay (uses direct colors for visibility on dark backgrounds)
  const leftBarColor =
    status === 'balanced'
      ? 'bg-green-400'
      : status === 'mild_imbalance'
        ? 'bg-amber-400'
        : 'bg-red-400';

  return (
    <div className={cn('w-full space-y-0.5', className)}>
      {/* Mini percentages */}
      <div className="flex justify-between text-[9px] text-white/70 tabular-nums">
        <span>{Math.round(leftPercent)}%</span>
        <span>{Math.round(rightPercent)}%</span>
      </div>
      {/* Thin balance bar */}
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/30"
        role="progressbar"
        aria-label="Talk balance"
        aria-valuenow={leftPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'absolute left-0 top-0 h-full transition-all duration-500 ease-out',
            leftBarColor
          )}
          style={{ width: `${leftPercent}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-white/60 transition-all duration-500 ease-out"
          style={{ width: `${rightPercent}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Vertical variant for side panels
// =============================================================================

interface TalkBalanceVerticalProps {
  balance: TalkBalanceMetrics | null;
  className?: string;
}

/**
 * Vertical Talk Balance for side panels
 * Shows participant avatars with vertical bars
 */
export function TalkBalanceVertical({
  balance,
  className,
}: TalkBalanceVerticalProps) {
  if (!balance) {
    return (
      <div className={cn('flex items-end justify-center gap-4 h-24', className)}>
        <div className="w-8 h-full animate-pulse rounded-t bg-muted" />
        <div className="w-8 h-full animate-pulse rounded-t bg-muted" />
      </div>
    );
  }

  const { participantA, participantB, status } = balance;
  const colors = getBalanceColors(status);
  const leftPercent = Math.max(0, Math.min(100, participantA.percentage));
  const rightPercent = Math.max(0, Math.min(100, participantB.percentage));

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Bars container */}
      <div className="flex items-end justify-center gap-4 h-20">
        {/* Participant A bar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {Math.round(leftPercent)}%
          </span>
          <div className="w-6 h-16 bg-muted rounded-t overflow-hidden relative">
            <div
              className={cn(
                'absolute bottom-0 left-0 w-full transition-all duration-500 ease-out rounded-t',
                colors.left
              )}
              style={{ height: `${leftPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-medium truncate max-w-[50px]">
            {participantA.name.split(' ')[0]}
          </span>
        </div>

        {/* Participant B bar */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {Math.round(rightPercent)}%
          </span>
          <div className="w-6 h-16 bg-muted rounded-t overflow-hidden relative">
            <div
              className={cn(
                'absolute bottom-0 left-0 w-full transition-all duration-500 ease-out rounded-t',
                colors.right
              )}
              style={{ height: `${rightPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-medium truncate max-w-[50px]">
            {participantB.name.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Status label */}
      <span
        className={cn(
          'text-[10px] font-medium uppercase tracking-wider',
          colors.statusText
        )}
      >
        {getStatusLabel(status)}
      </span>
    </div>
  );
}

export default TalkBalance;
