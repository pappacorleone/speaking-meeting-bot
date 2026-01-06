"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SideRail } from "./side-rail";
import { MobileNav } from "./mobile-nav";
import { SkipLink } from "@/components/ui/skip-link";

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * AppLayout provides responsive navigation for the Diadi application.
 *
 * On mobile (< md breakpoint):
 * - Fixed bottom navigation bar with Home, New Session (center CTA), and Partners
 * - Content takes full width with padding at bottom for nav bar
 *
 * On desktop (>= md breakpoint):
 * - Collapsible side rail on the left
 * - Collapsed: Icon-only vertical rail (64px width)
 * - Expanded: Full sidebar with labels (256px width)
 *
 * Accessibility:
 * - Skip link for keyboard navigation (visible on focus)
 * - Main content has id="main-content" for skip link target
 * - Proper landmark roles via semantic HTML
 */
export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip link for keyboard navigation */}
      <SkipLink />

      {/* Desktop side rail - hidden on mobile */}
      <SideRail />

      {/* Main content area */}
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          "flex-1",
          // Add bottom padding on mobile to account for fixed nav bar
          "pb-20 md:pb-0",
          // Focus outline for skip link target
          "focus:outline-none",
          className
        )}
      >
        {children}
      </main>

      {/* Mobile bottom nav - hidden on desktop */}
      <MobileNav />
    </div>
  );
}
