"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ActiveTalkCard, RecentTalksList, SearchBar } from "@/components/hub";
import { EmptyState } from "@/components/common";
import { InlineErrorFallback } from "@/components/error";
import { listTalks, parseError, shouldRetryQuery } from "@/lib/api";
import type { Talk as ApiTalk } from "@/lib/api/types";
import type { Talk, TalkStatus } from "@/types/talk";

/**
 * Transform API talk (snake_case) to frontend talk (camelCase)
 */
function transformTalk(apiTalk: ApiTalk): Talk {
  return {
    id: apiTalk.id,
    title: apiTalk.title,
    goal: apiTalk.goal,
    relationshipContext: apiTalk.relationship_context,
    platform: apiTalk.platform as Talk["platform"],
    meetingUrl: apiTalk.meeting_url,
    durationMinutes: apiTalk.duration_minutes,
    scheduledAt: apiTalk.scheduled_at,
    status: apiTalk.status as TalkStatus,
    participants: apiTalk.participants.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role as "creator" | "invitee",
      consented: p.consented,
    })),
    facilitator: {
      persona: apiTalk.facilitator.persona as Talk["facilitator"]["persona"],
      interruptAuthority: apiTalk.facilitator.interrupt_authority,
      directInquiry: apiTalk.facilitator.direct_inquiry,
      silenceDetection: apiTalk.facilitator.silence_detection,
    },
    createdAt: apiTalk.created_at,
    inviteToken: apiTalk.invite_token,
    botId: apiTalk.bot_id,
    clientId: apiTalk.client_id,
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

  // Fetch talks from API
  // Note: In production, apiKey would come from auth context
  const apiKey =
    process.env.NEXT_PUBLIC_MEETING_BAAS_API_KEY ||
    process.env.NEXT_PUBLIC_API_KEY ||
    "";

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["talks"],
    queryFn: async () => {
      const response = await listTalks({}, apiKey);
      return response.talks.map(transformTalk);
    },
    // Use smart retry logic based on error type
    retry: (failureCount, err) => shouldRetryQuery(failureCount, err, 2),
  });

  const talks = data || [];

  // Find active talks (ready, in_progress, or paused)
  const activeTalks = talks.filter(
    (s) =>
      s.status === "ready" ||
      s.status === "in_progress" ||
      s.status === "paused"
  );

  // Get the most important active talk (prioritize in_progress, then paused, then ready)
  const primaryActiveTalk = activeTalks.find(
    (s) => s.status === "in_progress"
  ) ||
    activeTalks.find((s) => s.status === "paused") ||
    activeTalks.find((s) => s.status === "ready");

  // Recent talks (excluding the primary active one)
  const recentTalks = talks.filter(
    (s) => s.id !== primaryActiveTalk?.id
  );

  // Filter talks based on search query
  const filteredRecentTalks = searchQuery
    ? recentTalks.filter(
        (s) =>
          s.goal.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.participants.some((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : recentTalks;

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

  // Error state - use parsed error for better messages
  if (error) {
    const parsedError = parseError(error);
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <HubHeader />
          <div className="mt-8">
            <InlineErrorFallback
              title="Unable to load talks"
              message={parsedError.message}
              error={error instanceof Error ? error : null}
              onRetry={parsedError.isRecoverable ? () => refetch() : undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no talks at all
  if (talks.length === 0) {
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
                label: "Start Your First Talk",
                href: "/talks/new",
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

        {/* Active talk card */}
        {primaryActiveTalk && (
          <div className="mt-8">
            <h2 className="section-header mb-4">Active Talk</h2>
            <ActiveTalkCard talk={primaryActiveTalk} />
          </div>
        )}

        {/* Recent talks */}
        <div className="mt-8">
          <RecentTalksList
            talks={filteredRecentTalks}
            limit={5}
            showViewAll={true}
          />
        </div>

        {/* Quick action - visible when no active talk */}
        {!primaryActiveTalk && talks.length > 0 && (
          <div className="mt-8 text-center">
            <Button asChild size="lg">
              <Link href="/talks/new">Start New Talk</Link>
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
