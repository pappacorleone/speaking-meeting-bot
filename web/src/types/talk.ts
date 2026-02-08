/**
 * Talk-related types for frontend components.
 * Uses camelCase naming convention for TypeScript/React.
 *
 * Note: API response types in lib/api/types.ts use snake_case
 * to match the backend. Use transformation utilities to convert.
 */

// =============================================================================
// Enums / Literals
// =============================================================================

export type TalkStatus =
  | 'draft'
  | 'pending_consent'
  | 'ready'
  | 'in_progress'
  | 'paused'
  | 'ended'
  | 'archived';

export type Platform = 'zoom' | 'meet' | 'teams' | 'diadi';

export type FacilitatorPersona =
  | 'neutral_mediator'
  | 'deep_empath'
  | 'decision_catalyst';

export type ParticipantRole = 'creator' | 'invitee';

// =============================================================================
// Core Models
// =============================================================================

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  consented: boolean;
}

export interface FacilitatorConfig {
  persona: FacilitatorPersona;
  interruptAuthority: boolean;
  directInquiry: boolean;
  silenceDetection: boolean;
}

export interface Talk {
  id: string;
  title?: string;
  goal: string;
  relationshipContext: string;
  platform: Platform;
  meetingUrl?: string;
  durationMinutes: number;
  scheduledAt?: string;
  status: TalkStatus;
  participants: Participant[];
  facilitator: FacilitatorConfig;
  createdAt: string;
  inviteToken: string;
  botId?: string;
  clientId?: string;
}

// =============================================================================
// Metrics & Summary
// =============================================================================

export type BalanceStatus = 'balanced' | 'mild_imbalance' | 'severe_imbalance';

export interface ParticipantBalance {
  id: string;
  name: string;
  percentage: number;
}

export interface TalkBalanceMetrics {
  participantA: ParticipantBalance;
  participantB: ParticipantBalance;
  status: BalanceStatus;
}

export interface KeyAgreement {
  title: string;
  description: string;
}

export interface TalkSummary {
  talkId: string;
  durationMinutes: number;
  consensusSummary: string;
  actionItems: string[];
  balance: TalkBalanceMetrics;
  interventionCount: number;
  keyAgreements: KeyAgreement[];
}

// =============================================================================
// Wizard / Form Types
// =============================================================================

export interface TalkWizardFormData {
  // Step 0: Identity & Bond
  partnerName: string;
  relationshipContext: string;

  // Step 1: Talk Goal
  goal: string;
  scheduledAt?: string;
  durationMinutes: number;

  // Step 2: Facilitator Calibration
  facilitator: FacilitatorConfig;

  // Step 4: Launch Hub
  platform: Platform;
  meetingUrl?: string;
}

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

export type TalkStatusGroup = 'active' | 'upcoming' | 'past';

export function getTalkStatusGroup(status: TalkStatus): TalkStatusGroup {
  switch (status) {
    case 'in_progress':
    case 'paused':
      return 'active';
    case 'draft':
    case 'pending_consent':
    case 'ready':
      return 'upcoming';
    case 'ended':
    case 'archived':
      return 'past';
  }
}

export function isTalkActive(status: TalkStatus): boolean {
  return status === 'in_progress' || status === 'paused';
}

export function canStartTalk(status: TalkStatus): boolean {
  return status === 'ready';
}

export function getStatusLabel(status: TalkStatus): string {
  const labels: Record<TalkStatus, string> = {
    draft: 'Draft',
    pending_consent: 'Awaiting Partner',
    ready: 'Ready to Start',
    in_progress: 'In Progress',
    paused: 'Paused',
    ended: 'Completed',
    archived: 'Archived',
  };
  return labels[status];
}
