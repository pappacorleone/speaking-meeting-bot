/**
 * Session Detail Page
 *
 * Unified session detail view that shows different content based on status:
 * - draft/pending_consent/ready: Waiting room view
 * - in_progress/paused: Redirect to live session
 * - ended: Post-session summary with full recap UI
 * - archived: Archived session view
 */

'use client';

import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getSession, startSession, getSessionSummary } from '@/lib/api/sessions';
import { WaitingRoom, type ReadinessItem } from '@/components/session/waiting-room';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Session as ApiSession, SessionSummary as ApiSessionSummary } from '@/lib/api/types';
import type { Session, SessionStatus, SessionSummary } from '@/types/session';
import type { SessionRating } from '@/components/recap';

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

const API_KEY = process.env.NEXT_PUBLIC_MEETING_BAAS_API_KEY || 'dev-key';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Transform API session (snake_case) to frontend session (camelCase)
 */
function transformSession(apiSession: ApiSession): Session {
  return {
    id: apiSession.session_id,
    title: apiSession.title,
    goal: apiSession.goal,
    relationshipContext: apiSession.relationship_context,
    platform: apiSession.platform,
    meetingUrl: apiSession.meeting_url,
    durationMinutes: apiSession.duration_minutes,
    scheduledAt: apiSession.scheduled_at,
    status: apiSession.status,
    participants: apiSession.participants.map((p) => ({
      id: p.id,
      name: p.name,
      role: p.role,
      consented: p.consented,
    })),
    facilitator: {
      persona: apiSession.facilitator.persona,
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
 * Transform API session summary (snake_case) to frontend summary (camelCase)
 */
function transformSummary(apiSummary: ApiSessionSummary): SessionSummary {
  return {
    sessionId: apiSummary.session_id,
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
function getPartnerInfo(participants: Session['participants']) {
  const invitee = participants.find((p) => p.role === 'invitee');
  return {
    name: invitee?.name || 'Partner',
    hasConsented: invitee?.consented || false,
  };
}

/**
 * Get invite link from session
 */
function getInviteLink(inviteToken: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/invite/${inviteToken}`;
  }
  return `/invite/${inviteToken}`;
}

/**
 * Create default readiness items based on session state
 */
function createReadinessItems(
  partnerHasConsented: boolean,
  sessionStatus: SessionStatus
): ReadinessItem[] {
  const isReady = sessionStatus === 'ready';

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
function SessionDetailSkeleton() {
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
function SessionDetailError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mb-4">
        <ErrorIcon className="w-8 h-8 text-status-error" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Error Loading Session</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">{message}</p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

/**
 * Pre-session view (waiting for partner or session to start)
 */
function PreSessionView({
  session,
  onStartSession,
  isStarting,
}: {
  session: Session;
  onStartSession: () => void;
  isStarting: boolean;
}) {
  const partner = getPartnerInfo(session.participants);
  const inviteLink = getInviteLink(session.inviteToken);

  // Determine partner status for waiting room
  const partnerStatus: 'waiting' | 'joining' | 'ready' | 'joined' =
    !partner.hasConsented ? 'waiting' : session.status === 'ready' ? 'joined' : 'joining';

  // Check if all conditions are met to start
  const canStart = session.status === 'ready';

  // Create readiness items
  const readinessItems = createReadinessItems(partner.hasConsented, session.status);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-serif mb-1">Session Setup</h1>
      <p className="text-muted-foreground mb-6">
        {session.status === 'ready'
          ? 'Ready to begin facilitation'
          : 'Waiting for your partner to join'}
      </p>

      <WaitingRoom
        partnerName={partner.name}
        partnerStatus={partnerStatus}
        readinessItems={readinessItems}
        inviteLink={inviteLink}
        meetingUrl={session.meetingUrl}
        goal={session.goal}
        onStartSession={canStart ? onStartSession : undefined}
        isStarting={isStarting}
      />
    </div>
  );
}

/**
 * Post-session summary view with full recap UI
 */
function PostSessionView({
  session,
  summary,
  summaryLoading,
  summaryError,
  onRetryLoadSummary,
}: {
  session: Session;
  summary: SessionSummary | null;
  summaryLoading: boolean;
  summaryError: Error | null;
  onRetryLoadSummary: () => void;
}) {
  const router = useRouter();
  const partner = getPartnerInfo(session.participants);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Format the ended date - use createdAt as proxy since we don't track ended_at
  const endedAt = session.createdAt;

  // Handle rating submission
  const handleRatingSubmit = useCallback(async (rating: SessionRating) => {
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
        title: `Session Recap - ${session.title || partner.name}`,
        text: summary?.consensusSummary || 'Session completed',
        url: window.location.href,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [session.title, partner.name, summary?.consensusSummary]);

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
        <h1 className="text-2xl font-serif mb-1">Session Complete</h1>
        <p className="text-muted-foreground mb-6">
          Your session with {partner.name} has ended.
        </p>

        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center mx-auto mb-4">
              <ErrorIcon className="w-8 h-8 text-status-error" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Couldn&apos;t Load Summary</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
              {summaryError.message || 'Failed to load session summary'}
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
        <h1 className="text-2xl font-serif mb-1">Session Complete</h1>
        <p className="text-muted-foreground mb-6">
          Your session with {partner.name} has ended.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Session Summary</CardTitle>
            <CardDescription>
              Duration: {session.durationMinutes} minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Goal</h3>
              <p className="text-sm text-muted-foreground italic">&ldquo;{session.goal}&rdquo;</p>
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
          sessionTitle={session.title || `Session with ${partner.name}`}
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
            sessionId={session.id}
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
 * Archived session view
 */
function ArchivedSessionView() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <ArchiveIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Session Archived</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">
        This session has been archived and is no longer accessible.
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

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [isStarting, setIsStarting] = useState(false);

  // Fetch session data
  const {
    data: apiSession,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId, API_KEY),
    enabled: !!sessionId,
    refetchInterval: 5000, // Poll for updates while waiting
  });

  const session = apiSession ? transformSession(apiSession) : null;

  // Fetch session summary (only when session is ended)
  const {
    data: apiSummary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['session-summary', sessionId],
    queryFn: () => getSessionSummary(sessionId, API_KEY),
    enabled: !!sessionId && session?.status === 'ended',
    retry: 3,
    retryDelay: 1000,
  });

  const summary = apiSummary ? transformSummary(apiSummary) : null;

  // Redirect to live view if session is active
  useEffect(() => {
    if (session?.status === 'in_progress' || session?.status === 'paused') {
      router.push(`/sessions/${sessionId}/live`);
    }
  }, [session?.status, sessionId, router]);

  // Start session handler
  const handleStartSession = async () => {
    if (!session) return;

    setIsStarting(true);
    try {
      await startSession(
        sessionId,
        { meeting_url: session.meetingUrl || '' },
        API_KEY
      );
      // Redirect to live view
      router.push(`/sessions/${sessionId}/live`);
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsStarting(false);
      // Error will be shown via query error state on refetch
    }
  };

  // Retry loading summary handler
  const handleRetryLoadSummary = useCallback(() => {
    refetchSummary();
  }, [refetchSummary]);

  // Loading state
  if (isLoading) {
    return <SessionDetailSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <SessionDetailError
        message={error instanceof Error ? error.message : 'Failed to load session'}
        onRetry={() => refetch()}
      />
    );
  }

  // Session not found
  if (!session) {
    return (
      <SessionDetailError
        message="Session not found"
        onRetry={() => refetch()}
      />
    );
  }

  // Render based on session status
  const statusViews: Record<SessionStatus, JSX.Element> = {
    draft: <PreSessionView session={session} onStartSession={handleStartSession} isStarting={isStarting} />,
    pending_consent: <PreSessionView session={session} onStartSession={handleStartSession} isStarting={isStarting} />,
    ready: <PreSessionView session={session} onStartSession={handleStartSession} isStarting={isStarting} />,
    in_progress: <SessionDetailSkeleton />, // Will redirect via useEffect
    paused: <SessionDetailSkeleton />, // Will redirect via useEffect
    ended: (
      <PostSessionView
        session={session}
        summary={summary}
        summaryLoading={summaryLoading}
        summaryError={summaryError instanceof Error ? summaryError : summaryError ? new Error('Failed to load summary') : null}
        onRetryLoadSummary={handleRetryLoadSummary}
      />
    ),
    archived: <ArchivedSessionView />,
  };

  return statusViews[session.status];
}
