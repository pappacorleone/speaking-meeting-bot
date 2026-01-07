/**
 * WebSocket hook for real-time session events.
 * Provides connection management with automatic reconnection and event routing.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketUrl } from '@/lib/api/client';
import type {
  SessionEvent,
  SessionEventHandlers,
  WebSocketConnectionState,
  BalanceUpdateData,
  TimeRemainingData,
  SessionStateData,
  ParticipantStatusData,
  AIStatusData,
  GoalDriftData,
  ErrorData,
} from '@/types/events';
import type { Intervention } from '@/types/intervention';

// =============================================================================
// Constants
// =============================================================================

/** Exponential backoff delays for reconnection attempts (in ms) */
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

/** Maximum reconnect attempts before giving up */
const MAX_RECONNECT_ATTEMPTS = 5;

/** Heartbeat interval (30 seconds) to keep connection alive */
const HEARTBEAT_INTERVAL = 30000;

// =============================================================================
// Types
// =============================================================================

export interface UseSessionEventsOptions {
  /** Whether to automatically connect when sessionId is provided */
  autoConnect?: boolean;
  /** Event handlers for different event types */
  handlers?: SessionEventHandlers;
  /** Maximum reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
}

export interface UseSessionEventsReturn {
  /** Current connection state */
  connectionState: WebSocketConnectionState;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Number of reconnection attempts made */
  reconnectCount: number;
  /** Manually connect to the WebSocket */
  connect: () => void;
  /** Manually disconnect from the WebSocket */
  disconnect: () => void;
  /** Send a message through the WebSocket */
  sendMessage: (message: object) => boolean;
  /** Acknowledge an intervention */
  acknowledgeIntervention: (interventionId: string) => boolean;
  /** Update facilitator settings */
  updateSettings: (settings: Record<string, unknown>) => boolean;
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useSessionEvents(
  sessionId: string | null,
  options: UseSessionEventsOptions = {}
): UseSessionEventsReturn {
  const {
    autoConnect = true,
    handlers = {},
    maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS,
  } = options;

  // Refs for WebSocket and timers
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Store handlers in ref to avoid re-connections when handlers change
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // State
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  // -------------------------------------------------------------------------
  // Event Routing
  // -------------------------------------------------------------------------

  const routeEvent = useCallback((event: SessionEvent) => {
    const currentHandlers = handlersRef.current;

    switch (event.type) {
      case 'balance_update':
        currentHandlers.onBalanceUpdate?.(event.data as BalanceUpdateData);
        break;
      case 'time_remaining':
        currentHandlers.onTimeRemaining?.(event.data as TimeRemainingData);
        break;
      case 'session_state':
        currentHandlers.onSessionState?.(event.data as SessionStateData);
        break;
      case 'intervention':
        currentHandlers.onIntervention?.(event.data as Intervention);
        break;
      case 'escalation':
        currentHandlers.onEscalation?.(event.data as Intervention);
        break;
      case 'participant_status':
        currentHandlers.onParticipantStatus?.(event.data as ParticipantStatusData);
        break;
      case 'ai_status':
        currentHandlers.onAIStatus?.(event.data as AIStatusData);
        break;
      case 'goal_drift':
        currentHandlers.onGoalDrift?.(event.data as GoalDriftData);
        break;
      case 'error':
        currentHandlers.onError?.(event.data as ErrorData);
        break;
      default:
        console.warn('[useSessionEvents] Unknown event type:', event.type);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Heartbeat Management
  // -------------------------------------------------------------------------

  const startHeartbeat = useCallback(() => {
    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Connection Management
  // -------------------------------------------------------------------------

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Use ref to store connect function to avoid circular dependency
  const connectRef = useRef<() => void>(() => {});

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= maxReconnectAttempts) {
      setConnectionState('error');
      setError(`Failed to connect after ${maxReconnectAttempts} attempts`);
      return;
    }

    const delay = RECONNECT_DELAYS[
      Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
    ];

    setConnectionState('reconnecting');
    reconnectAttemptRef.current += 1;
    setReconnectCount(reconnectAttemptRef.current);

    console.log(
      `[useSessionEvents] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current}/${maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      // Trigger reconnect via ref to avoid circular dependency
      connectRef.current();
    }, delay);
  }, [maxReconnectAttempts]);

  const connectInternal = useCallback(() => {
    if (!sessionId) {
      console.warn('[useSessionEvents] Cannot connect: no sessionId provided');
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState('connecting');
    setError(null);

    const wsUrl = getWebSocketUrl(`/sessions/${sessionId}/events`);
    console.log('[useSessionEvents] Connecting to:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[useSessionEvents] Connected');
        setConnectionState('connected');
        setError(null);
        reconnectAttemptRef.current = 0;
        setReconnectCount(0);

        // Start heartbeat
        startHeartbeat();

        // Notify handler
        handlersRef.current.onConnect?.();
      };

      ws.onclose = (event) => {
        console.log('[useSessionEvents] Connection closed:', event.code, event.reason);
        stopHeartbeat();

        // Don't reconnect on normal closure (1000) or if sessionId is null
        if (event.code === 1000 || !sessionId) {
          setConnectionState('disconnected');
          handlersRef.current.onDisconnect?.(event.reason || 'Connection closed');
          return;
        }

        // Handle session not found (custom code 4004)
        if (event.code === 4004) {
          setConnectionState('error');
          setError('Session not found');
          handlersRef.current.onDisconnect?.('Session not found');
          return;
        }

        // Attempt reconnection for unexpected closures
        handlersRef.current.onDisconnect?.(event.reason || 'Connection lost');
        scheduleReconnect();
      };

      ws.onerror = (event) => {
        console.error('[useSessionEvents] WebSocket error:', event);
        setError('Connection error');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SessionEvent;

          // Handle pong response (ignore, just for keepalive)
          if (data.type === 'pong' as SessionEvent['type']) {
            return;
          }

          routeEvent(data);
        } catch (err) {
          console.error('[useSessionEvents] Failed to parse message:', err, event.data);
        }
      };
    } catch (err) {
      console.error('[useSessionEvents] Failed to create WebSocket:', err);
      setConnectionState('error');
      setError('Failed to connect');
      scheduleReconnect();
    }
  }, [sessionId, startHeartbeat, stopHeartbeat, scheduleReconnect, routeEvent]);

  const disconnect = useCallback(() => {
    console.log('[useSessionEvents] Disconnecting');
    clearReconnectTimeout();
    stopHeartbeat();

    if (wsRef.current) {
      // Use 1000 (normal closure) to prevent reconnection attempts
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    reconnectAttemptRef.current = 0;
    setReconnectCount(0);
  }, [clearReconnectTimeout, stopHeartbeat]);

  const connect = useCallback(() => {
    // Reset reconnect counter on manual connect
    reconnectAttemptRef.current = 0;
    setReconnectCount(0);
    connectInternal();
  }, [connectInternal]);

  // Update ref for reconnection callback
  connectRef.current = connectInternal;

  // -------------------------------------------------------------------------
  // Message Sending
  // -------------------------------------------------------------------------

  const sendMessage = useCallback((message: object): boolean => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('[useSessionEvents] Cannot send message: not connected');
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('[useSessionEvents] Failed to send message:', err);
      return false;
    }
  }, []);

  const acknowledgeIntervention = useCallback((interventionId: string): boolean => {
    return sendMessage({
      type: 'intervention_ack',
      data: { intervention_id: interventionId },
    });
  }, [sendMessage]);

  const updateSettings = useCallback((settings: Record<string, unknown>): boolean => {
    return sendMessage({
      type: 'update_settings',
      data: settings,
    });
  }, [sendMessage]);

  // -------------------------------------------------------------------------
  // Effect: Auto-connect and cleanup
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (autoConnect && sessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [sessionId, autoConnect]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: connect and disconnect are intentionally omitted to prevent reconnection loops

  // -------------------------------------------------------------------------
  // Return Value
  // -------------------------------------------------------------------------

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    error,
    reconnectCount,
    connect,
    disconnect,
    sendMessage,
    acknowledgeIntervention,
    updateSettings,
  };
}
