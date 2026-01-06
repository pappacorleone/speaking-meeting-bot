"use client";

import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  /** Screen reader label */
  label?: string;
  /** Additional className */
  className?: string;
}

/**
 * LoadingSpinner - Accessible loading indicator
 *
 * Provides visual spinning animation with proper ARIA attributes
 * for screen reader accessibility.
 *
 * Reference: requirements.md Section 11.2 Accessibility
 */
export function LoadingSpinner({
  size = "md",
  label = "Loading",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
  };

  return (
    <div
      role="status"
      aria-label={label}
      aria-live="polite"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-muted-foreground/30 border-t-foreground",
          sizeClasses[size]
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Screen reader label */
  label?: string;
  /** Additional text to display below spinner */
  message?: string;
  /** Additional className */
  className?: string;
}

/**
 * LoadingOverlay - Full-screen loading state
 *
 * Covers the entire viewport with a loading indicator.
 * Announces loading state to screen readers.
 */
export function LoadingOverlay({
  isLoading,
  label = "Loading",
  message,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
      role="alert"
      aria-busy="true"
      aria-live="assertive"
    >
      <LoadingSpinner size="lg" label={label} />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export interface LoadingSkeletonProps {
  /** Width class (e.g., "w-full", "w-32") */
  width?: string;
  /** Height class (e.g., "h-4", "h-8") */
  height?: string;
  /** Shape variant */
  variant?: "text" | "circular" | "rectangular";
  /** Screen reader label */
  label?: string;
  /** Additional className */
  className?: string;
}

/**
 * LoadingSkeleton - Placeholder skeleton for loading content
 *
 * Provides animated placeholder that matches content dimensions.
 * Screen readers announce as loading state.
 */
export function LoadingSkeleton({
  width = "w-full",
  height = "h-4",
  variant = "rectangular",
  label = "Loading content",
  className,
}: LoadingSkeletonProps) {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "animate-pulse bg-muted",
        width,
        height,
        variantClasses[variant],
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface LoadingDotsProps {
  /** Screen reader label */
  label?: string;
  /** Additional className */
  className?: string;
}

/**
 * LoadingDots - Animated dot indicator for inline loading states
 */
export function LoadingDots({ label = "Loading", className }: LoadingDotsProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center gap-1", className)}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export default LoadingSpinner;
