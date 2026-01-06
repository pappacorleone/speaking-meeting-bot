'use client';

import * as React from 'react';
import { Share2, Download, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SessionSummary, TalkBalanceMetrics } from '@/types/session';

// =============================================================================
// Types
// =============================================================================

interface SynthesisBoardProps {
  summary: SessionSummary;
  sessionTitle?: string;
  endedAt?: string;
  onBack?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  className?: string;
}

interface SynthesisBoardHeaderProps {
  sessionTitle?: string;
  endedAt?: string;
  onBack?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

interface ConsensusSummaryCardProps {
  summary: string;
  className?: string;
}

interface SessionMetricsProps {
  durationMinutes: number;
  interventionCount: number;
  balance: TalkBalanceMetrics;
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function getBalanceColor(status: TalkBalanceMetrics['status']): string {
  switch (status) {
    case 'balanced':
      return 'text-status-active';
    case 'mild_imbalance':
      return 'text-status-warning';
    case 'severe_imbalance':
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Header for the synthesis board with navigation and actions.
 */
function SynthesisBoardHeader({
  sessionTitle,
  endedAt,
  onBack,
  onShare,
  onDownload,
}: SynthesisBoardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left side: Navigation and badge */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="section-header text-secondary">
              RECAP 1 / SYNTHESIS BOARD
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
              RECAP MODE
            </span>
          </div>
          {(sessionTitle || endedAt) && (
            <p className="text-sm text-muted-foreground">
              {sessionTitle && <span>{sessionTitle}</span>}
              {sessionTitle && endedAt && <span className="mx-2">-</span>}
              {endedAt && <span>{formatDate(endedAt)}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {onShare && (
          <Button variant="outline" size="sm" onClick={onShare}>
            <Share2 className="mr-2 h-4 w-4" />
            SHARE RECAP
          </Button>
        )}
        {onDownload && (
          <Button variant="secondary" size="sm" onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            DOWNLOAD PDF
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Card displaying the AI-generated consensus summary.
 */
function ConsensusSummaryCard({ summary, className }: ConsensusSummaryCardProps) {
  return (
    <Card className={cn('border-secondary/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="section-header text-secondary">
            AI CONSENSUS SUMMARY
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <blockquote className="border-l-4 border-secondary pl-4">
          <p className="font-serif text-lg italic leading-relaxed text-foreground/90">
            &ldquo;{summary}&rdquo;
          </p>
        </blockquote>
      </CardContent>
    </Card>
  );
}

/**
 * Session metrics display showing duration, interventions, and balance.
 */
function SessionMetrics({
  durationMinutes,
  interventionCount,
  balance,
  className,
}: SessionMetricsProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-4', className)}>
      {/* Duration */}
      <div className="text-center">
        <p className="section-header mb-1">DURATION</p>
        <p className="text-2xl font-semibold">{formatDuration(durationMinutes)}</p>
      </div>

      {/* Interventions */}
      <div className="text-center">
        <p className="section-header mb-1">INTERVENTIONS</p>
        <p className="text-2xl font-semibold">{interventionCount}</p>
      </div>

      {/* Balance */}
      <div className="text-center">
        <p className="section-header mb-1">BALANCE</p>
        <div className="flex flex-col items-center">
          <p className="text-lg font-semibold">
            {balance.participantA.percentage}% / {balance.participantB.percentage}%
          </p>
          <span
            className={cn(
              'text-xs font-medium uppercase',
              getBalanceColor(balance.status)
            )}
          >
            {balance.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * SynthesisBoard - Main post-session summary view.
 *
 * Displays the AI consensus summary, key metrics, and provides
 * actions for sharing and downloading the recap.
 *
 * Reference: requirements.md Section 6.9 Post-Session Recap Design
 */
export function SynthesisBoard({
  summary,
  sessionTitle,
  endedAt,
  onBack,
  onShare,
  onDownload,
  className,
}: SynthesisBoardProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with navigation and actions */}
      <SynthesisBoardHeader
        sessionTitle={sessionTitle}
        endedAt={endedAt}
        onBack={onBack}
        onShare={onShare}
        onDownload={onDownload}
      />

      {/* Main consensus summary card */}
      <ConsensusSummaryCard summary={summary.consensusSummary} />

      {/* Session metrics */}
      <Card>
        <CardContent className="pt-6">
          <SessionMetrics
            durationMinutes={summary.durationMinutes}
            interventionCount={summary.interventionCount}
            balance={summary.balance}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * SynthesisBoardSkeleton - Loading skeleton for the synthesis board.
 */
export function SynthesisBoardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 animate-pulse rounded-button bg-muted" />
          <div className="h-9 w-36 animate-pulse rounded-button bg-muted" />
        </div>
      </div>

      {/* Summary card skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2 border-l-4 border-muted pl-4">
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>

      {/* Metrics skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { SynthesisBoardHeader, ConsensusSummaryCard, SessionMetrics };
