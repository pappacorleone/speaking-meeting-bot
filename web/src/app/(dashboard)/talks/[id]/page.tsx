/**
 * Talk Detail Page
 *
 * Unified talk detail view that shows different content based on status:
 * - draft/pending_consent/ready: Waiting room view
 * - in_progress/paused: Redirect to live talk
 * - ended: Post-talk summary with full recap UI
 * - archived: Archived talk view
 */

'use client';

import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTalk, startTalk, getTalkSummary } from '@/lib/api/talks';
import { WaitingRoom, type ReadinessItem } from '@/components/talk/waiting-room';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Talk as ApiTalk, TalkSummary as ApiTalkSummary } from '@/lib/api/types';
import type { Talk, TalkStatus, TalkSummary } from '@/types/talk';
import type { TalkRating } from '@/components/recap';

// Lazy load recap components - only needed for ended sessions
const SynthesisBoard = lazy(() => import('@/components/recap/synthesis-board').then(m => ({ default: m.SynthesisBoard })));
const SynthesisBoardSkeleton = lazy(() => import('@/components/recap/synthesis-board').then(m => ({ default: m.SynthesisBoardSkeleton })));
const KeyAgreements = lazy(() => import('@/components/recap/key-agreements').then(m => ({ default: m.KeyAgreements })));
const KeyAgreementsSkeleton = lazy(() => import('@/components/recap/key-agreements').then(m => ({ default: m.KeyAgreementsSkeleton })));
const ActionItems = lazy(() => import('@/components/recap/action-items').then(m => ({ default: m.ActionItems })));
const ActionItemsSkeleton = lazy(() => import('@/components/recap/action-items').then(m => ({ default: m.ActionItemsSkeleton })));
const RatingPrompt = lazy(() => import('@/components/recap/rating-prompt').then(m => ({ default: m.RatingPrompt })));
const RatingPromptSkeleton = lazy(() => import('@/components/recap/rating-prompt').then(m => ({ default: m.RatingPromptSkeleton })));

// =============================================================================
// Constants
// =============================================================================

const API_KEY =
  process.env.NEXT_PUBLIC_MEETING_BAAS_API_KEY ||
  process.env.NEXT_PUBLIC_API_KEY ||
  "dev-key";

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Transform API talk (snake_case) to frontend talk (camelCase)
 */
