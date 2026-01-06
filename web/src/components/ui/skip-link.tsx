"use client";

import { cn } from "@/lib/utils";

export interface SkipLinkProps {
  /** ID of the main content element to skip to */
  targetId?: string;
  /** Text to display in the skip link */
  children?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * SkipLink - Accessibility component for keyboard navigation
 *
 * Provides a "Skip to main content" link that becomes visible on focus.
 * This allows keyboard users to bypass repetitive navigation elements.
 *
 * Usage:
 * 1. Add <SkipLink /> at the top of your layout
 * 2. Add id="main-content" to your main content area
 *
 * Reference: requirements.md Section 11.2 Accessibility
 */
export function SkipLink({
  targetId = "main-content",
  children = "Skip to main content",
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Hidden by default, visible on focus
        "sr-only focus:not-sr-only",
        // Position fixed at top
        "focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
        // Visual styling
        "focus:bg-primary focus:text-primary-foreground",
        "focus:px-4 focus:py-2 focus:rounded-lg",
        "focus:shadow-elevated",
        // Focus ring
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        // Typography
        "focus:text-sm focus:font-medium",
        className
      )}
    >
      {children}
    </a>
  );
}

/**
 * Multiple skip links for complex layouts
 */
export interface SkipLinksProps {
  links: Array<{
    targetId: string;
    label: string;
  }>;
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <div
      className={cn(
        // Hidden by default
        "sr-only focus-within:not-sr-only",
        // Position fixed at top
        "focus-within:fixed focus-within:top-4 focus-within:left-4 focus-within:z-[100]",
        // Visual styling
        "focus-within:bg-card focus-within:border focus-within:rounded-lg focus-within:shadow-elevated",
        "focus-within:p-2 focus-within:flex focus-within:flex-col focus-within:gap-1",
        className
      )}
    >
      {links.map((link) => (
        <a
          key={link.targetId}
          href={`#${link.targetId}`}
          className={cn(
            "px-3 py-2 rounded-md text-sm font-medium",
            "hover:bg-accent",
            "focus:bg-primary focus:text-primary-foreground",
            "focus:outline-none"
          )}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export default SkipLink;
