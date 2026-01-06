"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Eye, Pause, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConsentFormProps {
  inviterName: string;
  goal: string;
  scheduledAt?: string;
  durationMinutes: number;
  meetingUrl?: string;
  onAccept: (inviteeName: string) => Promise<void>;
  onDecline: () => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

/**
 * ConsentForm handles partner consent for joining a facilitated session.
 * Displays session details and AI consent explanation before accepting.
 */
export function ConsentForm({
  inviterName,
  goal,
  scheduledAt,
  durationMinutes,
  meetingUrl,
  onAccept,
  onDecline,
  isSubmitting = false,
  className,
}: ConsentFormProps) {
  const [inviteeName, setInviteeName] = React.useState("");
  const [error, setError] = React.useState("");

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inviteeName.trim()) {
      setError("Please enter your name to continue");
      return;
    }

    await onAccept(inviteeName.trim());
  };

  const formatSchedule = () => {
    if (!scheduledAt) return null;

    const date = new Date(scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (isToday) {
      return `Today @ ${timeStr} (${durationMinutes}m)`;
    }

    const dateStr = date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return `${dateStr} @ ${timeStr} (${durationMinutes}m)`;
  };

  return (
    <div className={cn("w-full max-w-lg", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Session Details</CardTitle>
          <CardDescription>
            {inviterName} has invited you to a facilitated conversation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Goal Section */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Proposed Aim
            </p>
            <blockquote className="border-l-4 border-secondary pl-4 italic text-foreground font-serif">
              &ldquo;{goal}&rdquo;
            </blockquote>
          </div>

          {/* Schedule & Duration */}
          <div className="flex flex-wrap gap-4 text-sm">
            {scheduledAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{formatSchedule()}</span>
              </div>
            )}
            {!scheduledAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{durationMinutes} minutes</span>
              </div>
            )}
          </div>

          {/* Meeting Link (if external) */}
          {meetingUrl && (
            <div className="text-sm">
              <a
                href={meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Open Meeting Link
              </a>
            </div>
          )}

          {/* AI Consent Information */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4" />
              AI Facilitation Notice
            </p>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Eye className="h-4 w-4 mt-0.5 shrink-0" />
                <span>An AI will observe your conversation</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 shrink-0" />
                <span>BOTH of you see the same information</span>
              </li>
              <li className="flex items-start gap-2">
                <Pause className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Either can pause anytime</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Nothing is stored by default</span>
              </li>
            </ul>
          </div>

          {/* Privacy Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              <Lock className="h-3 w-3" />
              End-to-End Encrypted Session
            </span>
          </div>

          {/* Name Input */}
          <form onSubmit={handleAccept} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invitee-name">Your Name</Label>
              <Input
                id="invitee-name"
                placeholder="Enter your name"
                value={inviteeName}
                onChange={(e) => setInviteeName(e.target.value)}
                disabled={isSubmitting}
                aria-describedby={error ? "name-error" : undefined}
              />
              {error && (
                <p id="name-error" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Processing..." : "Accept"}
              </Button>

              <button
                type="button"
                onClick={onDecline}
                disabled={isSubmitting}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Decline Privately
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
