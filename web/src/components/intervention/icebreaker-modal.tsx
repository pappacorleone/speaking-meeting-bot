/**
 * Icebreaker Modal Component
 *
 * Displays at the start of a session with a contextual conversation starter.
 * Modal overlay with agent avatar and "I'LL START" CTA.
 *
 * Reference: requirements.md Section 6.8 Intervention UI Design
 * - Modal overlay on video
 * - Agent avatar icon (circular, branded)
 * - Header: "AGENT ICEBREAKER"
 * - Message: Quoted facilitation prompt contextual to session goal
 * - CTA: "I'LL START" (dark button)
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { IcebreakerIntervention } from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

interface IcebreakerModalProps {
  /** The icebreaker intervention data */
  intervention: IcebreakerIntervention;
  /** Session goal for context */
  sessionGoal?: string;
  /** Partner name for personalization */
  partnerName?: string;
  /** Called when user clicks "I'll Start" */
  onStart: () => void;
  /** Called to dismiss (let AI start) */
  onLetAIStart?: () => void;
  /** Optional className */
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * Diadi Agent Avatar with animated ring
 */
function AgentAvatar({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Animated outer ring */}
      <div className="absolute inset-0 rounded-full bg-secondary/30 animate-ping" />
      <div
        className="absolute inset-1 rounded-full bg-secondary/20 animate-ping"
        style={{ animationDelay: '0.3s' }}
      />
      {/* Main avatar */}
      <div className="relative w-20 h-20 rounded-full bg-secondary/90 flex items-center justify-center ring-4 ring-secondary/30">
        <svg
          className="w-10 h-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diadi agent icon - stylized facilitator/mediator */}
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M8 8h4a4 4 0 010 8H8V8z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Message bubble icon
 */
function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
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

export function IcebreakerModal({
  intervention,
  sessionGoal,
  partnerName,
  onStart,
  onLetAIStart,
  className,
}: IcebreakerModalProps) {
  const { message, prompt } = intervention;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/70 backdrop-blur-sm',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="icebreaker-title"
    >
      {/* Card */}
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-background rounded-card shadow-elevated p-8 text-center">
          {/* Agent avatar */}
          <div className="flex justify-center mb-6">
            <AgentAvatar />
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-secondary/10 text-secondary mb-4">
            <MessageIcon className="w-3 h-3" />
            Agent Icebreaker
          </span>

          {/* Title */}
          <h2
            id="icebreaker-title"
            className="text-2xl font-serif text-foreground mb-2"
          >
            Ready to Begin
          </h2>

          {/* Context */}
          {partnerName && (
            <p className="text-sm text-muted-foreground mb-4">
              Starting your conversation with <strong>{partnerName}</strong>
            </p>
          )}

          {/* Session goal reminder */}
          {sessionGoal && (
            <div className="mb-6 p-4 rounded-lg bg-muted/30 text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                Session Goal
              </p>
              <p className="text-sm text-foreground italic">&ldquo;{sessionGoal}&rdquo;</p>
            </div>
          )}

          {/* Icebreaker prompt */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Opening Prompt
            </p>
            <p className="text-lg font-serif italic text-foreground leading-relaxed">
              &ldquo;{prompt || message}&rdquo;
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={onStart} className="w-full" size="lg">
              I&apos;ll Start
            </Button>
            {onLetAIStart && (
              <button
                onClick={onLetAIStart}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Let the AI introduce
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Inline Prompt Variant
// =============================================================================

interface IcebreakerPromptProps {
  prompt: string;
  onStart?: () => void;
  className?: string;
}

/**
 * Inline prompt variant for display within the session UI
 */
export function IcebreakerPrompt({
  prompt,
  onStart,
  className,
}: IcebreakerPromptProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-card bg-secondary/10 border border-secondary/20',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
          <MessageIcon className="w-5 h-5 text-secondary" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wider text-secondary mb-1">
            Icebreaker
          </p>
          <p className="text-sm text-foreground italic">&ldquo;{prompt}&rdquo;</p>
        </div>

        {/* Action */}
        {onStart && (
          <Button
            onClick={onStart}
            size="sm"
            variant="secondary"
            className="flex-shrink-0"
          >
            Start
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Compact Card Variant
// =============================================================================

interface IcebreakerCardProps {
  intervention: IcebreakerIntervention;
  onStart: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * Compact card variant for non-modal display
 */
export function IcebreakerCard({
  intervention,
  onStart,
  onDismiss,
  className,
}: IcebreakerCardProps) {
  const { message, prompt } = intervention;

  return (
    <div
      className={cn(
        'w-full max-w-md p-6 rounded-card',
        'bg-background border border-border',
        'shadow-elevated',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
          <MessageIcon className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-secondary/10 text-secondary">
            Agent Icebreaker
          </span>
        </div>
      </div>

      {/* Prompt */}
      <p className="text-lg font-serif italic text-foreground leading-relaxed mb-6">
        &ldquo;{prompt || message}&rdquo;
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={onStart} className="flex-1">
          I&apos;ll Start
        </Button>
        <Button onClick={onDismiss} variant="ghost" className="text-muted-foreground">
          Skip
        </Button>
      </div>
    </div>
  );
}

export default IcebreakerModal;
