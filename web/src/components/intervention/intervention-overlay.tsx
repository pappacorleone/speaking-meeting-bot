/**
 * Intervention Overlay Component
 *
 * Main overlay component that displays AI interventions during live sessions.
 * Renders the appropriate intervention type variant and handles dismissal,
 * acknowledgment, and auto-dismiss functionality.
 *
 * Design Reference: requirements.md Section 6.8 Intervention UI Design
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  useInterventionStore,
  getAutoDismissTimeout,
} from '@/stores/intervention-store';
import { useModalAccessibility } from '@/hooks/use-focus-trap';
import type {
  InterventionWithMeta,
  InterventionType,
  InterventionPriority,
} from '@/types/intervention';
import { getInterventionLabel } from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

export interface InterventionOverlayProps {
  /** Optional session ID for analytics */
  sessionId?: string;
  /** Callback when intervention is acknowledged */
  onAcknowledge?: (interventionId: string) => void;
  /** Callback when intervention is dismissed (auto or manual) */
  onDismiss?: (interventionId: string, acknowledged: boolean) => void;
  /** Optional className for container styling */
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get styling based on intervention priority
 */
function getPriorityStyles(priority: InterventionPriority): {
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-status-error/95',
        border: 'border-status-error',
        text: 'text-white',
        badge: 'bg-white/20 text-white',
      };
    case 'high':
      return {
        bg: 'bg-foreground/95',
        border: 'border-foreground',
        text: 'text-white',
        badge: 'bg-white/20 text-white',
      };
    case 'medium':
      return {
        bg: 'bg-secondary/95',
        border: 'border-secondary',
        text: 'text-white',
        badge: 'bg-white/20 text-white',
      };
    case 'low':
      return {
        bg: 'bg-background/95',
        border: 'border-muted',
        text: 'text-foreground',
        badge: 'bg-muted/30 text-muted-foreground',
      };
  }
}

/**
 * Get icon SVG for intervention type
 */
function InterventionIcon({
  type,
  className,
}: {
  type: InterventionType;
  className?: string;
}) {
  switch (type) {
    case 'balance':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Scale/balance icon */}
          <path
            d="M12 3v18M3 7l9-4 9 4M3 7l3 10h6M21 7l-3 10h-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'silence':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Mic off icon */}
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
    case 'goal_drift':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Compass icon */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <polygon
            points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"
            fill="currentColor"
          />
        </svg>
      );
    case 'time_warning':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Clock icon */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M12 6v6l4 2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'escalation':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Alert triangle icon */}
          <path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
    case 'icebreaker':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Message circle icon */}
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
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Type badge showing intervention category
 */
function InterventionBadge({
  type,
  priority,
  className,
}: {
  type: InterventionType;
  priority: InterventionPriority;
  className?: string;
}) {
  const styles = getPriorityStyles(priority);
  const label = getInterventionLabel(type);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider',
        styles.badge,
        className
      )}
    >
      <InterventionIcon type={type} className="w-3 h-3" />
      {label}
    </div>
  );
}

/**
 * Progress bar for auto-dismiss countdown
 */
