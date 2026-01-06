/**
 * Session-related types for frontend components.
 * Uses camelCase naming convention for TypeScript/React.
 *
 * Note: API response types in lib/api/types.ts use snake_case
 * to match the backend. Use transformation utilities to convert.
 */

// =============================================================================
// Enums / Literals
// =============================================================================

export type SessionStatus =
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

export interface Session {
  id: string;
  title?: string;
  goal: string;
  relationshipContext: string;
  platform: Platform;
  meetingUrl?: string;
  durationMinutes: number;
  scheduledAt?: string;
  status: SessionStatus;
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

export interface SessionSummary {
  sessionId: string;
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

export interface SessionWizardFormData {
  // Step 0: Identity & Bond
  partnerName: string;
  relationshipContext: string;

  // Step 1: Session Goal
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

export type SessionStatusGroup = 'active' | 'upcoming' | 'past';

export function getSessionStatusGroup(status: SessionStatus): SessionStatusGroup {
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

export function isSessionActive(status: SessionStatus): boolean {
  return status === 'in_progress' || status === 'paused';
}

export function canStartSession(status: SessionStatus): boolean {
  return status === 'ready';
}

export function getStatusLabel(status: SessionStatus): string {
  const labels: Record<SessionStatus, string> = {
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