function transformTalk(apiTalk: ApiTalk): Talk {
  return {
    id: apiTalk.id,
    title: apiTalk.title,
    goal: apiTalk.goal,
    relationshipContext: apiTalk.relationship_context,
    platform: apiTalk.platform,
    meetingUrl: apiTalk.meeting_url,
    durationMinutes: apiTalk.duration_minutes,
    scheduledAt: apiTalk.scheduled_at,
    status: apiTalk.status,
    participants: apiTalk.participants.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      consented: p.consented,
    })),
    facilitator: {
      persona: apiTalk.facilitator.persona,
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
 * Transform API talk summary (snake_case) to frontend summary (camelCase)
 */
function transformSummary(apiSummary: ApiTalkSummary): TalkSummary {
  return {
    talkId: apiSummary.talk_id,
    durationMinutes: apiSummary.duration_minutes,
    consensusSummary: apiSummary.consensus_summary,
    actionItems: apiSummary.action_items,
    balance: {
      participantA: {
        id: apiSummary.balance.participant_a.id,
        name: apiSummary.balance.participant_a.name,
        percentage: apiSummary.balance.participant_a.percentage,
      },
      participantB: {
        id: apiSummary.balance.participant_b.id,
        name: apiSummary.balance.participant_b.name,
        percentage: apiSummary.balance.participant_b.percentage,
      },
      status: apiSummary.balance.status,
    },
    interventionCount: apiSummary.intervention_count,
    keyAgreements: apiSummary.key_agreements,
  };
}

/**
 * Get partner info from participants
 */
function getPartnerInfo(participants: Talk['participants']) {
  const invitee = participants.find((p) => p.role === 'invitee');
  return {
    name: invitee?.name || 'Partner',
    hasConsented: invitee?.consented || false,
  };
}

/**
 * Get invite link from talk
 */
function getInviteLink(inviteToken: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/${inviteToken}`;
  }
  return `/invite/${inviteToken}`;
}

/**
 * Create default readiness items based on talk state
 */
function createReadinessItems(
  partnerHasConsented: boolean,
  talkStatus: TalkStatus
): ReadinessItem[] {
  const isReady = talkStatus === 'ready';

  return [
    {
      id: 'mic',
      label: 'Mic',
      status: 'ready', // Assume mic is always ready for now
    },
    {
      id: 'agent',
      label: 'Agent',
      status: isReady ? 'ready' : 'initializing',
    },
    {
      id: 'partner',
      label: 'Partner',
      status: partnerHasConsented ? 'ready' : 'pending',
    },
  ];
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Loading skeleton
 */
function TalkDetailSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-48 bg-muted rounded-card" />
      <div className="h-32 bg-muted rounded-card" />
    </div>
  );
}

/**
 * Error state
 */
function TalkDetailError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mb-4">
        <ErrorIcon className="w-8 h-8 text-status-error" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Error Loading Talk</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">{message}</p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

/**
 * Pre-talk view (waiting for partner or talk to start)
 */
function PreTalkView({
  talk,
  onStartTalk,
  isStarting,
  startError,
}: {
  talk: Talk;
  onStartTalk: () => void;
  isStarting: boolean;
  startError: string | null;
}) {
  const partner = getPartnerInfo(talk.participants);
  const inviteLink = getInviteLink(talk.inviteToken);

  // Determine partner status for waiting room
  const partnerStatus: 'waiting' | 'joining' | 'ready' | 'joined' =
    !partner.hasConsented ? 'waiting' : talk.status === 'ready' ? 'joined' : 'joining';

  // Check if all conditions are met to start
  const canStart = talk.status === 'ready';

  // Create readiness items
  const readinessItems = createReadinessItems(partner.hasConsented, talk.status);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-serif mb-1">Talk Setup</h1>
      <p className="text-muted-foreground mb-6">
        {talk.status === 'ready'
          ? 'Ready to begin facilitation'
          : 'Waiting for your partner to join'}
      </p>

      {startError && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <strong>Error:</strong> {startError}
        </div>
      )}

      <WaitingRoom
        partnerName={partner.name}
        partnerStatus={partnerStatus}
        readinessItems={readinessItems}
        inviteLink={inviteLink}
        meetingUrl={talk.meetingUrl}
        goal={talk.goal}
        onStartSession={canStart ? onStartTalk : undefined}
        isStarting={isStarting}
      />
    </div>
  );
}

/**
 * Post-talk summary view with full recap UI
 */
function PostTalkView({
  talk,
  summary,
  summaryLoading,
  summaryError,
  onRetryLoadSummary,
}: {
  talk: Talk;
  summary: TalkSummary | null;
  summaryLoading: boolean;
  summaryError: Error | null;
  onRetryLoadSummary: () => void;
}) {
  const router = useRouter();
  const partner = getPartnerInfo(talk.participants);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Format the ended date - use createdAt as proxy since we don't track ended_at
  const endedAt = talk.createdAt;

  // Handle rating submission
  const handleRatingSubmit = useCallback(async (rating: TalkRating) => {
    setIsRatingSubmitting(true);
    try {
      // TODO: Implement rating submission API endpoint
      console.log('Rating submitted:', rating);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRatingSubmitted(true);
    } finally {
      setIsRatingSubmitting(false);
    }
  }, []);

  const handleSkipRating = useCallback(() => {
    setRatingSubmitted(true);
  }, []);

  // Handle share and download actions
  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Talk Recap - ${talk.title || partner.name}`,
        text: summary?.consensusSummary || 'Talk completed',
        url: window.location.href,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [talk.title, partner.name, summary?.consensusSummary]);

  const handleDownload = useCallback(() => {
    // TODO: Implement PDF download functionality
    console.log('Download PDF clicked');
  }, []);

  // Loading skeleton for lazy-loaded recap components
  const RecapSkeleton = () => (
    <div className="p-4 space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-48 bg-muted rounded-card" />
      <div className="h-32 bg-muted rounded-card" />
      <div className="h-24 bg-muted rounded-card" />
      <div className="h-32 bg-muted rounded-card" />
    </div>
  );

  // Loading state for summary
  if (summaryLoading) {
    return (
      <Suspense fallback={<RecapSkeleton />}>
        <div className="p-4 space-y-6 max-w-4xl mx-auto">
          <SynthesisBoardSkeleton />
          <KeyAgreementsSkeleton />
          <ActionItemsSkeleton />
          <RatingPromptSkeleton />
        </div>
      </Suspense>
    );
  }

  // Error state for summary
  if (summaryError && !summary) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-serif mb-1">Talk Complete</h1>
        <p className="text-muted-foreground mb-6">
          Your talk with {partner.name} has ended.
        </p>

        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-4">
              <ErrorIcon className="w-8 h-8 text-status-error" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Couldn&apos;t load summary</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              {summaryError.message || 'Failed to load talk summary'}
            </p>
            <Button onClick={onRetryLoadSummary} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/hub')}
        >
          Return to Hub
        </Button>
      </div>
    );
  }

  // No summary available yet (fallback view)
  if (!summary) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-serif mb-1">Talk Complete</h1>
        <p className="text-muted-foreground mb-6">
          Your talk with {partner.name} has ended.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Talk Summary</CardTitle>
            <CardDescription>
              Duration: {talk.durationMinutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Goal</h3>
              <p className="text-sm text-muted-foreground italic">&ldquo;{talk.goal}&rdquo;</p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
              Summary is being generated...
            </div>
          </CardContent>
        </Card>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/hub')}
        >
          Return to Hub
        </Button>
      </div>
    );
  }

  // Full recap view with summary - wrap in Suspense for lazy-loaded components
  return (
    <Suspense fallback={<RecapSkeleton />}>
      <div className="p-4 space-y-6 max-w-4xl mx-auto pb-8">
        {/* Synthesis Board - Main summary section */}
        <SynthesisBoard
          summary={summary}
          sessionTitle={talk.title || `Talk with ${partner.name}`}
          endedAt={endedAt}
          onBack={() => router.push('/hub')}
          onShare={handleShare}
          onDownload={handleDownload}
        />

        {/* Key Agreements Section */}
        <KeyAgreements agreements={summary.keyAgreements} />

        {/* Action Items Section */}
        <Card>
          <CardContent className="pt-6">
            <ActionItems items={summary.actionItems} />
          </CardContent>
        </Card>

        {/* Rating Prompt - only show if not submitted */}
        {!ratingSubmitted && (
          <RatingPrompt
            talkId={talk.id}
            onSubmit={handleRatingSubmit}
            onSkip={handleSkipRating}
            isSubmitting={isRatingSubmitting}
          />
        )}

        {/* Return to Hub button */}
        <div className="pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/hub')}
          >
            Return to Hub
          </Button>
        </div>
      </div>
    </Suspense>
  );
}