function AutoDismissProgress({
  duration,
  className,
}: {
  duration: number;
  className?: string;
}) {
  return (
    <div className={cn('absolute bottom-0 left-0 right-0 h-1', className)}>
      <div
        className="h-full bg-white/30 origin-left"
        style={{
          animation: `shrink ${duration}ms linear forwards`,
        }}
      />
      <style jsx>{`
        @keyframes shrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Agent avatar icon for intervention header
 */
function AgentAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-full bg-white/10 flex items-center justify-center shrink-0',
        className || 'w-12 h-12'
      )}
    >
      <svg
        className="w-1/2 h-1/2 text-white"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Diadi agent icon - stylized "D" or abstract facilitator */}
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path
          d="M8 8h4a4 4 0 010 8H8V8z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  );
}

// =============================================================================
// Intervention Card Component
// =============================================================================

interface InterventionCardProps {
  intervention: InterventionWithMeta;
  onAcknowledge: () => void;
  onDismiss: () => void;
}

/**
 * The actual intervention card content
 */
function InterventionCard({
  intervention,
  onAcknowledge,
  onDismiss,
}: InterventionCardProps) {
  const styles = getPriorityStyles(intervention.priority);

  // Get CTA text based on intervention type
  const getCtaText = (): string => {
    switch (intervention.type) {
      case 'icebreaker':
        return "I'LL START";
      case 'escalation':
        return 'PAUSE SESSION';
      case 'silence':
        return 'CONTINUE';
      case 'balance':
        return 'UNDERSTOOD';
      case 'goal_drift':
        return 'REFOCUS';
      case 'time_warning':
        return 'GOT IT';
      default:
        return 'ACKNOWLEDGE';
    }
  };

  // Get secondary action text
  const getSecondaryText = (): string | null => {
    switch (intervention.type) {
      case 'escalation':
        return 'CONTINUE';
      default:
        return null;
    }
  };

  const secondaryText = getSecondaryText();

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border-2',
        styles.bg,
        styles.border,
        'backdrop-blur-lg shadow-elevated',
        'transform transition-all duration-300',
        // Animation for critical priority
        intervention.priority === 'critical' && 'animate-pulse'
      )}
    >
      {/* Auto-dismiss progress bar */}
      {intervention.autoDismiss && intervention.autoDismissMs && (
        <AutoDismissProgress duration={intervention.autoDismissMs} />
      )}

      {/* Content */}
      <div className={cn('p-4 sm:p-6', styles.text)}>
        {/* Header with avatar and badge */}
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <AgentAvatar className="w-10 h-10 sm:w-12 sm:h-12" />
          <div className="flex-1 min-w-0">
            <InterventionBadge
              type={intervention.type}
              priority={intervention.priority}
            />
            {intervention.targetParticipant && (
              <p className="text-xs mt-1 opacity-70 truncate">
                For: {intervention.targetParticipant}
              </p>
            )}
          </div>
        </div>

        {/* Message */}
        <p className="text-base sm:text-lg font-serif italic leading-relaxed mb-4 sm:mb-6">
          &ldquo;{intervention.message}&rdquo;
        </p>

        {/* Actions - stack on mobile */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <button
            onClick={onAcknowledge}
            className={cn(
              'flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-button font-semibold text-sm uppercase tracking-wider',
              'transition-all duration-200',
              intervention.priority === 'critical' || intervention.priority === 'high'
                ? 'bg-white text-foreground hover:bg-white/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {getCtaText()}
          </button>
          {secondaryText && (
            <button
              onClick={onDismiss}
              className={cn(
                'py-2.5 sm:py-3 px-4 sm:px-6 rounded-button font-medium text-sm uppercase tracking-wider',
                'border-2 border-white/30 hover:bg-white/10',
                'transition-all duration-200'
              )}
            >
              {secondaryText}
            </button>
          )}
        </div>

        {/* AI attribution badge */}
        <p className="text-[10px] uppercase tracking-wider opacity-50 mt-3 sm:mt-4 text-center">
          AI Intervention Active
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Main Overlay Component
// =============================================================================

/**
 * Main Intervention Overlay component
 *
 * Manages displaying the current intervention from the store,
 * handling auto-dismiss, and emitting callbacks.
 */
export function InterventionOverlay({
  sessionId: _sessionId,
  onAcknowledge,
  onDismiss,
  className,
}: InterventionOverlayProps) {
  // sessionId available for future analytics integration
  void _sessionId;
  const { current, isOverlayVisible, dismiss, acknowledge } =
    useInterventionStore();
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle acknowledge
  const handleAcknowledge = useCallback(() => {
    if (current) {
      acknowledge();
      onAcknowledge?.(current.id);
      onDismiss?.(current.id, true);
    }
  }, [current, acknowledge, onAcknowledge, onDismiss]);

  // Handle dismiss (without acknowledgment)
  const handleDismiss = useCallback(() => {
    if (current) {
      dismiss();
      onDismiss?.(current.id, false);
    }
  }, [current, dismiss, onDismiss]);

  // Focus trapping and escape key handling for accessibility
  // Only allow escape to dismiss non-critical interventions
  const canDismissWithEscape = current?.priority !== 'critical';
  const containerRef = useModalAccessibility<HTMLDivElement>(
    !!(current && isOverlayVisible),
    canDismissWithEscape ? handleDismiss : () => {}
  );

  // Set up auto-dismiss timer
  useEffect(() => {
    // Clear existing timer
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    // Set new timer if applicable
    const timer = getAutoDismissTimeout(current, handleDismiss);
    if (timer) {
      autoDismissTimerRef.current = timer;
    }

    // Cleanup on unmount
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [current, handleDismiss]);

  // Don't render if no current intervention or overlay hidden
  if (!current || !isOverlayVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        // Semi-transparent backdrop
        'bg-black/60 backdrop-blur-sm',
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intervention-title"
      aria-describedby="intervention-message"
    >
      {/* Click outside to dismiss (only for non-critical) */}
      {current.priority !== 'critical' && (
        <button
          type="button"
          className="absolute inset-0 cursor-default"
          onClick={handleDismiss}
          aria-label="Click outside to dismiss intervention"
          tabIndex={-1}
        />
      )}

      {/* Intervention card */}
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <InterventionCard
          intervention={current}
          onAcknowledge={handleAcknowledge}
          onDismiss={handleDismiss}
        />
      </div>
    </div>
  );
}

// =============================================================================
// HUD Banner Variant
// =============================================================================

interface InterventionBannerProps {
  className?: string;
}

/**
 * Banner-style intervention for non-modal display
 * Appears at bottom of screen as a slide-up banner
 */
export function InterventionBanner({ className }: InterventionBannerProps) {
  const { current, isOverlayVisible, dismiss, acknowledge } =
    useInterventionStore();
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    if (current) {
      dismiss();
    }
  }, [current, dismiss]);

  // Handle acknowledge
  const handleAcknowledge = useCallback(() => {
    if (current) {
      acknowledge();
    }
  }, [current, acknowledge]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    const timer = getAutoDismissTimeout(current, handleDismiss);
    if (timer) {
      autoDismissTimerRef.current = timer;
    }

    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [current, handleDismiss]);

  if (!current || !isOverlayVisible) {
    return null;
  }

  const styles = getPriorityStyles(current.priority);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4',
        'animate-in slide-in-from-bottom duration-300',
        className
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-card border-2',
          styles.bg,
          styles.border,
          'backdrop-blur-lg shadow-elevated',
          'mx-auto max-w-2xl',
          'sm:pr-28' // Space for absolute-positioned button on desktop
        )}
      >
        {/* Auto-dismiss progress */}
        {current.autoDismiss && current.autoDismissMs && (
          <AutoDismissProgress duration={current.autoDismissMs} />
        )}

        <div className={cn('p-3 sm:p-4', styles.text)}>
          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5 sm:mt-0">
              <InterventionIcon type={current.type} className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider opacity-70 mb-0.5">
                {getInterventionLabel(current.type)}
              </p>
              <p className="font-medium text-sm sm:text-base line-clamp-2 sm:truncate">{current.message}</p>
            </div>

            {/* Dismiss button - always visible */}
            <button
              onClick={handleDismiss}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action button - separate row on mobile */}
          <div className="mt-2 sm:hidden">
            <button
              onClick={handleAcknowledge}
              className={cn(
                'w-full py-2 px-4 rounded-button text-xs font-semibold uppercase tracking-wider',
                'bg-white/20 hover:bg-white/30 transition-colors'
              )}
            >
              Got it
            </button>
          </div>

          {/* Desktop action button */}
          <div className="hidden sm:flex items-center gap-2 mt-0 absolute right-4 top-1/2 -translate-y-1/2">
            <button
              onClick={handleAcknowledge}
              className={cn(
                'py-2 px-4 rounded-button text-xs font-semibold uppercase tracking-wider',
                'bg-white/20 hover:bg-white/30 transition-colors'
              )}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Minimal Toast Variant
// =============================================================================

interface InterventionToastProps {
  className?: string;
}

/**
 * Minimal toast-style intervention notification
 * For less intrusive alerts
 */
export function InterventionToast({ className }: InterventionToastProps) {
  const { current, isOverlayVisible, dismiss } =
    useInterventionStore();
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    if (current) dismiss();
  }, [current, dismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
    }

    const timer = getAutoDismissTimeout(current, handleDismiss);
    if (timer) {
      autoDismissTimerRef.current = timer;
    }

    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [current, handleDismiss]);

  if (!current || !isOverlayVisible) {
    return null;
  }

  const styles = getPriorityStyles(current.priority);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50',
        'animate-in slide-in-from-right duration-300',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg shadow-elevated',
          styles.bg,
          styles.text,
          'border',
          styles.border,
          'max-w-sm'
        )}
      >
        <InterventionIcon type={current.type} className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm flex-1 min-w-0 truncate">{current.message}</p>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default InterventionOverlay;
