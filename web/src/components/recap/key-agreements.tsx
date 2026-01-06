'use client';

import * as React from 'react';
import { CheckCircle2, Handshake, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { KeyAgreement } from '@/types/session';

// =============================================================================
// Types
// =============================================================================

interface KeyAgreementsProps {
  agreements: KeyAgreement[];
  className?: string;
}

interface KeyAgreementCardProps {
  agreement: KeyAgreement;
  index: number;
  variant?: 'default' | 'compact';
  className?: string;
}

interface KeyAgreementsListProps {
  agreements: KeyAgreement[];
  variant?: 'grid' | 'list';
  className?: string;
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Individual key agreement card with title and description.
 */
export function KeyAgreementCard({
  agreement,
  index,
  variant = 'default',
  className,
}: KeyAgreementCardProps) {
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border bg-card p-3',
          className
        )}
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-semibold text-secondary">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{agreement.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
            {agreement.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-secondary" />
          <CardTitle className="text-sm">
            <span className="section-header">KEY AGREEMENT {index + 1}</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <h4 className="mb-2 font-serif text-lg font-semibold">{agreement.title}</h4>
        <p className="text-sm text-muted-foreground">{agreement.description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * List view of key agreements (vertical stack).
 */
export function KeyAgreementsList({
  agreements,
  variant = 'grid',
  className,
}: KeyAgreementsListProps) {
  if (agreements.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Handshake className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          No agreements were identified in this session.
        </p>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {agreements.map((agreement, index) => (
          <KeyAgreementCard
            key={index}
            agreement={agreement}
            index={index}
            variant="compact"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2',
        className
      )}
    >
      {agreements.map((agreement, index) => (
        <KeyAgreementCard key={index} agreement={agreement} index={index} />
      ))}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * KeyAgreements - Section displaying key agreements reached during the session.
 *
 * Reference: requirements.md Section 6.9 Post-Session Recap Design
 */
export function KeyAgreements({ agreements, className }: KeyAgreementsProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="section-header">KEY AGREEMENTS</h3>
        {agreements.length > 0 && (
          <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            {agreements.length} {agreements.length === 1 ? 'agreement' : 'agreements'}
          </span>
        )}
      </div>

      {/* Agreements grid */}
      <KeyAgreementsList agreements={agreements} variant="grid" />
    </div>
  );
}

/**
 * KeyAgreementsInline - Compact inline version for sidebars.
 */
export function KeyAgreementsInline({
  agreements,
  maxItems = 3,
  onViewAll,
  className,
}: {
  agreements: KeyAgreement[];
  maxItems?: number;
  onViewAll?: () => void;
  className?: string;
}) {
  const displayedAgreements = agreements.slice(0, maxItems);
  const hasMore = agreements.length > maxItems;

  return (
    <div className={cn('space-y-3', className)}>
      <h4 className="section-header">KEY AGREEMENTS</h4>

      {agreements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No agreements identified.</p>
      ) : (
        <>
          <div className="space-y-2">
            {displayedAgreements.map((agreement, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                <span className="font-medium">{agreement.title}</span>
              </div>
            ))}
          </div>

          {hasMore && onViewAll && (
            <button
              onClick={onViewAll}
              className="flex items-center gap-1 text-sm font-medium text-secondary hover:underline"
            >
              View all {agreements.length} agreements
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * KeyAgreementsSkeleton - Loading skeleton for key agreements.
 */
export function KeyAgreementsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mt-2 space-y-1.5">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
