/**
 * Zustand store for intervention queue management.
 * Manages the queue of AI interventions and their display state.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Intervention,
  InterventionWithMeta,
  InterventionPriority,
} from '@/types/intervention';
import {
  getInterventionPriority,
  shouldAutoDismiss,
  getAutoDismissDelay,
} from '@/types/intervention';

// =============================================================================
// Types
// =============================================================================

export interface InterventionState {
  // Queue state
  queue: InterventionWithMeta[];
  current: InterventionWithMeta | null;
  history: InterventionWithMeta[];

  // Display state
  isOverlayVisible: boolean;
  isPreviewing: boolean;

  // Cooldown tracking (prevent intervention spam)
  lastInterventionAt: string | null;
  cooldownActive: boolean;

  // Statistics
  totalInterventions: number;
  acknowledgedCount: number;
  autoDismissedCount: number;
}

export interface InterventionActions {
  // Queue management
  push: (intervention: Intervention) => void;
  dismiss: () => void;
  acknowledge: () => void;
  clear: () => void;

  // Display
  showOverlay: () => void;
  hideOverlay: () => void;
  setPreviewMode: (isPreviewing: boolean) => void;

  // Processing
  processNext: () => void;

  // History
  clearHistory: () => void;

  // Cooldown
  setCooldown: (active: boolean) => void;
}

export type InterventionStore = InterventionState & InterventionActions;

// =============================================================================
// Constants
// =============================================================================

const MAX_QUEUE_SIZE = 10;
const MAX_HISTORY_SIZE = 50;
const DEFAULT_COOLDOWN_MS = 30000; // 30 seconds between interventions

// =============================================================================
// Initial State
// =============================================================================

const initialState: InterventionState = {
  queue: [],
  current: null,
  history: [],
  isOverlayVisible: false,
  isPreviewing: false,
  lastInterventionAt: null,
  cooldownActive: false,
  totalInterventions: 0,
  acknowledgedCount: 0,
  autoDismissedCount: 0,
};

// =============================================================================
// Helpers
// =============================================================================

function createInterventionWithMeta(intervention: Intervention): InterventionWithMeta {
  const priority = getInterventionPriority(intervention.type);
  const autoDismiss = shouldAutoDismiss(intervention.modality);
  const autoDismissMs = autoDismiss ? getAutoDismissDelay(intervention.type) : undefined;

  return {
    ...intervention,
    priority,
    autoDismiss,
    autoDismissMs,
    acknowledged: false,
  };
}

function sortByPriority(a: InterventionWithMeta, b: InterventionWithMeta): number {
  const priorityOrder: Record<InterventionPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return priorityOrder[a.priority] - priorityOrder[b.priority];
}

// =============================================================================
// Store
// =============================================================================

export const useInterventionStore = create<InterventionStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // =========================================================================
      // Queue Management
      // =========================================================================

      push: (intervention) => {
        const meta = createInterventionWithMeta(intervention);

        set((state) => {
          // Check if intervention with same ID already exists
          const exists = state.queue.some((i) => i.id === meta.id) ||
            state.current?.id === meta.id;
          if (exists) return state;

          // Add to queue and sort by priority
          const newQueue = [...state.queue, meta]
            .sort(sortByPriority)
            .slice(0, MAX_QUEUE_SIZE);

          // If no current intervention, immediately process
          if (!state.current) {
            const [next, ...remaining] = newQueue;
            return {
              queue: remaining,
              current: next || null,
              isOverlayVisible: !!next,
              totalInterventions: state.totalInterventions + 1,
              lastInterventionAt: new Date().toISOString(),
            };
          }

          return {
            queue: newQueue,
            totalInterventions: state.totalInterventions + 1,
          };
        });
      },

      dismiss: () => {
        set((state) => {
          if (!state.current) return state;

          // Move current to history
          const dismissed: InterventionWithMeta = {
            ...state.current,
            acknowledged: false,
          };
          const newHistory = [dismissed, ...state.history].slice(0, MAX_HISTORY_SIZE);

          // Get next from queue
          const [next, ...remaining] = state.queue;

          return {
            current: next || null,
            queue: remaining,
            history: newHistory,
            isOverlayVisible: !!next,
            autoDismissedCount: state.autoDismissedCount + 1,
          };
        });
      },

      acknowledge: () => {
        set((state) => {
          if (!state.current) return state;

          // Move current to history with acknowledged flag
          const acknowledged: InterventionWithMeta = {
            ...state.current,
            acknowledged: true,
          };
          const newHistory = [acknowledged, ...state.history].slice(0, MAX_HISTORY_SIZE);

          // Get next from queue
          const [next, ...remaining] = state.queue;

          return {
            current: next || null,
            queue: remaining,
            history: newHistory,
            isOverlayVisible: !!next,
            acknowledgedCount: state.acknowledgedCount + 1,
          };
        });
      },

      clear: () => {
        set({
          queue: [],
          current: null,
          isOverlayVisible: false,
        });
      },

      // =========================================================================
      // Display
      // =========================================================================

      showOverlay: () => {
        set({ isOverlayVisible: true });
      },

      hideOverlay: () => {
        set({ isOverlayVisible: false });
      },

      setPreviewMode: (isPreviewing) => {
        set({ isPreviewing });
      },

      // =========================================================================
      // Processing
      // =========================================================================

      processNext: () => {
        set((state) => {
          if (state.current) return state; // Already showing an intervention

          const [next, ...remaining] = state.queue;
          if (!next) return state;

          return {
            current: next,
            queue: remaining,
            isOverlayVisible: true,
            lastInterventionAt: new Date().toISOString(),
          };
        });
      },

      // =========================================================================
      // History
      // =========================================================================

      clearHistory: () => {
        set({
          history: [],
          totalInterventions: 0,
          acknowledgedCount: 0,
          autoDismissedCount: 0,
        });
      },

      // =========================================================================
      // Cooldown
      // =========================================================================

      setCooldown: (active) => {
        set({ cooldownActive: active });
      },
    }),
    { name: 'intervention-store' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

export const selectHasCurrentIntervention = (state: InterventionStore): boolean => {
  return state.current !== null;
};

export const selectQueueLength = (state: InterventionStore): number => {
  return state.queue.length;
};

export const selectCurrentPriority = (state: InterventionStore): InterventionPriority | null => {
  return state.current?.priority ?? null;
};

export const selectIsCriticalIntervention = (state: InterventionStore): boolean => {
  return state.current?.priority === 'critical';
};

export const selectAcknowledgementRate = (state: InterventionStore): number => {
  const total = state.acknowledgedCount + state.autoDismissedCount;
  if (total === 0) return 0;
  return state.acknowledgedCount / total;
};

export const selectRecentHistory = (state: InterventionStore, count = 5): InterventionWithMeta[] => {
  return state.history.slice(0, count);
};

export const selectInterventionsByType = (state: InterventionStore, type: Intervention['type']): InterventionWithMeta[] => {
  return state.history.filter((i) => i.type === type);
};

export const selectIsInCooldown = (state: InterventionStore): boolean => {
  if (!state.lastInterventionAt) return false;
  const elapsed = Date.now() - new Date(state.lastInterventionAt).getTime();
  return elapsed < DEFAULT_COOLDOWN_MS;
};

// =============================================================================
// Auto-dismiss Hook Helper
// =============================================================================

/**
 * Helper to set up auto-dismiss timer for current intervention.
 * Call this in a useEffect in your overlay component.
 */
export function getAutoDismissTimeout(
  current: InterventionWithMeta | null,
  onDismiss: () => void
): NodeJS.Timeout | null {
  if (!current || !current.autoDismiss || !current.autoDismissMs) {
    return null;
  }

  return setTimeout(onDismiss, current.autoDismissMs);
}
