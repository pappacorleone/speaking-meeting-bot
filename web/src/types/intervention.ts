/**
 * Intervention types for AI facilitation events.
 * These define the structure of interventions triggered by the backend.
 */

// =============================================================================
// Enums / Literals
// =============================================================================

export type InterventionType =
  | 'balance'
  | 'silence'
  | 'goal_drift'
  | 'time_warning'
  | 'escalation'
  | 'icebreaker';

export type InterventionModality = 'visual' | 'voice';

export type InterventionPriority = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// Core Intervention Model
// =============================================================================

export interface Intervention {
  id: string;
  type: InterventionType;
  modality: InterventionModality;
  message: string;
  targetParticipant?: string;
  createdAt: string;
}

// =============================================================================
// Extended Intervention Types (for UI)
// =============================================================================

export interface InterventionWithMeta extends Intervention {
  priority: InterventionPriority;
  autoDismiss: boolean;
  autoDismissMs?: number;
  acknowledged: boolean;
}

// =============================================================================
// Intervention Templates
// =============================================================================

export interface BalanceIntervention extends Intervention {
  type: 'balance';
  targetParticipant: string; // Who needs to speak more
  currentBalance: {
    dominant: { name: string; percentage: number };
    quiet: { name: string; percentage: number };
  };
}

export interface SilenceIntervention extends Intervention {
  type: 'silence';
  silenceDurationSeconds: number;
}

export interface TimeWarningIntervention extends Intervention {
  type: 'time_warning';
  minutesRemaining: number;
}

export interface EscalationIntervention extends Intervention {
  type: 'escalation';
  tensionScore: number;
  suggestedAction: 'pause' | 'redirect' | 'acknowledge';
}

export interface GoalDriftIntervention extends Intervention {
  type: 'goal_drift';
  originalGoal: string;
  driftDurationMinutes: number;
}

export interface IcebreakerIntervention extends Intervention {
  type: 'icebreaker';
  prompt: string;
}

// =============================================================================
// Intervention Queue Types
// =============================================================================

export interface InterventionQueueState {
  queue: Intervention[];
  current: Intervention | null;
  history: Intervention[];
}

// =============================================================================
// Utility Functions
// =============================================================================

export function getInterventionPriority(type: InterventionType): InterventionPriority {
  switch (type) {
    case 'escalation':
      return 'critical';
    case 'balance':
    case 'time_warning':
      return 'high';
    case 'silence':
    case 'goal_drift':
      return 'medium';
    case 'icebreaker':
      return 'low';
  }
}

export function shouldAutoDismiss(modality: InterventionModality): boolean {
  // Visual interventions auto-dismiss, voice interventions don't
  return modality === 'visual';
}

export function getAutoDismissDelay(type: InterventionType): number {
  // Duration in milliseconds
  switch (type) {
    case 'time_warning':
      return 10000; // 10 seconds
    case 'silence':
      return 5000; // 5 seconds
    case 'balance':
    case 'goal_drift':
      return 8000; // 8 seconds
    case 'icebreaker':
      return 15000; // 15 seconds
    case 'escalation':
      return 0; // Never auto-dismiss
  }
}

export function getInterventionLabel(type: InterventionType): string {
  const labels: Record<InterventionType, string> = {
    balance: 'Balance Check',
    silence: 'Silence Break',
    goal_drift: 'Goal Reminder',
    time_warning: 'Time Check',
    escalation: 'Tension Alert',
    icebreaker: 'Icebreaker',
  };
  return labels[type];
}

export function getInterventionIcon(type: InterventionType): string {
  // Icon names (for use with icon library)
  const icons: Record<InterventionType, string> = {
    balance: 'scale',
    silence: 'mic-off',
    goal_drift: 'compass',
    time_warning: 'clock',
    escalation: 'alert-triangle',
    icebreaker: 'message-circle',
  };
  return icons[type];
}
