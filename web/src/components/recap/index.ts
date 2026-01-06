/**
 * Recap components barrel export.
 *
 * Post-session recap UI components for displaying session summary,
 * key agreements, action items, and rating collection.
 */

// =============================================================================
// Synthesis Board
// =============================================================================

export {
  SynthesisBoard,
  SynthesisBoardSkeleton,
  SynthesisBoardHeader,
  ConsensusSummaryCard,
  SessionMetrics,
} from './synthesis-board';

// =============================================================================
// Key Agreements
// =============================================================================

export {
  KeyAgreements,
  KeyAgreementCard,
  KeyAgreementsList,
  KeyAgreementsInline,
  KeyAgreementsSkeleton,
} from './key-agreements';

// =============================================================================
// Action Items
// =============================================================================

export {
  ActionItems,
  ActionItemsInteractive,
  ActionItemsCompact,
  ActionItemsSkeleton,
  toActionItems,
} from './action-items';

// =============================================================================
// Rating Prompt
// =============================================================================

export {
  RatingPrompt,
  RatingPromptCompact,
  RatingPromptDialog,
  RatingPromptSkeleton,
  StarRating,
} from './rating-prompt';

export type { SessionRating } from './rating-prompt';
