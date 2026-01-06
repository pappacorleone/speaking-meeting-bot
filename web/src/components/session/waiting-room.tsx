"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Copy, Check, Loader2, ExternalLink } from "lucide-react";

// =============================================================================
// Types
// =============================================================================

export type ReadinessItemStatus = "ready" | "pending" | "initializing";

export interface ReadinessItem {
  id: string;
  label: string;
  status: ReadinessItemStatus;
}

export type PartnerStatus =
  | "waiting"
  | "invited"
  | "joining"
  | "joined"
  | "ready";

export interface WaitingRoomProps {
  /** Partner's name */
  partnerName: string;
  /** Partner's avatar URL (optional) */
  partnerAvatarUrl?: string;
  /** Current partner status */
  partnerStatus: PartnerStatus;
  /** Readiness checklist items */
  readinessItems: ReadinessItem[];
  /** Invite link for copying */
  inviteLink: string;
  /** Meeting URL for external platforms (Zoom/Meet/Teams) */
  meetingUrl?: string;
  /** Session goal for context */
  goal?: string;
  /** Called when user clicks "Start Session" (only when all ready) */
  onStartSession?: () => void;
  /** Whether the start action is loading */
  isStarting?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Helper Components
// =============================================================================

interface ReadinessStatusDotProps {
  status: ReadinessItemStatus;
  size?: "sm" | "md";
}

function ReadinessStatusDot({ status, size = "md" }: ReadinessStatusDotProps) {
  const sizeClasses = size === "sm" ? "h-2 w-2" : "h-3 w-3";

  if (status === "ready") {
    return (
      <span
        className={cn(sizeClasses, "rounded-full bg-green-500")}
        aria-label="Ready"
      />
    );
  }

  if (status === "initializing") {
    return (
      <Loader2
        className={cn(sizeClasses, "animate-spin text-amber-500")}
        aria-label="Initializing"
      />
    );
  }

  // pending
  return (
    <span
      className={cn(sizeClasses, "rounded-full bg-muted-foreground/30")}
      aria-label="Pending"
    />
  );
}

interface PartnerAvatarProps {
  name: string;
  avatarUrl?: string;
  status: PartnerStatus;
  size?: "sm" | "lg";
}

function PartnerAvatar({ name, avatarUrl, status, size = "lg" }: PartnerAvatarProps) {
  const sizeClasses = size === "lg" ? "h-24 w-24" : "h-12 w-12";
  const ringSize = size === "lg" ? "ring-4" : "ring-2";
  const initial = name.charAt(0).toUpperCase();

  // Ring color based on status
  const ringColor =
    status === "ready" || status === "joined"
      ? "ring-green-500"
      : status === "joining"
        ? "ring-amber-500"
        : "ring-muted-foreground/30";

  return (
    <div
      className={cn(
        sizeClasses,
        ringSize,
        ringColor,
        "rounded-full flex items-center justify-center bg-muted relative transition-all"
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="rounded-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "font-serif font-medium text-muted-foreground",
            size === "lg" ? "text-3xl" : "text-lg"
          )}
        >
          {initial}
        </span>
      )}

      {/* Animated pulse for joining status */}
      {status === "joining" && (
        <span
          className={cn(
            "absolute inset-0 rounded-full ring-2 ring-amber-500 animate-ping opacity-50"
          )}
        />
      )}
    </div>
  );
}

