/**
 * Escalation Alert Component
 *
 * Displays when emotional intensity or tension is detected.
 * Critical intervention that requires acknowledgment.
 *
 * Reference: requirements.md Section 6.8 Intervention UI Design
 * - Dark overlay banner at bottom of screen
 * - Warning icon (triangle)
 * - Actions: "PAUSE SESSION" and "CONTINUE"
 * - Badge: "AI INTERVENTION ACTIVE"
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { EscalationIntervention } from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

interface EscalationAlertProps {
  /** The escalation intervention data */
  intervention: EscalationIntervention;
  /** Called when user chooses to pause */
  onPause: () => void;
  /** Called when user chooses to continue */
  onContinue: () => void;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Get severity level based on tension score
 */
function getSeverity(score: number): 'moderate' | 'high' | 'critical' {
  if (score >= 0.9) return 'critical';
  if (score >= 0.8) return 'high';
  return 'moderate';
}

/**
 * Alert triangle icon with animation
 */
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
        fill="none"
      />
      <line
        x1="12"
        y1="9"
        x2="12"
        y2="13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Tension meter visualization
 */
function TensionMeter({ score, className }: { score: number; className?: string }) {
  const severity = getSeverity(score);
  const percentage = Math.round(score * 100);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Meter bar */}
      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            severity === 'critical' && 'bg-red-500',
            severity === 'high' && 'bg-orange-500',
            severity === 'moderate' && 'bg-yellow-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Percentage */}
      <span className="text-xs font-mono text-white/70 w-10">
        {percentage}%
      </span>
    </div>
  );
}

/**
 * Suggested action based on intervention type
 */
function SuggestedActionBadge({
  action,
}: {
  action: 'pause' | 'redirect' | 'acknowledge';
}) {
  const labels = {
    pause: 'Pause Recommended',
    redirect: 'Topic Redirect',
    acknowledge: 'Acknowledgment Needed',
  };

  const icons = {
    pause: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
      </svg>
    ),
    redirect: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    acknowledge: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-medium uppercase tracking-wider">
      {icons[action]}
      {labels[action]}
    </span>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function EscalationAlert({
  intervention,
  onPause,
  onContinue,
  className,
}: EscalationAlertProps) {
  const { tensionScore, suggestedAction, message } = intervention;
  const severity = getSeverity(tensionScore);

  return (
    <div
      className={cn(
        'w-full max-w-lg p-6 rounded-card border-2',
        'bg-status-error/95 border-status-error',
        'text-white shadow-elevated backdrop-blur-lg',
        // Pulsing animation for critical
        severity === 'critical' && 'animate-pulse',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangleIcon className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1">
            Emotional Intensity High
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20">
              <AlertTriangleIcon className="w-3 h-3" />
              Tension Alert
            </span>
            <SuggestedActionBadge action={suggestedAction} />
          </div>
        </div>
      </div>

      {/* Tension meter */}
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
          Detected Tension Level
        </p>
        <TensionMeter score={tensionScore} />
      </div>

      {/* Message */}
      <p className="text-lg font-serif italic leading-relaxed mb-6">
        &ldquo;{message}&rdquo;
      </p>

      {/* Grounding suggestion */}
      <div className="mb-6 p-4 rounded-lg bg-white/10 border border-white/20">
        <p className="text-sm font-medium mb-2">Suggested Response:</p>
        <p className="text-sm text-white/80">
          {suggestedAction === 'pause' && (
            <>
              Would a 2-minute breath-pause help both of you? Taking a short
              break can help reset the conversation.
            </>
          )}
          {suggestedAction === 'redirect' && (
            <>
              Consider shifting focus to common ground. What do you both agree
              on about this topic?
            </>
          )}
          {suggestedAction === 'acknowledge' && (
            <>
              Sometimes acknowledging strong feelings helps. Try: &ldquo;I can see
              this is important to both of us.&rdquo;
            </>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onPause}
          className="flex-1 bg-white text-status-error hover:bg-white/90 font-semibold"
        >
          Pause Session
        </Button>
        <Button
          onClick={onContinue}
          variant="outline"
          className="flex-1 border-2 border-white/30 text-white hover:bg-white/10 bg-transparent"
        >
          Continue
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
// Banner Variant (Bottom of Screen)
// =============================================================================

interface EscalationBannerProps {
  intervention: EscalationIntervention;
  onPause: () => void;
  onContinue: () => void;
  className?: string;
}

/**
 * Banner variant that appears at bottom of screen per design reference
 */
export function EscalationBanner({
  intervention,
  onPause,
  onContinue,
  className,
}: EscalationBannerProps) {
  const { tensionScore, message } = intervention;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'animate-in slide-in-from-bottom duration-300',
        className
      )}
    >
      <div className="bg-status-error/95 backdrop-blur-lg border-t-2 border-status-error">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <AlertTriangleIcon className="w-8 h-8 text-white animate-pulse" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-white">
                  Emotional Intensity High
                </h4>
                <span className="text-xs text-white/70">
                  ({Math.round(tensionScore * 100)}%)
                </span>
              </div>
              <p className="text-sm text-white/80 truncate">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={onPause}
                size="sm"
                className="bg-white text-status-error hover:bg-white/90"
              >
                Pause Session
              </Button>
              <Button
                onClick={onContinue}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Continue
              </Button>
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center mt-2">
            <span className="text-[10px] uppercase tracking-wider text-white/50">
              AI Intervention Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EscalationAlert;
