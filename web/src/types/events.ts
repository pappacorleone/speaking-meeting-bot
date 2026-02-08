/**
 * WebSocket event types for real-time talk communication.
 * These define the structure of events sent from the backend to frontend.
 */

import type { TalkStatus, Participant, FacilitatorConfig } from './talk';
import type { Intervention } from './intervention';

// =============================================================================
// Event Type Literals
// =============================================================================

export type TalkEventType =
  | 'session_state'
  | 'balance_update'
  | 'intervention'
  | 'escalation'
  | 'time_remaining'
  | 'goal_drift'
  | 'participant_status'
  | 'ai_status'
  | 'error';

// =============================================================================
// Base Event Interface
// =============================================================================

export interface TalkEvent<T = unknown> {
  type: TalkEventType;
  data: T;
  timestamp: string;
}

// =============================================================================
// Specific Event Data Types
// =============================================================================

export interface BalanceUpdateData {
  participantA: { id: string; name: string; percentage: number };
  participantB: { id: string; name: string; percentage: number };
  status: 'balanced' | 'mild_imbalance' | 'severe_imbalance';
}

export interface TimeRemainingData {
  minutes: number;
  seconds: number;
  totalSecondsRemaining: number;
  percentComplete: number;
}

export interface TalkStateData {
  status: TalkStatus;
  goal?: string;
  durationMinutes?: number;
  participants?: Participant[];
  facilitatorConfig?: FacilitatorConfig;
  botId?: string | null;
  clientId?: string | null;
  facilitatorPaused?: boolean;
  aiStatus?: AIStatus;
  reason?: string;
  previousStatus?: TalkStatus;
}

export interface ParticipantStatusData {
  participantId: string;
  name: string;
  isConnected: boolean;
  isSpeaking: boolean;
}

export type AIStatus = 'listening' | 'preparing' | 'intervening' | 'paused' | 'idle';

export interface AIStatusData {
  status: AIStatus;
  message?: string;
}

export interface GoalDriftData {
  isOnGoal: boolean;
  driftDurationSeconds: number;
  originalGoal: string;
}

export interface ErrorData {
  code: string;
  message: string;
  recoverable: boolean;
}

// =============================================================================
// Typed Event Interfaces
// =============================================================================

export interface BalanceUpdateEvent extends TalkEvent<BalanceUpdateData> {
  type: 'balance_update';
}

export interface TimeRemainingEvent extends TalkEvent<TimeRemainingData> {
  type: 'time_remaining';
}

export interface TalkStateEvent extends TalkEvent<TalkStateData> {
  type: 'session_state';
}

export interface InterventionEvent extends TalkEvent<Intervention> {
  type: 'intervention';
}

export interface EscalationEvent extends TalkEvent<Intervention> {
  type: 'escalation';
}

export interface ParticipantStatusEvent extends TalkEvent<ParticipantStatusData> {
  type: 'participant_status';
}

export interface AIStatusEvent extends TalkEvent<AIStatusData> {
  type: 'ai_status';
}

export interface GoalDriftEvent extends TalkEvent<GoalDriftData> {
  type: 'goal_drift';
}

export interface ErrorEvent extends TalkEvent<ErrorData> {
  type: 'error';
}

// =============================================================================
// Union Type for All Events
// =============================================================================

export type AnyTalkEvent =
  | BalanceUpdateEvent
  | TimeRemainingEvent
  | TalkStateEvent
  | InterventionEvent
  | EscalationEvent
  | ParticipantStatusEvent
  | AIStatusEvent
  | GoalDriftEvent
  | ErrorEvent;

// =============================================================================
// Type Guards
// =============================================================================

export function isBalanceUpdateEvent(event: TalkEvent): event is BalanceUpdateEvent {
  return event.type === 'balance_update';
}

export function isTimeRemainingEvent(event: TalkEvent): event is TimeRemainingEvent {
  return event.type === 'time_remaining';
}

export function isTalkStateEvent(event: TalkEvent): event is TalkStateEvent {
  return event.type === 'session_state';
}

export function isInterventionEvent(event: TalkEvent): event is InterventionEvent {
  return event.type === 'intervention';
}

export function isEscalationEvent(event: TalkEvent): event is EscalationEvent {
  return event.type === 'escalation';
}

export function isParticipantStatusEvent(event: TalkEvent): event is ParticipantStatusEvent {
  return event.type === 'participant_status';
}

export function isAIStatusEvent(event: TalkEvent): event is AIStatusEvent {
  return event.type === 'ai_status';
}

export function isGoalDriftEvent(event: TalkEvent): event is GoalDriftEvent {
  return event.type === 'goal_drift';
}

export function isErrorEvent(event: TalkEvent): event is ErrorEvent {
  return event.type === 'error';
}

// =============================================================================
// WebSocket Connection Types
// =============================================================================

export type WebSocketConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectInterval: number;
  heartbeatInterval: number;
}

export interface WebSocketState {
  connectionState: WebSocketConnectionState;
  lastEventAt: string | null;
  reconnectCount: number;
  error: string | null;
}

// =============================================================================
// Event Handlers Type
// =============================================================================

export interface TalkEventHandlers {
  onBalanceUpdate?: (data: BalanceUpdateData) => void;
  onTimeRemaining?: (data: TimeRemainingData) => void;
  onTalkState?: (data: TalkStateData) => void;
  onIntervention?: (data: Intervention) => void;
  onEscalation?: (data: Intervention) => void;
  onParticipantStatus?: (data: ParticipantStatusData) => void;
  onAIStatus?: (data: AIStatusData) => void;
  onGoalDrift?: (data: GoalDriftData) => void;
  onError?: (data: ErrorData) => void;
  onConnect?: () => void;
  onDisconnect?: (reason?: string) => void;
}
