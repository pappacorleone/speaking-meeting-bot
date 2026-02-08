/**
 * Zustand store for live talk UI state.
 * Manages real-time metrics, connection state, and facilitator settings.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  TalkBalanceMetrics,
  Talk,
  Participant,
  FacilitatorConfig,
} from '@/types/talk';
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

export interface TalkUIState {
  // Talk reference
  talkId: string | null;
  talk: Talk | null;

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

  // Talk lifecycle
  isStarting: boolean;
  isEnding: boolean;
  isPausing: boolean;
}

export interface TalkUIActions {
  // Initialization
  initTalk: (talkId: string, talk: Talk) => void;
  clearTalk: () => void;

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

  // Talk lifecycle
  setStarting: (isStarting: boolean) => void;
  setEnding: (isEnding: boolean) => void;
  setPausing: (isPausing: boolean) => void;

  // Update talk data
  updateTalk: (updates: Partial<Talk>) => void;
  updateParticipants: (participants: Participant[]) => void;
}

export type TalkStore = TalkUIState & TalkUIActions;

// =============================================================================
// Initial State
// =============================================================================

const initialState: TalkUIState = {
  // Talk reference
  talkId: null,
  talk: null,

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

  // Talk lifecycle
  isStarting: false,
  isEnding: false,
  isPausing: false,
};

// =============================================================================
// Store
// =============================================================================

export const useTalkStore = create<TalkStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // =========================================================================
      // Initialization
      // =========================================================================

      initTalk: (talkId, talk) => {
        set({
          talkId,
          talk,
          facilitatorConfig: talk.facilitator,
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

      clearTalk: () => {
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
      // Talk Lifecycle
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
      // Talk Updates
      // =========================================================================

      updateTalk: (updates) => {
        set((state) => ({
          talk: state.talk ? { ...state.talk, ...updates } : null,
        }));
      },

      updateParticipants: (participants) => {
        set((state) => ({
          talk: state.talk
            ? { ...state.talk, participants }
            : null,
        }));
      },
    }),
    { name: 'talk-store' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const selectIsTalkActive = (state: TalkStore): boolean => {
  return state.talk?.status === 'in_progress';
};

export const selectIsTalkPaused = (state: TalkStore): boolean => {
  return state.talk?.status === 'paused' || state.facilitatorPaused;
};

export const selectCanStartTalk = (state: TalkStore): boolean => {
  return state.talk?.status === 'ready' && !state.isStarting;
};

export const selectTimeRemainingPercent = (state: TalkStore): number => {
  return state.timeRemaining?.percentComplete ?? 0;
};

export const selectDominantSpeaker = (state: TalkStore): string | null => {
  if (!state.balance) return null;
  const { participantA, participantB } = state.balance;
  if (participantA.percentage > participantB.percentage) {
    return participantA.name;
  } else if (participantB.percentage > participantA.percentage) {
    return participantB.name;
  }
  return null;
};

export const selectAllParticipantsConnected = (state: TalkStore): boolean => {
  const statuses = Array.from(state.participantStatuses.values());
  if (statuses.length === 0) return false;
  return statuses.every((s) => s.isConnected);
};

export const selectCurrentSpeaker = (state: TalkStore): string | null => {
  const statuses = Array.from(state.participantStatuses.values());
  const speaking = statuses.find((s) => s.isSpeaking);
  return speaking?.name ?? null;
};
