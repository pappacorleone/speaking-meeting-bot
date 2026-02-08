"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Talk } from "@/types/talk";
import { getStatusLabel } from "@/types/talk";

interface ActiveTalkCardProps {
  talk: Talk;
  className?: string;
}

/**
 * StatusBadge displays the current talk status with appropriate styling.
 */
function StatusBadge({ status }: { status: Talk["status"] }) {
  const isReady = status === "ready";
  const isInProgress = status === "in_progress";
  const isPaused = status === "paused";

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isReady && "bg-status-active",
          isInProgress && "bg-status-active animate-pulse",
          isPaused && "bg-status-warning"
        )}
      />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {status === "ready"
          ? "Ready for Facilitation"
          : status === "in_progress"
            ? "Talk in Progress"
            : getStatusLabel(status)}
      </span>
    </div>
  );
}

/**
 * ParticipantInfo shows the partner name for the talk.
 */
function ParticipantInfo({ participants }: { participants: Talk["participants"] }) {
  // Find the invitee (partner)
  const partner = participants.find((p) => p.role === "invitee");
  const partnerName = partner?.name || "Your Partner";

  return (
    <div className="flex items-center gap-3">
      {/* Avatar placeholder */}
      <div className="h-10 w-10 rounded-full bg-secondary/30 flex items-center justify-center">
        <span className="text-sm font-medium text-secondary-foreground">
          {partnerName.charAt(0).toUpperCase()}
        </span>
      </div>
      <div>
        <span className="text-sm text-muted-foreground">With</span>
        <p className="font-medium">{partnerName}</p>
      </div>
    </div>
  );
}

/**
 * ActiveTalkCard displays a prominent card for active or ready talks.
 * Features:
 * - Status badge (green dot + label)
 * - Talk goal (truncated)
 * - Partner info with avatar
 * - Join/Resume CTA button
 */
export function ActiveTalkCard({
  talk,
  className,
}: ActiveTalkCardProps) {
  const isReady = talk.status === "ready";
  const isInProgress = talk.status === "in_progress";
  const isPaused = talk.status === "paused";

  // Determine CTA text
  const ctaText = isReady
    ? "Join Talk"
    : isInProgress
      ? "Rejoin Talk"
      : isPaused
        ? "Resume Talk"
        : "View Talk";

  // Determine destination
  const talkLink =
    isReady || isInProgress || isPaused
      ? `/talks/${talk.id}/live`
      : `/talks/${talk.id}`;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <StatusBadge status={talk.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Talk title or goal as headline */}
        <h3 className="font-serif text-2xl font-semibold leading-tight">
          {talk.title || talk.goal}
        </h3>

        {/* Goal preview if we have a separate title */}
        {talk.title && talk.goal && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {talk.goal}
          </p>
        )}

        {/* Partner info */}
        <ParticipantInfo participants={talk.participants} />

        {/* Consent status for ready talks */}
        {isReady && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-active" />
            <span>Both participants consented</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href={talkLink}>{ctaText}</Link>
        </Button>
        {!isInProgress && !isPaused && (
          <Button variant="outline" asChild>
            <Link href={`/talks/${talk.id}`}>Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
