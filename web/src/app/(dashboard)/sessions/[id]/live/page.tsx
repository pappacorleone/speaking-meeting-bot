/**
 * Live Facilitation Room Page
 *
 * The main page for active sessions with AI facilitation.
 * Integrates WebSocket for real-time updates and displays:
 * - Talk balance indicator
 * - Session timer
 * - AI status indicator
 * - Goal snippet
 * - Session controls (end session, kill switch)
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getSession, endSession, logError } from '@/lib/api';
import { useSessionEvents } from '@/hooks/use-session-events';
import { useSessionStore } from '@/stores/session-store';
import { useInterventionStore } from '@/stores/intervention-store';
import {
  TalkBalance,
  SessionTimer,
  AIStatusIndicator,
  GoalSnippet,
} from '@/components/live';
import {
  SessionErrorFallback,
  WebSocketDisconnectFallback,
  ConnectionStatusBanner,
} from '@/components/error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Session as ApiSession } from '@/lib/api/types';
import type { Session, TalkBalanceMetrics } from '@/types/session';
import type {
  BalanceUpdateData,
  TimeRemainingData,
  AIStatusData,
  GoalDriftData,
  SessionStateData,
} from '@/types/events';
import type { Intervention } from '@/types/intervention';

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
 * Get partner name from participants (the one who is not the creator)
 */
function getPartnerName(participants: Session['participants']): string {
  const invitee = participants.find((p) => p.role === 'invitee');
  return invitee?.name || 'Partner';
}

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * Loading skeleton for the live session page
 */
function LiveSessionSkeleton() {
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
 * Error state display - uses SessionErrorFallback for consistent error UI
 */
function LiveSessionError({
  error,
  sessionId,
  onRetry
}: {
  error: Error;
  sessionId: string;
  onRetry: () => void;
}) {
  // Log the error for debugging
  useEffect(() => {
    logError(error, { sessionId, component: 'LiveSessionPage' });
  }, [error, sessionId]);

  return (
    <SessionErrorFallback
      error={error}
      sessionId={sessionId}
      onRetry={onRetry}
    />
  );
}

/**
 * Session not found / invalid state
 */
function SessionNotActive({ status }: { status: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <InfoIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Session Not Active</h2>
      <p className="text-muted-foreground mb-4 max-w-sm">
        This session is currently <strong>{status}</strong> and cannot be joined.
      </p>
      <Button onClick={() => router.push('/hub')} variant="outline">
        Return to Hub
      </Button>
    </div>
  );
}

// ConnectionBanner is now imported from @/components/error

/**
 * Session header with partner info and status
 */
function SessionHeader({
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
        <h1 className="text-base sm:text-lg font-semibold truncate">Session with {partnerName}</h1>
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
          <SessionTimer
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
 * Session controls footer
 */
function SessionControls({
  onEndSession,
  onPauseFacilitator,
  facilitatorPaused,
  isEnding,
  isPausing,
}: {
  onEndSession: () => void;
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

      {/* End Session Button */}
      <Button
        variant="destructive"
        className="w-full h-10 sm:h-11 text-sm"
        onClick={onEndSession}
        disabled={isEnding}
      >
        {isEnding ? (
          <LoadingSpinner className="w-4 h-4 mr-2" />
        ) : (
          <PhoneOffIcon className="w-4 h-4 mr-2" />
        )}
        End Session
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

export default function LiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  // ---------------------------------------------------------------------
  // Session Store
  // ---------------------------------------------------------------------
  const {
    session,
    balance,
    aiStatus,
    timeRemaining,
    elapsedSeconds,
    isOnGoal,
    goalDriftSeconds,
    facilitatorPaused,
    isEnding,
    isPausing,
    initSession,
    clearSession,
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
    updateSession,
  } = useSessionStore();

  // Intervention Store
  const { push: pushIntervention } = useInterventionStore();

  // ---------------------------------------------------------------------
  // Fetch Session Data
  // ---------------------------------------------------------------------
  const {
    data: apiSession,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => getSession(sessionId, API_KEY),
    enabled: !!sessionId,
    refetchInterval: false,
  });

  // Transform and initialize session in store
  useEffect(() => {
    if (apiSession) {
      const transformed = transformSession(apiSession);
      initSession(sessionId, transformed);
    }

    return () => {
      clearSession();
    };
  }, [apiSession, sessionId, initSession, clearSession]);

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

  const handleSessionState = useCallback(
    (data: SessionStateData) => {
      updateSession({ status: data.status });

      // If session ended, redirect to summary
      if (data.status === 'ended') {
        router.push(`/sessions/${sessionId}`);
      }
    },
    [updateSession, router, sessionId]
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
      onSessionState: handleSessionState,
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
      handleSessionState,
      handleIntervention,
      handleConnect,
      handleDisconnect,
    ]
  );

  // ---------------------------------------------------------------------
  // WebSocket Connection
  // ---------------------------------------------------------------------
  const { connectionState, reconnectCount } = useSessionEvents(
    session?.status === 'in_progress' || session?.status === 'paused' ? sessionId : null,
    { handlers, autoConnect: true }
  );

  // ---------------------------------------------------------------------
  // Session Actions
  // ---------------------------------------------------------------------
  const handleEndSession = useCallback(async () => {
    if (!sessionId) return;

    setEnding(true);
    try {
      await endSession(sessionId, API_KEY);
      router.push(`/sessions/${sessionId}`);
    } catch (err) {
      console.error('Failed to end session:', err);
      setEnding(false);
    }
  }, [sessionId, setEnding, router]);

  const handlePauseFacilitator = useCallback(() => {
    setPausing(true);
    // Toggle pause state
    setFacilitatorPaused(!facilitatorPaused);
    // TODO: Call pause/resume API endpoint when implemented
    setTimeout(() => setPausing(false), 500);
  }, [facilitatorPaused, setPausing, setFacilitatorPaused]);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  // Loading state
  if (isLoading) {
    return <LiveSessionSkeleton />;
  }

  // Error state
  if (error) {
    const errorObj = error instanceof Error ? error : new Error('Failed to load session');
    return (
      <LiveSessionError
        error={errorObj}
        sessionId={sessionId}
        onRetry={() => refetch()}
      />
    );
  }

  // Session not found
  if (!session) {
    return <LiveSessionSkeleton />;
  }

  // Session not active
  if (session.status !== 'in_progress' && session.status !== 'paused') {
    return <SessionNotActive status={session.status} />;
  }

  const partnerName = getPartnerName(session.participants);

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
      <SessionHeader
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
          durationMinutes={session.durationMinutes}
          goal={session.goal}
          isOnGoal={isOnGoal}
          goalDriftSeconds={goalDriftSeconds}
          onTick={incrementElapsed}
        />
      </div>

      {/* Footer Controls */}
      <SessionControls
        onEndSession={handleEndSession}
        onPauseFacilitator={handlePauseFacilitator}
        facilitatorPaused={facilitatorPaused}
        isEnding={isEnding}
        isPausing={isPausing}
      />
    </div>
    </WebSocketDisconnectFallback>
  );
}
