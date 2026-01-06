/**
 * Goal Snippet Component
 *
 * Displays the session goal in a compact format for the live session view.
 * Shows goal text with optional drift warning indicator.
 */

'use client';

import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface GoalSnippetProps {
  /** The session goal text */
  goal: string;
  /** Whether the conversation is currently on goal */
  isOnGoal?: boolean;
  /** How long the conversation has drifted from goal (seconds) */
  driftDurationSeconds?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Optional className for container styling */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get drift status and styling
 */
function getDriftStatus(isOnGoal: boolean, driftDurationSeconds: number): {
  label: string;
  textColor: string;
  bgColor: string;
  showWarning: boolean;
} {
  if (isOnGoal || driftDurationSeconds < 30) {
    return {
      label: 'On Track',
      textColor: 'text-status-active',
      bgColor: 'bg-status-active/10',
      showWarning: false,
    };
  }

  if (driftDurationSeconds < 120) {
    return {
      label: 'Drifting',
      textColor: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
      showWarning: true,
    };
  }

  return {
    label: 'Off Track',
    textColor: 'text-status-error',
    bgColor: 'bg-status-error/10',
    showWarning: true,
  };
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// =============================================================================
// Components
// =============================================================================

/**
 * Main Goal Snippet component
 */
export function GoalSnippet({
  goal,
  isOnGoal = true,
  driftDurationSeconds = 0,
  compact = false,
  className,
}: GoalSnippetProps) {
  const driftStatus = getDriftStatus(isOnGoal, driftDurationSeconds);
  const displayGoal = compact ? truncateText(goal, 80) : truncateText(goal, 150);

  return (
    <div
      className={cn(
        'rounded-lg border border-border/50',
        compact ? 'p-2' : 'p-3',
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          Session Goal
        </span>
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider',
            driftStatus.bgColor,
            driftStatus.textColor
          )}
        >
          {driftStatus.label}
        </span>
      </div>

      {/* Goal text */}
      <p
        className={cn(
          'font-serif italic leading-snug',
          compact ? 'text-sm' : 'text-base',
          driftStatus.showWarning ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        &ldquo;{displayGoal}&rdquo;
      </p>

      {/* Drift warning */}
      {driftStatus.showWarning && (
        <p
          className={cn(
            'mt-1.5 text-[10px] flex items-center gap-1',
            driftStatus.textColor
          )}
        >
          <WarningIcon className="w-3 h-3" />
          <span>
            Conversation has drifted for{' '}
            {Math.floor(driftDurationSeconds / 60)}m {driftDurationSeconds % 60}s
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Compact inline goal display for HUD overlays
 */
export function GoalSnippetInline({
  goal,
  isOnGoal = true,
  className,
}: Pick<GoalSnippetProps, 'goal' | 'isOnGoal' | 'className'>) {
  const truncatedGoal = truncateText(goal, 50);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm',
        className
      )}
    >
      {/* Status dot */}
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isOnGoal ? 'bg-green-400' : 'bg-amber-400'
        )}
      />
      {/* Goal text */}
      <span className="text-[10px] text-white/80 truncate max-w-[200px]">
        {truncatedGoal}
      </span>
    </div>
  );
}

/**
 * Goal card for sidebar display
 */
export function GoalCard({
  goal,
  isOnGoal = true,
  driftDurationSeconds = 0,
  className,
}: GoalSnippetProps) {
  const driftStatus = getDriftStatus(isOnGoal, driftDurationSeconds);

  return (
    <div
      className={cn(
        'rounded-card bg-card p-4 shadow-card',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Active Goal
        </h3>
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-medium',
            driftStatus.bgColor,
            driftStatus.textColor
          )}
        >
          {driftStatus.label}
        </span>
      </div>

      {/* Goal text */}
      <p className="font-serif text-lg italic leading-relaxed mb-3">
        &ldquo;{goal}&rdquo;
      </p>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex-1 h-1 rounded-full',
            isOnGoal ? 'bg-status-active/30' : 'bg-status-warning/30'
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOnGoal ? 'bg-status-active' : 'bg-status-warning'
            )}
            style={{ width: isOnGoal ? '100%' : `${Math.max(20, 100 - driftDurationSeconds / 3)}%` }}
          />
        </div>
        <TargetIcon
          className={cn(
            'w-4 h-4',
            isOnGoal ? 'text-status-active' : 'text-status-warning'
          )}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export default GoalSnippet;
