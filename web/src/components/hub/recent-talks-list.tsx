"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import type { Talk, TalkStatus } from "@/types/talk";
import { getStatusLabel, getTalkStatusGroup } from "@/types/talk";

interface RecentTalksListProps {
  talks: Talk[];
  className?: string;
  /** Maximum number of talks to show */
  limit?: number;
  /** Show "View All" link */
  showViewAll?: boolean;
}

/**
 * TalkStatusIcon renders an icon based on talk status.
 */
function TalkStatusIcon({ status }: { status: TalkStatus }) {
  // Simple icon representation using emoji/characters
  // Could be replaced with proper icon library
  const icons: Record<TalkStatus, string> = {
    draft: "📝",
    pending_consent: "⏳",
    ready: "✓",
    in_progress: "▶",
    paused: "⏸",
    ended: "✓",
    archived: "📁",
  };

  const statusGroup = getTalkStatusGroup(status);
  const bgColors: Record<string, string> = {
    active: "bg-status-active/10 text-status-active",
    upcoming: "bg-status-info/10 text-status-info",
    past: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "h-10 w-10 rounded-lg flex items-center justify-center text-lg",
        bgColors[statusGroup]
      )}
    >
      {icons[status]}
    </div>
  );
}

/**
 * TalkListItem displays a single talk in the recent talks list.
 */
function TalkListItem({ talk }: { talk: Talk }) {
  // Find partner name
  const partner = talk.participants.find((p) => p.role === "invitee");
  const partnerName = partner?.name || "Partner";

  // Format date
  const date = talk.scheduledAt
    ? new Date(talk.scheduledAt)
    : new Date(talk.createdAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  return (
    <Link
      href={`/talks/${talk.id}`}
      className="block group"
    >
      <Card className="p-4 transition-shadow hover:shadow-elevated">
        <div className="flex items-start gap-3">
          <TalkStatusIcon status={talk.status} />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate group-hover:text-primary">
              {talk.title || talk.goal}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{partnerName}</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full whitespace-nowrap",
              talk.status === "ended" && "bg-muted text-muted-foreground",
              talk.status === "ready" && "bg-status-active/10 text-status-active",
              talk.status === "pending_consent" && "bg-status-warning/10 text-status-warning",
              talk.status === "draft" && "bg-status-info/10 text-status-info"
            )}
          >
            {getStatusLabel(talk.status)}
          </span>
        </div>
      </Card>
    </Link>
  );
}

/**
 * RecentTalksList displays a list of recent talks with status indicators.
 * Shows an empty state when no talks exist.
 */
export function RecentTalksList({
  talks,
  className,
  limit = 5,
  showViewAll = true,
}: RecentTalksListProps) {
  const displayedTalks = talks.slice(0, limit);
  const hasMore = talks.length > limit;

  if (talks.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          }
          title="No talks yet"
          description="Start your first facilitated conversation by creating a new talk."
          action={{
            label: "New Talk",
            href: "/talks/new",
          }}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header">Recent Talks</h2>
        {showViewAll && hasMore && (
          <Link
            href="/talks"
            className="text-xs font-medium uppercase tracking-wider text-primary hover:underline"
          >
            View All
          </Link>
        )}
      </div>

      {/* Talks list */}
      <div className="space-y-3">
        {displayedTalks.map((talk) => (
          <TalkListItem key={talk.id} talk={talk} />
        ))}
      </div>
    </div>
  );
}
