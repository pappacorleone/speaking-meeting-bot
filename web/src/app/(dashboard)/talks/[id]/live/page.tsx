/**
 * Live Facilitation Room Page
 *
 * The main page for active talks with AI facilitation.
 * Integrates WebSocket for real-time updates and displays:
 * - Talk balance indicator
 * - Talk timer
 * - AI status indicator
 * - Goal snippet
 * - Talk controls (end talk, kill switch)
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTalk, endTalk, pauseTalk, resumeTalk, logError } from '@/lib/api';
import { useTalkEvents } from '@/hooks/use-talk-events';
import { useTalkStore } from '@/stores/talk-store';
import { useInterventionStore } from '@/stores/intervention-store';
import {
  TalkBalance,
  TalkTimer,
  AIStatusIndicator,
  GoalSnippet,
} from '@/components/live';
import {
  TalkErrorFallback,
  WebSocketDisconnectFallback,
  ConnectionStatusBanner,
} from '@/components/error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Talk as ApiTalk } from '@/lib/api/types';
import type { Talk, TalkBalanceMetrics } from '@/types/talk';
import type {
  BalanceUpdateData,
  TimeRemainingData,
  AIStatusData,
  GoalDriftData,
  TalkStateData,
} from '@/types/events';
import type { Intervention } from '@/types/intervention';

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
 * Get partner name from participants (the one who is not the creator)
 */
function getPartnerName(participants: Talk['participants']): string {
  const invitee = participants.find((p) => p.role === 'invitee');
  return invitee?.name || 'Partner';
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Loading skeleton for the live talk page
 */
function LiveTalkSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="p-4 border-b border-border">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded mt-2" />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-4 space-y-4">
        <div className="h-20 bg-muted rounded-card" />
        <div className="h-16 bg-muted rounded-card" />
        <div className="h-32 bg-muted rounded-card" />
      </div>

      {/* Footer skeleton */}
      <div className="p-4 border-t border-border">
        <div className="h-12 bg-muted rounded-button" />
      </div>
    </div>
  );
}

/**
 * Error state display - uses TalkErrorFallback for consistent error UI
 */
function LiveTalkError({
  error,
  talkId,
  onRetry
}: {
  error: Error;
  talkId: string;
  onRetry: () => void;
}) {
  // Log the error for debugging
  useEffect(() => {
    logError(error, { talkId, component: 'LiveTalkPage' });
  }, [error, talkId]);

  return (
    <TalkErrorFallback
      error={error}
      talkId={talkId}
      onRetry={onRetry}
    />
  );
}

/**
 * Talk not found / invalid state
 */
function TalkNotActive({ status }: { status: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <InfoIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Talk Not Active</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">
        This talk is currently <strong>{status}</strong> and cannot be joined.
      </p>
      <Button onClick={() => router.push('/hub')} variant="outline">
        Return to Hub
      </Button>
    </div>
  );
}

// ConnectionBanner is now imported from @/components/error

/**
 * Talk header with partner info and status
 */
function TalkHeader({
  partnerName,
  aiStatus,
  facilitatorPaused,
}: {
  partnerName: string;
  aiStatus: string;
  facilitatorPaused: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-base sm:text-lg font-semibold truncate">Talk with {partnerName}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {facilitatorPaused ? 'Facilitation Paused' : 'AI Facilitation Active'}
        </p>
      </div>
      <AIStatusIndicator
        status={facilitatorPaused ? 'paused' : (aiStatus as 'idle' | 'listening' | 'preparing' | 'intervening' | 'paused')}
        compact
      />
    </div>
  );
}

/**
 * Main metrics panel showing balance, timer, and goal
 */
