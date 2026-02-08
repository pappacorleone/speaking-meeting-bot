/**
 * Zustand stores barrel export.
 * Centralized exports for all application state stores.
 */

// Talk store - live talk UI state
export {
  useTalkStore,
  type TalkUIState,
  type TalkUIActions,
  type TalkStore,
  type ParticipantConnectionStatus,
  // Selectors
  selectIsTalkActive,
  selectIsTalkPaused,
  selectCanStartTalk,
  selectTimeRemainingPercent,
  selectDominantSpeaker,
  selectAllParticipantsConnected,
  selectCurrentSpeaker,
} from './talk-store';

// Intervention store - intervention queue management
export {
  useInterventionStore,
  type InterventionState,
  type InterventionActions,
  type InterventionStore,
  // Selectors
  selectHasCurrentIntervention,
  selectQueueLength,
  selectCurrentPriority,
  selectIsCriticalIntervention,
  selectAcknowledgementRate,
  selectRecentHistory,
  selectInterventionsByType,
  selectIsInCooldown,
  // Helpers
  getAutoDismissTimeout,
} from './intervention-store';
