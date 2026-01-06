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
import type { Session } from "@/types/session";
import { getStatusLabel } from "@/types/session";

interface ActiveSessionCardProps {
  session: Session;
  className?: string;
}

/**
 * StatusBadge displays the current session status with appropriate styling.
 */
function StatusBadge({ status }: { status: Session["status"] }) {
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
            ? "Session in Progress"
            : getStatusLabel(status)}
      </span>
    </div>
  );
}

/**
 * ParticipantInfo shows the partner name for the session.
 */
function ParticipantInfo({ participants }: { participants: Session["participants"] }) {
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
 * ActiveSessionCard displays a prominent card for active or ready sessions.
 * Features:
 * - Status badge (green dot + label)
 * - Session goal (truncated)
 * - Partner info with avatar
 * - Join/Resume CTA button
 */
export function ActiveSessionCard({
  session,
  className,
}: ActiveSessionCardProps) {
  const isReady = session.status === "ready";
  const isInProgress = session.status === "in_progress";
  const isPaused = session.status === "paused";

  // Determine CTA text
  const ctaText = isReady
    ? "Join Session"
    : isInProgress
      ? "Rejoin Session"
      : isPaused
        ? "Resume Session"
        : "View Session";

  // Determine destination
  const sessionLink =
    isReady || isInProgress || isPaused
      ? `/sessions/${session.id}/live`
      : `/sessions/${session.id}`;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <StatusBadge status={session.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session title or goal as headline */}
        <h3 className="font-serif text-2xl font-semibold leading-tight">
          {session.title || session.goal}
        </h3>

        {/* Goal preview if we have a separate title */}
        {session.title && session.goal && (
          <p className="text-muted-foreground text-sm line-clamp-2">
            {session.goal}
          </p>
        )}

        {/* Partner info */}
        <ParticipantInfo participants={session.participants} />

        {/* Consent status for ready sessions */}
        {isReady && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-status-active" />
            <span>Both participants consented</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-3">
        <Button asChild className="flex-1">
          <Link href={sessionLink}>{ctaText}</Link>
        </Button>
        {!isInProgress && !isPaused && (
          <Button variant="outline" asChild>
            <Link href={`/sessions/${session.id}`}>Details</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
