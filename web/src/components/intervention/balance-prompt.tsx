/**
 * Balance Prompt Component
 *
 * Displays when talk time balance exceeds thresholds (65/35 or 70/30).
 * Visual prompt encouraging the quieter participant to share.
 *
 * Reference: requirements.md Section 6.8 Intervention UI Design
 * Trigger: > 65/35 for 3 minutes (visual), > 70/30 for 5 minutes (voice optional)
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { BalanceIntervention } from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

interface BalancePromptProps {
  /** The balance intervention data */
  intervention: BalanceIntervention;
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
 * Visual balance indicator bar
 */
function BalanceBar({
  dominant,
  quiet,
}: {
  dominant: { name: string; percentage: number };
  quiet: { name: string; percentage: number };
}) {
  // Determine colors based on severity
  const severity = dominant.percentage >= 70 ? 'severe' : 'mild';
  const dominantColor =
    severity === 'severe' ? 'bg-status-error' : 'bg-status-warning';
  const quietColor = 'bg-status-active';

  return (
    <div className="space-y-2">
      {/* Balance bar */}
      <div className="h-3 rounded-full overflow-hidden bg-muted/20 flex">
        <div
          className={cn('h-full transition-all duration-500', dominantColor)}
          style={{ width: `${dominant.percentage}%` }}
        />
        <div
          className={cn('h-full transition-all duration-500', quietColor)}
          style={{ width: `${quiet.percentage}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs">
        <span className="text-white/80">
          {dominant.name}: {dominant.percentage}%
        </span>
        <span className="text-white/80">
          {quiet.name}: {quiet.percentage}%
        </span>
      </div>
    </div>
  );
}

/**
 * Scale/balance icon with animation
 */
function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Animated tilted scale */}
      <g className="origin-center" style={{ transform: 'rotate(-15deg)' }}>
        <path
          d="M12 3v18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M3 7l9-4 9 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Left pan (higher - less weight) */}
        <circle cx="5" cy="9" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
        {/* Right pan (lower - more weight) */}
        <circle
          cx="19"
          cy="13"
          r="3"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </g>
    </svg>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function BalancePrompt({
  intervention,
  onAcknowledge,
  onDismiss,
  className,
}: BalancePromptProps) {
  const { currentBalance, message, targetParticipant } = intervention;
  const severity = currentBalance.dominant.percentage >= 70 ? 'severe' : 'mild';

  return (
    <div
      className={cn(
        'w-full max-w-md p-6 rounded-card',
        severity === 'severe'
          ? 'bg-status-error/95 border-2 border-status-error'
          : 'bg-foreground/95 border-2 border-foreground',
        'text-white shadow-elevated backdrop-blur-lg',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <ScaleIcon className="w-6 h-6" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20">
            Balance Check
          </span>
        </div>
      </div>

      {/* Balance visualization */}
      <div className="mb-4">
        <BalanceBar
          dominant={currentBalance.dominant}
          quiet={currentBalance.quiet}
        />
      </div>

      {/* Message */}
      <p className="text-lg font-serif italic leading-relaxed mb-2">
        &ldquo;{message}&rdquo;
      </p>

      {/* Target participant note */}
      {targetParticipant && (
        <p className="text-sm text-white/70 mb-6">
          Encouraging <strong>{targetParticipant}</strong> to share their perspective.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onAcknowledge}
          className="flex-1 bg-white text-foreground hover:bg-white/90"
        >
          Understood
        </Button>
        {severity !== 'severe' && (
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

interface BalancePromptBannerProps {
  intervention: BalanceIntervention;
  onAcknowledge: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * Compact banner variant for less intrusive display
 */
export function BalancePromptBanner({
  intervention,
  onAcknowledge,
  onDismiss,
  className,
}: BalancePromptBannerProps) {
  const { currentBalance, message } = intervention;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-card',
        'bg-foreground/95 text-white',
        'shadow-elevated',
        className
      )}
    >
      {/* Icon */}
      <ScaleIcon className="w-6 h-6 flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase tracking-wider text-white/70">
            Balance Check
          </span>
          <span className="text-xs text-white/50">
            {currentBalance.dominant.percentage}% / {currentBalance.quiet.percentage}%
          </span>
        </div>
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

export default BalancePrompt;