function MetricsPanel({
  balance,
  timeRemaining,
  elapsedSeconds,
  durationMinutes,
  goal,
  isOnGoal,
  goalDriftSeconds,
  onTick,
}: {
  balance: TalkBalanceMetrics | null;
  timeRemaining: TimeRemainingData | null;
  elapsedSeconds: number;
  durationMinutes: number;
  goal: string;
  isOnGoal: boolean;
  goalDriftSeconds: number;
  onTick: () => void;
}) {
  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
      {/* Talk Balance */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <TalkBalance balance={balance} />
        </CardContent>
      </Card>

      {/* Timer */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <TalkTimer
            timeRemaining={timeRemaining}
            elapsedSeconds={elapsedSeconds}
            durationMinutes={durationMinutes}
            onTick={onTick}
            isActive
          />
        </CardContent>
      </Card>

      {/* Goal */}
      <GoalSnippet
        goal={goal}
        isOnGoal={isOnGoal}
        driftDurationSeconds={goalDriftSeconds}
      />
    </div>
  );
}

/**
 * Talk controls footer
 */
function TalkControls({
  onEndTalk,
  onPauseFacilitator,
  facilitatorPaused,
  isEnding,
  isPausing,
}: {
  onEndTalk: () => void;
  onPauseFacilitator: () => void;
  facilitatorPaused: boolean;
  isEnding: boolean;
  isPausing: boolean;
}) {
  return (
    <div className="p-3 sm:p-4 border-t border-border space-y-2 sm:space-y-3">
      {/* Kill Switch / Pause Button */}
      <Button
        variant="outline"
        className="w-full h-10 sm:h-11 text-sm"
        onClick={onPauseFacilitator}
        disabled={isPausing}
      >
        {isPausing ? (
          <LoadingSpinner className="w-4 h-4 mr-2" />
        ) : facilitatorPaused ? (
          <PlayIcon className="w-4 h-4 mr-2" />
        ) : (
          <PauseIcon className="w-4 h-4 mr-2" />
        )}
        {facilitatorPaused ? 'Resume Facilitation' : 'Pause Facilitation'}
      </Button>

      {/* End Talk Button */}
      <Button
        variant="destructive"
        className="w-full h-10 sm:h-11 text-sm"
        onClick={onEndTalk}
        disabled={isEnding}
      >
        {isEnding ? (
          <LoadingSpinner className="w-4 h-4 mr-2" />
        ) : (
          <PhoneOffIcon className="w-4 h-4 mr-2" />
        )}
        End Talk
      </Button>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4m0-4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
    </svg>
  );
}

function PhoneOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.68 13.31a16.8 16.8 0 01-3.25-3.25l1.87-1.87a1 1 0 00.29-.92 11.26 11.26 0 01-.36-2.77 1 1 0 00-1-1H4.5a1 1 0 00-1 1 17 17 0 0017 17 1 1 0 001-1v-3.73a1 1 0 00-1-1 11.26 11.26 0 01-2.77-.36 1 1 0 00-.92.29l-1.87 1.87"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path
        d="M12 2a10 10 0 019.17 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function LiveTalkPage() {
  const params = useParams();
  const router = useRouter();
  const talkId = params.id as string;

  // ---------------------------------------------------------------------
  // Talk Store
  // ---------------------------------------------------------------------
  const {
    talk,
    balance,
    aiStatus,
    timeRemaining,
    elapsedSeconds,
    isOnGoal,
    goalDriftSeconds,
    facilitatorPaused,
    isEnding,
    isPausing,
    initTalk,
    clearTalk,
    setConnected,
    setConnectionError,
    setBalance,
    setAIStatus,
    setTimeRemaining,
    incrementElapsed,
    setGoalDrift,
    setFacilitatorPaused,
    setEnding,
    setPausing,
    updateTalk,
    updateParticipants,
  } = useTalkStore();

  // Intervention Store
  const { push: pushIntervention } = useInterventionStore();

  // ---------------------------------------------------------------------
  // Fetch Talk Data
  // ---------------------------------------------------------------------
  const {
    data: apiTalk,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['talk', talkId],
    queryFn: () => getTalk(talkId, API_KEY),
    enabled: !!talkId,
    refetchInterval: false,
  });

  // Transform and initialize talk in store
  useEffect(() => {
    console.log('[LiveTalk] apiTalk status:', apiTalk?.status);
    if (apiTalk) {
      const transformed = transformTalk(apiTalk);
      console.log('[LiveTalk] Initializing talk in store, status:', transformed.status);
      initTalk(talkId, transformed);
    }

    return () => {
      console.log('[LiveTalk] Cleanup: clearing talk');
      clearTalk();
    };
  }, [apiTalk, talkId, initTalk, clearTalk]);

  // ---------------------------------------------------------------------
  // WebSocket Event Handlers
  // ---------------------------------------------------------------------
  const handleBalanceUpdate = useCallback(
    (data: BalanceUpdateData) => {
      setBalance({
        participantA: data.participantA,
        participantB: data.participantB,
        status: data.status,
      });
    },
    [setBalance]
  );

  const handleTimeRemaining = useCallback(
    (data: TimeRemainingData) => {
      setTimeRemaining(data);
    },
    [setTimeRemaining]
  );

  const handleAIStatus = useCallback(
    (data: AIStatusData) => {
      setAIStatus(data.status);
    },
    [setAIStatus]
  );

  const handleGoalDrift = useCallback(
    (data: GoalDriftData) => {
      setGoalDrift(data);
    },
    [setGoalDrift]
  );

  const handleTalkState = useCallback(
    (data: TalkStateData) => {
      updateTalk({ status: data.status });
      if (typeof data.facilitatorPaused === "boolean") {
        setFacilitatorPaused(data.facilitatorPaused);
      }
      if (data.aiStatus) {
        setAIStatus(data.aiStatus);
      }
      if (data.durationMinutes) {
        updateTalk({ durationMinutes: data.durationMinutes });
      }
      if (data.participants) {
        updateParticipants(data.participants);
      }

      // If talk ended, redirect to summary
      if (data.status === 'ended') {
        router.push(`/talks/${talkId}`);
      }
    },
    [updateTalk, updateParticipants, setFacilitatorPaused, setAIStatus, router, talkId]
  );

  const handleIntervention = useCallback(
    (data: Intervention) => {
      pushIntervention(data);
    },
    [pushIntervention]
  );

  const handleConnect = useCallback(() => {
    setConnected(true);
    setConnectionError(null);
  }, [setConnected, setConnectionError]);

  const handleDisconnect = useCallback(
    (reason?: string) => {
      setConnected(false);
      if (reason) {
        setConnectionError(reason);
      }
    },
    [setConnected, setConnectionError]
  );

  // Memoize handlers to prevent reconnection loops
  const handlers = useMemo(
    () => ({
      onBalanceUpdate: handleBalanceUpdate,
      onTimeRemaining: handleTimeRemaining,
      onAIStatus: handleAIStatus,
      onGoalDrift: handleGoalDrift,
      onTalkState: handleTalkState,
      onIntervention: handleIntervention,
      onEscalation: handleIntervention,
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
    }),
    [
      handleBalanceUpdate,
      handleTimeRemaining,
      handleAIStatus,
      handleGoalDrift,
      handleTalkState,
      handleIntervention,
      handleConnect,
      handleDisconnect,
    ]
  );

  // ---------------------------------------------------------------------
  // WebSocket Connection
  // ---------------------------------------------------------------------
  const { connectionState, reconnectCount } = useTalkEvents(
    talk?.status === 'in_progress' || talk?.status === 'paused' ? talkId : null,
    { handlers, autoConnect: true }
  );

  // ---------------------------------------------------------------------
  // Talk Actions
  // ---------------------------------------------------------------------
  const handleEndTalk = useCallback(async () => {
    if (!talkId) return;

    setEnding(true);
    try {
      await endTalk(talkId, API_KEY);
      router.push(`/talks/${talkId}`);
    } catch (err) {
      console.error('Failed to end talk:', err);
      setEnding(false);
    }
  }, [talkId, setEnding, router]);

  const handlePauseFacilitator = useCallback(async () => {
    if (!talkId) return;
    setPausing(true);
    try {
      const response = facilitatorPaused
        ? await resumeTalk(talkId, API_KEY)
        : await pauseTalk(talkId, API_KEY);
      const paused = response.status === "paused";
      setFacilitatorPaused(paused);
      updateTalk({ status: response.status as Talk["status"] });
    } catch (err) {
      console.error("Failed to toggle facilitation:", err);
    } finally {
      setPausing(false);
    }
  }, [talkId, facilitatorPaused, setPausing, setFacilitatorPaused, updateTalk]);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  // Loading state
  if (isLoading) {
    return <LiveTalkSkeleton />;
  }

  // Error state
  if (error) {
    const errorObj = error instanceof Error ? error : new Error('Failed to load talk');
    return (
      <LiveTalkError
        error={errorObj}
        talkId={talkId}
        onRetry={() => refetch()}
      />
    );
  }

  // Talk not found
  if (!talk) {
    console.log('[LiveTalk] Talk from store is null, showing skeleton');
    return <LiveTalkSkeleton />;
  }

  // Talk not active
  if (talk.status !== 'in_progress' && talk.status !== 'paused') {
    console.log('[LiveTalk] Talk not active, status:', talk.status);
    return <TalkNotActive status={talk.status} />;
  }

  const partnerName = getPartnerName(talk.participants);

  return (
    <WebSocketDisconnectFallback
      connectionState={connectionState}
      reconnectCount={reconnectCount}
      maxReconnectAttempts={5}
      onReconnect={() => {
        // Trigger reconnect via refetch which will re-initialize the WebSocket
        refetch();
      }}
      onReturnToHub={() => router.push('/hub')}
    >
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      {/* Connection Status Banner */}
      <ConnectionStatusBanner connectionState={connectionState} reconnectCount={reconnectCount} />

      {/* Header */}
      <TalkHeader
        partnerName={partnerName}
        aiStatus={aiStatus}
        facilitatorPaused={facilitatorPaused}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <MetricsPanel
          balance={balance}
          timeRemaining={timeRemaining}
          elapsedSeconds={elapsedSeconds}
          durationMinutes={talk.durationMinutes}
          goal={talk.goal}
          isOnGoal={isOnGoal}
          goalDriftSeconds={goalDriftSeconds}
          onTick={incrementElapsed}
        />
      </div>

      {/* Footer Controls */}
      <TalkControls
        onEndTalk={handleEndTalk}
        onPauseFacilitator={handlePauseFacilitator}
        facilitatorPaused={facilitatorPaused}
        isEnding={isEnding}
        isPausing={isPausing}
      />
    </div>
    </WebSocketDisconnectFallback>
  );
}