/**
 * Archived talk view
 */
function ArchivedTalkView() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <ArchiveIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Talk Archived</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">
        This talk has been archived and is no longer accessible.
      </p>
      <Button onClick={() => router.push('/hub')} variant="outline">
        Return to Hub
      </Button>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 8v13H3V8M1 3h22v5H1V3zm9 9h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function TalkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const talkId = params.id as string;
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Fetch talk data
  const {
    data: apiTalk,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['talk', talkId],
    queryFn: () => getTalk(talkId, API_KEY),
    enabled: !!talkId,
    // Only poll while talk is in a non-terminal state
    // Stop polling once ended/archived to prevent flickering
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'ended' || status === 'archived') {
        return false; // Stop polling
      }
      return 5000; // Continue polling every 5 seconds
    },
  });

  const talk = apiTalk ? transformTalk(apiTalk) : null;

  // Fetch talk summary (only when talk is ended)
  const {
    data: apiSummary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['talk-summary', talkId],
    queryFn: () => getTalkSummary(talkId, API_KEY),
    enabled: !!talkId && talk?.status === 'ended',
    retry: 3,
    retryDelay: 1000,
  });

  const summary = apiSummary ? transformSummary(apiSummary) : null;

  // Redirect to live view if talk is active
  useEffect(() => {
    console.log('[TalkDetail] Talk status:', talk?.status);
    if (talk?.status === 'in_progress' || talk?.status === 'paused') {
      console.log('[TalkDetail] Redirecting to live view...');
      router.push(`/talks/${talkId}/live`);
    }
  }, [talk?.status, talkId, router]);

  // Start talk handler
  const handleStartTalk = async () => {
    console.log('[TalkDetail] handleStartTalk called, talk:', talk?.status);
    if (!talk) return;

    setIsStarting(true);
    setStartError(null);
    try {
      console.log('[TalkDetail] Calling startTalk API...');
      const result = await startTalk(
        talkId,
        { meeting_url: talk.meetingUrl || undefined },
        API_KEY
      );
      console.log('[TalkDetail] startTalk result:', result);
      // Redirect to live view
      router.push(`/talks/${talkId}/live`);
    } catch (err) {
      console.error('[TalkDetail] Failed to start talk:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start talk';
      setStartError(errorMessage);
      setIsStarting(false);
    }
  };

  // Retry loading summary handler
  const handleRetryLoadSummary = useCallback(() => {
    refetchSummary();
  }, [refetchSummary]);

  // Loading state
  if (isLoading) {
    return <TalkDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <TalkDetailError
        message={error instanceof Error ? error.message : 'Failed to load talk'}
        onRetry={() => refetch()}
      />
    );
  }

  // Talk not found
  if (!talk) {
    return (
      <TalkDetailError
        message="Talk not found"
        onRetry={() => refetch()}
      />
    );
  }

  // Render based on talk status
  const statusViews: Record<TalkStatus, JSX.Element> = {
    draft: <PreTalkView talk={talk} onStartTalk={handleStartTalk} isStarting={isStarting} startError={startError} />,
    pending_consent: <PreTalkView talk={talk} onStartTalk={handleStartTalk} isStarting={isStarting} startError={startError} />,
    ready: <PreTalkView talk={talk} onStartTalk={handleStartTalk} isStarting={isStarting} startError={startError} />,
    in_progress: <TalkDetailSkeleton />, // Will redirect via useEffect
    paused: <TalkDetailSkeleton />, // Will redirect via useEffect
    ended: (
      <PostTalkView
        talk={talk}
        summary={summary}
        summaryLoading={summaryLoading}
        summaryError={summaryError instanceof Error ? summaryError : summaryError ? new Error('Failed to load summary') : null}
        onRetryLoadSummary={handleRetryLoadSummary}
      />
    ),
    archived: <ArchivedTalkView />,
  };

  return statusViews[talk.status];
}
