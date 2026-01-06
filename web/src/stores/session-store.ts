/**
 * Zustand store for live session UI state.
 * Manages real-time metrics, connection state, and facilitator settings.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  TalkBalanceMetrics,
  Session,
  Participant,
  FacilitatorConfig,
} from '@/types/session';
import type { AIStatus, TimeRemainingData, GoalDriftData, ParticipantStatusData } from '@/types/events';

// =============================================================================
// Types
// =============================================================================

export interface ParticipantConnectionStatus {
  participantId: string;
  name: string;
  isConnected: boolean;
  isSpeaking: boolean;
}

export interface SessionUIState {
  // Session reference
  sessionId: string | null;
  session: Session | null;

  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  lastEventAt: string | null;

  // Live metrics
  balance: TalkBalanceMetrics | null;
  aiStatus: AIStatus;
  timeRemaining: TimeRemainingData | null;
  elapsedSeconds: number;

  // Participant status
  participantStatuses: Map<string, ParticipantConnectionStatus>;

  // Goal tracking
  isOnGoal: boolean;
  goalDriftSeconds: number;

  // Facilitator settings (runtime adjustments)
  facilitatorPaused: boolean;
  facilitatorConfig: FacilitatorConfig | null;

  // Session lifecycle
  isStarting: boolean;
  isEnding: boolean;
  isPausing: boolean;
}

export interface SessionUIActions {
  // Initialization
  initSession: (sessionId: string, session: Session) => void;
  clearSession: () => void;

  // Connection
  setConnected: (isConnected: boolean) => void;
  setConnectionError: (error: string | null) => void;

  // Live metrics updates (from WebSocket)
  setBalance: (balance: TalkBalanceMetrics) => void;
  setAIStatus: (status: AIStatus) => void;
  setTimeRemaining: (time: TimeRemainingData) => void;
  incrementElapsed: () => void;

  // Participant status
  setParticipantStatus: (status: ParticipantStatusData) => void;
  clearParticipantStatuses: () => void;

  // Goal tracking
  setGoalDrift: (data: GoalDriftData) => void;

  // Facilitator controls
  toggleFacilitator: () => void;
  setFacilitatorPaused: (paused: boolean) => void;
  updateFacilitatorConfig: (config: Partial<FacilitatorConfig>) => void;

  // Session lifecycle
  setStarting: (isStarting: boolean) => void;
  setEnding: (isEnding: boolean) => void;
  setPausing: (isPausing: boolean) => void;

  // Update session data
  updateSession: (updates: Partial<Session>) => void;
  updateParticipants: (participants: Participant[]) => void;
}

export type SessionStore = SessionUIState & SessionUIActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: SessionUIState = {
  // Session reference
  sessionId: null,
  session: null,

  // Connection state
  isConnected: false,
  connectionError: null,
  lastEventAt: null,

  // Live metrics
  balance: null,
  aiStatus: 'idle',
  timeRemaining: null,
  elapsedSeconds: 0,

  // Participant status
  participantStatuses: new Map(),

  // Goal tracking
  isOnGoal: true,
  goalDriftSeconds: 0,

  // Facilitator settings
  facilitatorPaused: false,
  facilitatorConfig: null,

  // Session lifecycle
  isStarting: false,
  isEnding: false,
  isPausing: false,
};

// =============================================================================
// Store
// =============================================================================

export const useSessionStore = create<SessionStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // =========================================================================
      // Initialization
      // =========================================================================

      initSession: (sessionId, session) => {
        set({
          sessionId,
          session,
          facilitatorConfig: session.facilitator,
          facilitatorPaused: false,
          balance: null,
          timeRemaining: null,
          elapsedSeconds: 0,
          isOnGoal: true,
          goalDriftSeconds: 0,
          aiStatus: 'idle',
          participantStatuses: new Map(),
          connectionError: null,
        });
      },

      clearSession: () => {
        set(initialState);
      },

      // =========================================================================
      // Connection
      // =========================================================================

      setConnected: (isConnected) => {
        set({
          isConnected,
          lastEventAt: isConnected ? new Date().toISOString() : get().lastEventAt,
          connectionError: isConnected ? null : get().connectionError,
        });
      },

      setConnectionError: (error) => {
        set({ connectionError: error });
      },

      // =========================================================================
      // Live Metrics
      // =========================================================================

      setBalance: (balance) => {
        set({
          balance,
          lastEventAt: new Date().toISOString(),
        });
      },

      setAIStatus: (status) => {
        set({
          aiStatus: status,
          lastEventAt: new Date().toISOString(),
        });
      },

      setTimeRemaining: (time) => {
        set({
          timeRemaining: time,
          lastEventAt: new Date().toISOString(),
        });
      },

      incrementElapsed: () => {
        set((state) => ({
          elapsedSeconds: state.elapsedSeconds + 1,
        }));
      },

      // =========================================================================
      // Participant Status
      // =========================================================================

      setParticipantStatus: (status) => {
        set((state) => {
          const newStatuses = new Map(state.participantStatuses);
          newStatuses.set(status.participantId, {
            participantId: status.participantId,
            name: status.name,
            isConnected: status.isConnected,
            isSpeaking: status.isSpeaking,
          });
          return {
            participantStatuses: newStatuses,
            lastEventAt: new Date().toISOString(),
          };
        });
      },

      clearParticipantStatuses: () => {
        set({ participantStatuses: new Map() });
      },

      // =========================================================================
      // Goal Tracking
      // =========================================================================

      setGoalDrift: (data) => {
        set({
          isOnGoal: data.isOnGoal,
          goalDriftSeconds: data.driftDurationSeconds,
          lastEventAt: new Date().toISOString(),
        });
      },

      // =========================================================================
      // Facilitator Controls
      // =========================================================================

      toggleFacilitator: () => {
        set((state) => ({
          facilitatorPaused: !state.facilitatorPaused,
        }));
      },

      setFacilitatorPaused: (paused) => {
        set({ facilitatorPaused: paused });
      },

      updateFacilitatorConfig: (config) => {
        set((state) => ({
          facilitatorConfig: state.facilitatorConfig
            ? { ...state.facilitatorConfig, ...config }
            : null,
        }));
      },

      // =========================================================================
      // Session Lifecycle
      // =========================================================================

      setStarting: (isStarting) => {
        set({ isStarting });
      },

      setEnding: (isEnding) => {
        set({ isEnding });
      },

      setPausing: (isPausing) => {
        set({ isPausing });
      },

      // =========================================================================
      // Session Updates
      // =========================================================================

      updateSession: (updates) => {
        set((state) => ({
          session: state.session ? { ...state.session, ...updates } : null,
        }));
      },

      updateParticipants: (participants) => {
        set((state) => ({
          session: state.session
            ? { ...state.session, participants }
            : null,
        }));
      },
    }),
    { name: 'session-store' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const selectIsSessionActive = (state: SessionStore): boolean => {
  return state.session?.status === 'in_progress';
};

export const selectIsSessionPaused = (state: SessionStore): boolean => {
  return state.session?.status === 'paused' || state.facilitatorPaused;
};

export const selectCanStartSession = (state: SessionStore): boolean => {
  return state.session?.status === 'ready' && !state.isStarting;
};

export const selectTimeRemainingPercent = (state: SessionStore): number => {
  return state.timeRemaining?.percentComplete ?? 0;
};

export const selectDominantSpeaker = (state: SessionStore): string | null => {
  if (!state.balance) return null;
  const { participantA, participantB } = state.balance;
  if (participantA.percentage > participantB.percentage) {
    return participantA.name;
  } else if (participantB.percentage > participantA.percentage) {
    return participantB.name;
  }
  return null;
};

export const selectAllParticipantsConnected = (state: SessionStore): boolean => {
  const statuses = Array.from(state.participantStatuses.values());
  if (statuses.length === 0) return false;
  return statuses.every((s) => s.isConnected);
};

export const selectCurrentSpeaker = (state: SessionStore): string | null => {
  const statuses = Array.from(state.participantStatuses.values());
  const speaking = statuses.find((s) => s.isSpeaking);
  return speaking?.name ?? null;
};
