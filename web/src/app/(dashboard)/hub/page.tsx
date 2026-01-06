"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ActiveSessionCard, RecentSessionsList, SearchBar } from "@/components/hub";
import { EmptyState } from "@/components/common";
import { listSessions } from "@/lib/api/sessions";
import type { Session as ApiSession } from "@/lib/api/types";
import type { Session, SessionStatus } from "@/types/session";

/**
 * Transform API session (snake_case) to frontend session (camelCase)
 */
function transformSession(apiSession: ApiSession): Session {
  return {
    id: apiSession.session_id,
    title: apiSession.title,
    goal: apiSession.goal,
    relationshipContext: apiSession.relationship_context,
    platform: apiSession.platform as Session["platform"],
    meetingUrl: apiSession.meeting_url,
    durationMinutes: apiSession.duration_minutes,
    scheduledAt: apiSession.scheduled_at,
    status: apiSession.status as SessionStatus,
    participants: apiSession.participants.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role as "creator" | "invitee",
      consented: p.consented,
    })),
    facilitator: {
      persona: apiSession.facilitator.persona as Session["facilitator"]["persona"],
      interruptAuthority: apiSession.facilitator.interrupt_authority,
      directInquiry: apiSession.facilitator.direct_inquiry,
      silenceDetection: apiSession.facilitator.silence_detection,
    },
    createdAt: apiSession.created_at,
    inviteToken: apiSession.invite_token,
    botId: apiSession.bot_id,
    clientId: apiSession.client_id,
  };
}

/**
 * HubPage is the main dashboard for Diadi.
 * Displays:
 * - Search bar
 * - Active session card (if any ready/in_progress session exists)
 * - Recent sessions list
 */
export default function HubPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch sessions from API
  // Note: In production, apiKey would come from auth context
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await listSessions({}, apiKey);
      return response.sessions.map(transformSession);
    },
    // Don't fail if API is not available during development
    retry: false,
  });

  const sessions = data || [];

  // Find active sessions (ready, in_progress, or paused)
  const activeSessions = sessions.filter(
    (s) =>
      s.status === "ready" ||
      s.status === "in_progress" ||
      s.status === "paused"
  );

  // Get the most important active session (prioritize in_progress, then paused, then ready)
  const primaryActiveSession = activeSessions.find(
    (s) => s.status === "in_progress"
  ) ||
    activeSessions.find((s) => s.status === "paused") ||
    activeSessions.find((s) => s.status === "ready");

  // Recent sessions (excluding the primary active one)
  const recentSessions = sessions.filter(
    (s) => s.id !== primaryActiveSession?.id
  );

  // Filter sessions based on search query
  const filteredRecentSessions = searchQuery
    ? recentSessions.filter(
        (s) =>
          s.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.participants.some((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : recentSessions;

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded-lg w-full max-w-md" />
            <div className="h-48 bg-muted rounded-card" />
            <div className="space-y-3">
              <div className="h-6 bg-muted rounded w-32" />
              <div className="h-20 bg-muted rounded-card" />
              <div className="h-20 bg-muted rounded-card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <HubHeader />
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
            title="Unable to load sessions"
            description="There was a problem connecting to the server. Please try again."
            action={{
              label: "Retry",
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </div>
    );
  }

  // Empty state - no sessions at all
  if (sessions.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <HubHeader />
          <div className="mt-16">
            <EmptyState
              icon={
                <svg
                  className="h-16 w-16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              }
              title="Welcome to Diadi"
              description="Start your first facilitated conversation. Diadi helps you have the conversations you've been avoiding."
              action={{
                label: "Start Your First Session",
                href: "/sessions/new",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with title and search */}
        <HubHeader />

        {/* Desktop search bar */}
        <div className="hidden md:block mt-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-md"
          />
        </div>

        {/* Mobile search icon - simplified for mobile */}
        <div className="md:hidden mt-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
          />
        </div>

        {/* Active session card */}
        {primaryActiveSession && (
          <div className="mt-8">
            <h2 className="section-header mb-4">Active Session</h2>
            <ActiveSessionCard session={primaryActiveSession} />
          </div>
        )}

        {/* Recent sessions */}
        <div className="mt-8">
          <RecentSessionsList
            sessions={filteredRecentSessions}
            limit={5}
            showViewAll={true}
          />
        </div>

        {/* Quick action - visible when no active session */}
        {!primaryActiveSession && sessions.length > 0 && (
          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <Link href="/sessions/new">Start New Session</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * HubHeader displays the page title and tagline.
 */
function HubHeader() {
  return (
    <div>
      <h1 className="font-serif text-3xl md:text-4xl font-semibold">
        The Hub.
      </h1>
      <p className="text-muted-foreground mt-1">
        Your space for meaningful conversations.
      </p>
    </div>
  );
}