function getPartnerStatusLabel(status: PartnerStatus): string {
  const labels: Record<PartnerStatus, string> = {
    waiting: "Waiting",
    invited: "Invited",
    joining: "Joining...",
    joined: "Joined",
    ready: "Ready",
  };
  return labels[status];
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * WaitingRoom displays the pre-session state while waiting for:
 * - Partner to accept invitation and join
 * - System readiness checks (mic, agent, etc.)
 *
 * Has mobile-first design with responsive desktop layout.
 */
export function WaitingRoom({
  partnerName,
  partnerAvatarUrl,
  partnerStatus,
  readinessItems,
  inviteLink,
  meetingUrl,
  goal,
  onStartSession,
  isStarting = false,
  className,
}: WaitingRoomProps) {
  const [copied, setCopied] = React.useState(false);

  // Derived states
  const allReady = readinessItems.every((item) => item.status === "ready");
  const partnerReady = partnerStatus === "ready" || partnerStatus === "joined";
  const canStart = allReady && partnerReady;

  // Copy invite link handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite link:", err);
    }
  };

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col items-center text-center space-y-6 px-4">
        {/* Partner Avatar */}
        <PartnerAvatar
          name={partnerName}
          avatarUrl={partnerAvatarUrl}
          status={partnerStatus}
          size="lg"
        />

        {/* Headline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-medium">
            {partnerReady ? "You are Ready." : `Waiting for ${partnerName}...`}
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            {partnerReady ? "READY TO BEGIN" : "INITIALIZING FACILITATOR"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">Agent Pre-Check</span>
            <span>
              {readinessItems.filter((i) => i.status === "ready").length}/
              {readinessItems.length}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary transition-all duration-500"
              style={{
                width: `${(readinessItems.filter((i) => i.status === "ready").length / readinessItems.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Status Message */}
        <p className="text-sm text-muted-foreground italic">
          Preparing a neutral space for alignment.
        </p>

        {/* Copy Invite Link */}
        {!partnerReady && (
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2"
            aria-label={copied ? "Link copied" : "Copy invite link"}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Invite Link
              </>
            )}
          </Button>
        )}

        {/* Meeting Link (external platforms) */}
        {meetingUrl && (
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" />
            Open Meeting
          </a>
        )}

        {/* Start Button */}
        {canStart && onStartSession && (
          <Button
            variant="secondary"
            size="lg"
            onClick={onStartSession}
            disabled={isStarting}
            className="w-full"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              "Start Session"
            )}
          </Button>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif">
              {partnerReady ? "You are Ready." : `Waiting for ${partnerName}...`}
            </CardTitle>
            <CardDescription className="text-base">
              {partnerReady
                ? "Both participants are ready. You can start the facilitated session."
                : "We are just making sure the partner connection is stable before we begin the facilitated session."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left: Readiness Checklist */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  System Readiness
                </h3>
                <ul className="space-y-3">
                  {readinessItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      <ReadinessStatusDot status={item.status} />
                      <span
                        className={cn(
                          item.status === "ready"
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.label}:{" "}
                        <span className="capitalize">
                          {item.status === "ready"
                            ? "Active"
                            : item.status === "initializing"
                              ? "Initializing"
                              : "Pending"}
                        </span>
                      </span>
                    </li>
                  ))}
                  {/* Partner Status as last item */}
                  <li className="flex items-center gap-3 text-sm">
                    <ReadinessStatusDot
                      status={partnerReady ? "ready" : "pending"}
                    />
                    <span
                      className={cn(
                        partnerReady
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      Partner: {getPartnerStatusLabel(partnerStatus)}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Right: Partner Preview Card */}
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-muted/50">
                <PartnerAvatar
                  name={partnerName}
                  avatarUrl={partnerAvatarUrl}
                  status={partnerStatus}
                  size="lg"
                />
                <p className="mt-4 font-medium">{partnerName}</p>
                <span
                  className={cn(
                    "mt-1 text-xs uppercase tracking-wider px-2 py-0.5 rounded-full",
                    partnerReady
                      ? "bg-green-500/10 text-green-600"
                      : partnerStatus === "joining"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-muted-foreground/10 text-muted-foreground"
                  )}
                >
                  {getPartnerStatusLabel(partnerStatus)}
                </span>
              </div>
            </div>

            {/* Goal Context (if provided) */}
            {goal && (
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Session Goal
                </p>
                <p className="text-sm text-foreground line-clamp-2">{goal}</p>
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
              {/* Copy Invite Link */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2"
                disabled={partnerReady}
                aria-label={copied ? "Link copied" : "Copy invite link"}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Invite Link
                  </>
                )}
              </Button>

              {/* Meeting Link (external platforms) */}
              {meetingUrl && (
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Meeting
                </a>
              )}

              {/* Start Session Button */}
              {onStartSession && (
                <Button
                  variant="secondary"
                  onClick={onStartSession}
                  disabled={!canStart || isStarting}
                  className="ml-auto"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start Session"
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================================================
// Default Readiness Items Factory
// =============================================================================

/**
 * Creates default readiness items for a waiting room.
 * Use this to initialize the readinessItems prop.
 */
export function createDefaultReadinessItems(): ReadinessItem[] {
  return [
    { id: "mic", label: "Mic", status: "pending" },
    { id: "agent", label: "Agent", status: "pending" },
  ];
}
