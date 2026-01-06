/**
 * Silence Prompt Component
 *
 * Displays when silence exceeds threshold (> 15 seconds).
 * Gentle prompt to break the silence without pressure.
 *
 * Reference: requirements.md Section 6.8 Intervention UI Design
 * Trigger: > 15 seconds of silence
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SilenceIntervention } from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

interface SilencePromptProps {
  /** The silence intervention data */
  intervention: SilenceIntervention;
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
 * Animated silence indicator with expanding rings
 */
function SilenceIndicator({ duration }: { duration: number }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Expanding rings */}
      <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ping" />
      <div
        className="absolute inset-2 rounded-full bg-secondary/30 animate-ping"
        style={{ animationDelay: '0.3s' }}
      />
      {/* Center circle with duration */}
      <div className="relative w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center">
        <span className="text-sm font-mono text-white">{duration}s</span>
      </div>
    </div>
  );
}

/**
 * Microphone off icon
 */
function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4m-4 0h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SilencePrompt({
  intervention,
  onAcknowledge,
  onDismiss,
  className,
}: SilencePromptProps) {
  const { silenceDurationSeconds, message } = intervention;

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
      <div className="flex items-center gap-4 mb-6">
        <SilenceIndicator duration={silenceDurationSeconds} />
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/20">
            <MicOffIcon className="w-3 h-3" />
            Silence Break
          </span>
          <p className="text-sm text-white/70 mt-1">
            {silenceDurationSeconds} seconds of quiet
          </p>
        </div>
      </div>

      {/* Message */}
      <p className="text-lg font-serif italic leading-relaxed mb-6">
        &ldquo;{message}&rdquo;
      </p>

      {/* Suggestion prompts */}
      <div className="space-y-2 mb-6">
        <p className="text-xs uppercase tracking-wider text-white/50 mb-2">
          Conversation starters:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "What's on your mind?",
            "Take your time...",
            "Would you like to share?",
          ].map((prompt) => (
            <span
              key={prompt}
              className="px-3 py-1.5 rounded-full bg-white/10 text-xs text-white/80"
            >
              {prompt}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={onAcknowledge}
          className="flex-1 bg-white text-foreground hover:bg-white/90"
        >
          Continue
        </Button>
        <Button
          onClick={onDismiss}
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          Dismiss
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
// Compact Banner Variant
// =============================================================================

interface SilencePromptBannerProps {
  intervention: SilenceIntervention;
  onAcknowledge: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * Compact banner variant for less intrusive display
 */
export function SilencePromptBanner({
  intervention,
  onAcknowledge,
  onDismiss,
  className,
}: SilencePromptBannerProps) {
  const { silenceDurationSeconds, message } = intervention;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-card',
        'bg-secondary/95 text-white',
        'shadow-elevated',
        className
      )}
    >
      {/* Icon with duration */}
      <div className="relative flex-shrink-0">
        <MicOffIcon className="w-6 h-6" />
        <span className="absolute -bottom-1 -right-1 text-[10px] font-mono bg-white/20 px-1 rounded">
          {silenceDurationSeconds}s
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-white/70 mb-0.5">
          Silence Break
        </p>
        <p className="text-sm truncate">{message}</p>
      </div>

      {/* Actions */}
      <button
        onClick={onAcknowledge}
        className="px-3 py-1.5 rounded-button text-xs font-semibold uppercase bg-white/20 hover:bg-white/30"
      >
        Continue
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

export default SilencePrompt;
