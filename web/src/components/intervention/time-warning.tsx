/**
 * Time Warning Component
 *
 * Displays time remaining warnings at key milestones (5 min, 2 min, 1 min).
 * Helps participants manage their session time effectively.
 *
 * Reference: requirements.md Section 6.8 Intervention UI Design
 * Triggers at 5 minutes, 2 minutes, and 1 minute remaining
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { TimeWarningIntervention } from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

interface TimeWarningProps {
  /** The time warning intervention data */
  intervention: TimeWarningIntervention;
  /** Called when user acknowledges the prompt */
  onAcknowledge: () => void;
  /** Called to dismiss without acknowledgment */
  onDismiss: () => void;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Get urgency level based on minutes remaining
 */
function getUrgency(minutes: number): 'low' | 'medium' | 'high' {
  if (minutes <= 1) return 'high';
  if (minutes <= 2) return 'medium';
  return 'low';
}

/**
 * Get styling based on urgency
 */
function getUrgencyStyles(urgency: 'low' | 'medium' | 'high') {
  switch (urgency) {
    case 'high':
      return {
        bg: 'bg-status-error/95',
        border: 'border-status-error',
        ring: 'ring-status-error/50',
        accent: 'text-status-error',
      };
    case 'medium':
      return {
        bg: 'bg-status-warning/95',
        border: 'border-status-warning',
        ring: 'ring-status-warning/50',
        accent: 'text-status-warning',
      };
    case 'low':
      return {
        bg: 'bg-foreground/95',
        border: 'border-foreground',
        ring: 'ring-foreground/30',
        accent: 'text-status-info',
      };
  }
}

/**
 * Animated clock icon
 */
function ClockIcon({
  className,
  minutes,
}: {
  className?: string;
  minutes: number;
}) {
  // Calculate minute hand position (approximate for visual)
  const minuteAngle = (12 - minutes) * 30; // 30 degrees per 5-minute increment

  return (
    <svg
      className={className}
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
      />
      {/* Hour hand (static) */}
      <path
        d="M12 12V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Minute hand (dynamic) */}
      <path
        d="M12 12L12 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        style={{
          transformOrigin: '12px 12px',
          transform: `rotate(${minuteAngle}deg)`,
        }}
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

/**
 * Countdown display with animated ring
 */
function CountdownDisplay({ minutes }: { minutes: number }) {
  const urgency = getUrgency(minutes);

  return (
    <div className="relative w-20 h-20">
      {/* Background ring */}
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white/10"
        />
        {/* Progress ring (showing time left as portion of 30 minutes max) */}
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={`${(minutes / 30) * 100} 100`}
          strokeLinecap="round"
          className={cn(
            urgency === 'high' && 'text-status-error',
            urgency === 'medium' && 'text-status-warning',
            urgency === 'low' && 'text-white/70'
          )}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-bold">{minutes}</span>
          <span className="text-xs block text-white/70">min</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TimeWarning({
  intervention,
  onAcknowledge,
  onDismiss,
  className,
}: TimeWarningProps) {
  const { minutesRemaining, message } = intervention;
  const urgency = getUrgency(minutesRemaining);
  const styles = getUrgencyStyles(urgency);

  return (
    <div
      className={cn(
        'w-full max-w-md p-6 rounded-card border-2',
        styles.bg,
        styles.border,
        'text-white shadow-elevated backdrop-blur-lg',
        // Animate for critical time
        urgency === 'high' && 'animate-pulse',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <CountdownDisplay minutes={minutesRemaining} />
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20">
            <ClockIcon className="w-3 h-3" minutes={minutesRemaining} />
            Time Check
          </span>
          <p className="text-lg font-semibold mt-1">
            {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>

      {/* Message */}
      <p className="text-lg font-serif italic leading-relaxed mb-6">
        &ldquo;{message}&rdquo;
      </p>

      {/* Time management tips based on urgency */}
      {urgency !== 'high' && (
        <div className="mb-6 p-3 rounded-lg bg-white/10">
          <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
            Consider:
          </p>
          <ul className="text-sm space-y-1 text-white/80">
            {minutesRemaining >= 5 && (
              <>
                <li>• What&apos;s most important to discuss?</li>
                <li>• Any decisions to make before ending?</li>
              </>
            )}
            {minutesRemaining < 5 && minutesRemaining >= 2 && (
              <>
                <li>• Summarize key agreements</li>
                <li>• Note any follow-up items</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* Urgent warning for 1 minute */}
      {urgency === 'high' && (
        <div className="mb-6 p-3 rounded-lg bg-white/20 border border-white/30">
          <p className="text-sm font-medium">
            Time for closing thoughts and any final agreements.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onAcknowledge}
          className={cn(
            'flex-1',
            urgency === 'high'
              ? 'bg-white text-status-error hover:bg-white/90'
              : 'bg-white text-foreground hover:bg-white/90'
          )}
        >
          Got It
        </Button>
        {urgency !== 'high' && (
          <Button
            onClick={onDismiss}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            Dismiss
          </Button>
        )}
      </div>

      {/* Attribution */}
      <p className="text-[10px] uppercase tracking-wider text-white/50 mt-4 text-center">
        AI Intervention Active
      </p>
    </div>
  );
}

// =============================================================================
// Compact Banner Variant
// =============================================================================

interface TimeWarningBannerProps {
  intervention: TimeWarningIntervention;
  onAcknowledge: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * Compact banner variant for less intrusive display
 */
export function TimeWarningBanner({
  intervention,
  onAcknowledge,
  onDismiss,
  className,
}: TimeWarningBannerProps) {
  const { minutesRemaining, message } = intervention;
  const urgency = getUrgency(minutesRemaining);
  const styles = getUrgencyStyles(urgency);

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-card border-2',
        styles.bg,
        styles.border,
        'text-white shadow-elevated',
        urgency === 'high' && 'animate-pulse',
        className
      )}
    >
      {/* Time display */}
      <div className="flex-shrink-0 text-center">
        <span className="text-2xl font-bold">{minutesRemaining}</span>
        <span className="text-xs block text-white/70">min</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-white/70 mb-0.5">
          Time Warning
        </p>
        <p className="text-sm truncate">{message}</p>
      </div>

      {/* Actions */}
      <button
        onClick={onAcknowledge}
        className="px-3 py-1.5 rounded-button text-xs font-semibold uppercase bg-white/20 hover:bg-white/30"
      >
        Got it
      </button>
      <button
        onClick={onDismiss}
        className="p-1.5 hover:bg-white/10 rounded-full"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// Minimal HUD Variant
// =============================================================================

interface TimeWarningHUDProps {
  minutesRemaining: number;
  className?: string;
}

/**
 * Minimal HUD overlay for persistent time display
 */
export function TimeWarningHUD({ minutesRemaining, className }: TimeWarningHUDProps) {
  const urgency = getUrgency(minutesRemaining);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
        'bg-black/60 backdrop-blur-sm',
        urgency === 'high' && 'animate-pulse',
        className
      )}
    >
      <ClockIcon
        className={cn(
          'w-4 h-4',
          urgency === 'high' && 'text-status-error',
          urgency === 'medium' && 'text-status-warning',
          urgency === 'low' && 'text-white/70'
        )}
        minutes={minutesRemaining}
      />
      <span
        className={cn(
          'text-sm font-medium',
          urgency === 'high' && 'text-status-error',
          urgency === 'medium' && 'text-status-warning',
          urgency === 'low' && 'text-white'
        )}
      >
        {minutesRemaining}m left
      </span>
    </div>
  );
}

export default TimeWarning;
