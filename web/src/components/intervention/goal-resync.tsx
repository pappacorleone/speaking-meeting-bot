/**
 * Goal Resync Component
 *
 * Displays when conversation has drifted from the session goal.
 * Shows loading state while AI analyzes and prepares to redirect.
 *
 * Reference: requirements.md Section 6.8 Intervention UI Design
 * - Dark full-screen overlay
 * - Animated loading indicator (dashed circle)
 * - Message: "Re-syncing with Goal..."
 * - Badge: "DIADI AGENT"
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { GoalDriftIntervention } from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

interface GoalResyncProps {
  /** The goal drift intervention data */
  intervention: GoalDriftIntervention;
  /** Called when user acknowledges and refocuses */
  onRefocus: () => void;
  /** Called to dismiss and continue current topic */
  onContinue: () => void;
  /** Optional className */
  className?: string;
}

interface GoalResyncOverlayProps {
  /** Original session goal */
  goal: string;
  /** Whether currently analyzing/loading */
  isAnalyzing?: boolean;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Animated dashed circle loading indicator
 */
function DashedCircleLoader({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-24 h-24', className)}>
      {/* Rotating dashed circle */}
      <svg
        className="w-full h-full animate-spin"
        style={{ animationDuration: '3s' }}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="10 5"
          className="text-white/30"
        />
      </svg>
      {/* Inner pulsing circle */}
      <div className="absolute inset-4 rounded-full bg-white/10 animate-pulse flex items-center justify-center">
        <CompassIcon className="w-8 h-8 text-white/70" />
      </div>
    </div>
  );
}

/**
 * Compass icon for goal direction
 */
function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <polygon
        points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Arrow indicating direction back to goal
 */
function RedirectArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 12h18M14 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// Full Screen Loading Overlay
// =============================================================================

/**
 * Full-screen loading overlay shown while re-syncing with goal
 * Per design reference: Dark overlay with animated dashed circle
 */
export function GoalResyncOverlay({
  goal,
  isAnalyzing = true,
  className,
}: GoalResyncOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-foreground/95 backdrop-blur-sm',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Re-syncing with session goal"
    >
      <div className="text-center text-white">
        {/* Loading indicator */}
        <div className="flex justify-center mb-6">
          <DashedCircleLoader />
        </div>

        {/* Status message */}
        <p className="text-xl font-serif mb-2">
          {isAnalyzing ? 'Re-syncing with Goal...' : 'Goal Aligned'}
        </p>

        {/* Goal reminder */}
        <div className="max-w-sm mx-auto mb-6 p-4 rounded-lg bg-white/10">
          <p className="text-xs uppercase tracking-wider text-white/50 mb-1">
            Session Goal
          </p>
          <p className="text-sm italic text-white/80">&ldquo;{goal}&rdquo;</p>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-white/70">
          <CompassIcon className="w-3 h-3" />
          Diadi Agent
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function GoalResync({
  intervention,
  onRefocus,
  onContinue,
  className,
}: GoalResyncProps) {
  const { originalGoal, driftDurationMinutes, message } = intervention;

  return (
    <div
      className={cn(
        'w-full max-w-md p-6 rounded-card',
        'bg-secondary/95 border-2 border-secondary',
        'text-white shadow-elevated backdrop-blur-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <CompassIcon className="w-6 h-6" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20">
            <CompassIcon className="w-3 h-3" />
            Goal Reminder
          </span>
          <p className="text-xs text-white/70 mt-1">
            Off-topic for {driftDurationMinutes} minute{driftDurationMinutes !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Original goal card */}
      <div className="mb-4 p-4 rounded-lg bg-white/10 border border-white/20">
        <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
          Original Goal
        </p>
        <p className="text-sm italic">&ldquo;{originalGoal}&rdquo;</p>
      </div>

      {/* Message */}
      <p className="text-lg font-serif italic leading-relaxed mb-6">
        &ldquo;{message}&rdquo;
      </p>

      {/* Visual indicator */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-white/5">
        <div className="w-8 h-8 rounded-full bg-status-warning/20 flex items-center justify-center">
          <span className="text-lg">🎯</span>
        </div>
        <div className="flex-1">
          <RedirectArrow className="w-full h-4 text-white/30" />
        </div>
        <div className="w-8 h-8 rounded-full bg-status-active/20 flex items-center justify-center">
          <span className="text-lg">✓</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onRefocus}
          className="flex-1 bg-white text-foreground hover:bg-white/90"
        >
          Refocus
        </Button>
        <Button
          onClick={onContinue}
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          Continue Topic
        </Button>
      </div>

      {/* Attribution */}
      <p className="text-[10px] uppercase tracking-wider text-white/50 mt-4 text-center">
        AI Intervention Active
      </p>
    </div>
  );
}

// =============================================================================
// Banner Variant
// =============================================================================

interface GoalResyncBannerProps {
  intervention: GoalDriftIntervention;
  onRefocus: () => void;
  onContinue: () => void;
  className?: string;
}

/**
 * Compact banner variant for less intrusive display
 */
export function GoalResyncBanner({
  intervention,
  onRefocus,
  onContinue,
  className,
}: GoalResyncBannerProps) {
  const { driftDurationMinutes, message } = intervention;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-card',
        'bg-secondary/95 text-white',
        'shadow-elevated',
        className
      )}
    >
      {/* Icon */}
      <CompassIcon className="w-6 h-6 flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs uppercase tracking-wider text-white/70">
            Goal Reminder
          </span>
          <span className="text-xs text-white/50">
            ({driftDurationMinutes}m drift)
          </span>
        </div>
        <p className="text-sm truncate">{message}</p>
      </div>

      {/* Actions */}
      <button
        onClick={onRefocus}
        className="px-3 py-1.5 rounded-button text-xs font-semibold uppercase bg-white/20 hover:bg-white/30"
      >
        Refocus
      </button>
      <button
        onClick={onContinue}
        className="p-1.5 hover:bg-white/10 rounded-full"
        aria-label="Continue"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// Inline Reminder Variant
// =============================================================================

interface GoalReminderProps {
  goal: string;
  className?: string;
}

/**
 * Small inline reminder showing the session goal
 */
export function GoalReminder({ goal, className }: GoalReminderProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'bg-secondary/10 border border-secondary/20',
        className
      )}
    >
      <CompassIcon className="w-4 h-4 text-secondary flex-shrink-0" />
      <p className="text-xs text-foreground truncate">{goal}</p>
    </div>
  );
}

export default GoalResync;
