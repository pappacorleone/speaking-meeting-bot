"""Session storage for Diadi facilitation sessions.

In-memory session storage for the Alpha release.
Future: Replace with database (PostgreSQL, Redis).
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import WebSocket

from app.models import Session, SessionSummary
from core.balance_tracker import BalanceTracker
from core.intervention_engine import InterventionEngine, InterventionType

# In-memory session storage (Alpha)
# Maps session_id -> Session object
SESSION_STORE: Dict[str, Session] = {}

# Session events for WebSocket broadcast
# Maps session_id -> list of connected WebSockets
SESSION_EVENTS: Dict[str, List[WebSocket]] = {}

# Session summaries storage (Alpha)
# Maps session_id -> SessionSummary object
SESSION_SUMMARIES: Dict[str, SessionSummary] = {}

# Session runtime timers
@dataclass
class SessionTimerState:
    started_at: datetime
    paused_at: Optional[datetime] = None
    paused_seconds: float = 0.0

    def elapsed_seconds(self) -> float:
        now = self.paused_at or datetime.utcnow()
        elapsed = (now - self.started_at).total_seconds() - self.paused_seconds
        return max(elapsed, 0.0)

    def pause(self) -> None:
        if self.paused_at is None:
            self.paused_at = datetime.utcnow()

    def resume(self) -> None:
        if self.paused_at is not None:
            self.paused_seconds += (datetime.utcnow() - self.paused_at).total_seconds()
            self.paused_at = None


SESSION_TIMER_STATE: Dict[str, SessionTimerState] = {}
SESSION_TIMER_TASKS: Dict[str, asyncio.Task] = {}
SESSION_INTERVENTION_ENGINES: Dict[str, InterventionEngine] = {}
SESSION_BALANCE_TRACKERS: Dict[str, BalanceTracker] = {}
SESSION_SPEAKER_MAPS: Dict[str, Dict[str, str]] = {}
SESSION_LAST_SPEECH_AT: Dict[str, datetime] = {}
SESSION_IS_SPEAKING: Dict[str, bool] = {}
SESSION_BALANCE_METRICS: Dict[str, Dict[str, Any]] = {}


# =============================================================================
# Helper Functions for Session CRUD Operations
# =============================================================================


def get_session(session_id: str) -> Optional[Session]:
    """Retrieve a session by ID.

    Args:
        session_id: The unique session identifier.

    Returns:
        The Session object if found, None otherwise.
    """
    return SESSION_STORE.get(session_id)


def get_session_by_invite_token(invite_token: str) -> Optional[Session]:
    """Retrieve a session by its invite token.

    Args:
        invite_token: The unique invite token.

    Returns:
        The Session object if found, None otherwise.
    """
    for session in SESSION_STORE.values():
        if session.invite_token == invite_token:
            return session
    return None


def get_session_by_client_id(client_id: str) -> Optional[Session]:
    """Retrieve a session by its Pipecat client ID."""
    for session in SESSION_STORE.values():
        if session.client_id == client_id:
            return session
    return None


def create_session(session: Session) -> Session:
    """Store a new session.

    Args:
        session: The Session object to store.

    Returns:
        The stored Session object.
    """
    SESSION_STORE[session.id] = session
    return session


def update_session(session_id: str, session: Session) -> Optional[Session]:
    """Update an existing session.

    Args:
        session_id: The unique session identifier.
        session: The updated Session object.

    Returns:
        The updated Session object if found, None otherwise.
    """
    if session_id not in SESSION_STORE:
        return None
    SESSION_STORE[session_id] = session
    return session


def delete_session(session_id: str) -> bool:
    """Delete a session by ID.

    Args:
        session_id: The unique session identifier.

    Returns:
        True if the session was deleted, False if not found.
    """
    if session_id in SESSION_STORE:
        del SESSION_STORE[session_id]
        stop_session_timer(session_id)
        stop_balance_tracker(session_id)
        SESSION_BALANCE_METRICS.pop(session_id, None)
        # Also cleanup any associated WebSocket connections
        if session_id in SESSION_EVENTS:
            del SESSION_EVENTS[session_id]
        # Also cleanup any associated summary
        if session_id in SESSION_SUMMARIES:
            del SESSION_SUMMARIES[session_id]
        return True
    return False


def list_sessions(status: Optional[str] = None) -> List[Session]:
    """List all sessions, optionally filtered by status.

    Args:
        status: Optional status filter (e.g., "draft", "in_progress").

    Returns:
        List of Session objects matching the filter, sorted by created_at descending.
    """
    sessions = list(SESSION_STORE.values())
    if status:
        sessions = [s for s in sessions if s.status.value == status]
    # Sort by created_at descending (newest first)
    sessions.sort(key=lambda s: s.created_at, reverse=True)
    return sessions


# =============================================================================
# Session Timer Management
# =============================================================================


async def _run_session_timer(session_id: str, duration_minutes: int) -> None:
    duration_seconds = max(duration_minutes, 0) * 60

    while True:
        state = SESSION_TIMER_STATE.get(session_id)
        if not state:
            return

        if state.paused_at is None:
            elapsed = state.elapsed_seconds()
            remaining = max(duration_seconds - int(elapsed), 0)

            percent_complete = 0
            if duration_seconds > 0:
                percent_complete = min(
                    int((elapsed / duration_seconds) * 100), 100
                )

            minutes = remaining // 60
            seconds = remaining % 60

            await broadcast_session_event(
                session_id,
                "time_remaining",
                {
                    "minutes": minutes,
                    "seconds": seconds,
                    "totalSecondsRemaining": remaining,
                    "percentComplete": percent_complete,
                },
            )

            balance_snapshot = get_balance_snapshot(session_id)
            if balance_snapshot and balance_snapshot.get("status") != "waiting_for_speakers":
                await broadcast_session_event(
                    session_id,
                    "balance_update",
                    balance_snapshot,
                )

            engine = SESSION_INTERVENTION_ENGINES.get(session_id)
            if engine:
                session = get_session(session_id)
                session_goal = session.goal if session else ""
                balance_result = None
                balance_status = "balanced"

                tracker = SESSION_BALANCE_TRACKERS.get(session_id)
                if tracker:
                    if balance_snapshot and balance_snapshot.get("status") != "waiting_for_speakers":
                        balance_result = {
                            **balance_snapshot,
                            "quiet_speaker": tracker.get_quiet_speaker(),
                            "dominant_speaker": tracker.get_dominant_speaker(),
                        }

                    trigger = tracker.check_intervention_trigger()
                    if trigger == "balance":
                        balance_status = "mild_imbalance"
                    elif trigger == "severe_balance":
                        balance_status = "severe_imbalance"

                silence_duration = None
                if not is_anyone_speaking(session_id):
                    last_spoke_at = get_last_speech_at(session_id)
                    if last_spoke_at:
                        silence_duration = datetime.utcnow() - last_spoke_at

                intervention = engine.evaluate(
                    balance_status=balance_status,
                    balance_result=balance_result,
                    silence_duration=silence_duration,
                    tension_score=0.0,
                    is_on_goal=True,
                    session_goal=session_goal,
                )
                if intervention:
                    await broadcast_session_event(
                        session_id, "intervention", intervention.to_dict()
                    )
                    if tracker and intervention.type == InterventionType.BALANCE:
                        tracker.reset_intervention_timers()

            if remaining <= 0:
                return

        await asyncio.sleep(1)


def _cancel_session_timer(session_id: str) -> None:
    task = SESSION_TIMER_TASKS.pop(session_id, None)
    if task and not task.done():
        task.cancel()


def start_session_timer(session_id: str, duration_minutes: int) -> None:
    _cancel_session_timer(session_id)
    SESSION_TIMER_STATE[session_id] = SessionTimerState(started_at=datetime.utcnow())
    SESSION_TIMER_TASKS[session_id] = asyncio.create_task(
        _run_session_timer(session_id, duration_minutes)
    )


def pause_session_timer(session_id: str) -> None:
    state = SESSION_TIMER_STATE.get(session_id)
    if state:
        state.pause()
    engine = SESSION_INTERVENTION_ENGINES.get(session_id)
    if engine:
        engine.pause()


def resume_session_timer(session_id: str) -> None:
    state = SESSION_TIMER_STATE.get(session_id)
    if state:
        state.resume()
    engine = SESSION_INTERVENTION_ENGINES.get(session_id)
    if engine:
        engine.resume()


def stop_session_timer(session_id: str) -> None:
    _cancel_session_timer(session_id)
    SESSION_TIMER_STATE.pop(session_id, None)


def start_intervention_engine(session: Session) -> None:
    engine = InterventionEngine(
        session_id=session.id,
        session_start=datetime.utcnow(),
        session_duration_minutes=session.duration_minutes,
        facilitator_config={
            "interrupt_authority": session.facilitator.interrupt_authority,
            "direct_inquiry": session.facilitator.direct_inquiry,
            "silence_detection": session.facilitator.silence_detection,
        },
    )
    engine.set_participant_names({p.id: p.name for p in session.participants})
    SESSION_INTERVENTION_ENGINES[session.id] = engine


def stop_intervention_engine(session_id: str) -> None:
    SESSION_INTERVENTION_ENGINES.pop(session_id, None)


def get_intervention_history(session_id: str) -> Optional[List[Dict[str, Any]]]:
    """Return intervention history for a session if available."""
    engine = SESSION_INTERVENTION_ENGINES.get(session_id)
    if not engine:
        return None
    return engine.get_history()


def start_balance_tracker(session: Session) -> None:
    """Initialize talk balance tracking for a session."""
    SESSION_BALANCE_TRACKERS[session.id] = BalanceTracker(session.id)
    SESSION_SPEAKER_MAPS[session.id] = {}
    SESSION_LAST_SPEECH_AT[session.id] = datetime.utcnow()
    SESSION_IS_SPEAKING[session.id] = False


def stop_balance_tracker(session_id: str) -> None:
    """Stop and clean up balance tracking state."""
    SESSION_BALANCE_TRACKERS.pop(session_id, None)
    SESSION_SPEAKER_MAPS.pop(session_id, None)
    SESSION_LAST_SPEECH_AT.pop(session_id, None)
    SESSION_IS_SPEAKING.pop(session_id, None)


def get_balance_tracker(session_id: str) -> Optional[BalanceTracker]:
    """Return the BalanceTracker for a session if available."""
    return SESSION_BALANCE_TRACKERS.get(session_id)


def get_last_speech_at(session_id: str) -> Optional[datetime]:
    """Return the last time a participant spoke in the session."""
    return SESSION_LAST_SPEECH_AT.get(session_id)


def _resolve_speaker_id(session_id: str, speaker_label: str) -> Optional[str]:
    mapping = SESSION_SPEAKER_MAPS.setdefault(session_id, {})
    if speaker_label in mapping:
        return mapping[speaker_label]

    session = get_session(session_id)
    if not session:
        return None

    assigned = set(mapping.values())
    for participant in session.participants:
        if participant.id not in assigned:
            mapping[speaker_label] = participant.id
            return participant.id

    if session.participants:
        mapping[speaker_label] = session.participants[0].id
        return mapping[speaker_label]

    return None


def record_speaker_activity(
    session_id: str, speaker_label: str, is_speaking: bool
) -> Optional[BalanceTracker]:
    """Update balance tracker with per-speaker activity."""
    tracker = SESSION_BALANCE_TRACKERS.get(session_id)
    if not tracker:
        return None

    participant_id = _resolve_speaker_id(session_id, speaker_label)
    if not participant_id:
        return None

    tracker.update_speaker(participant_id, is_speaking)
    if is_speaking:
        SESSION_LAST_SPEECH_AT[session_id] = datetime.utcnow()

    SESSION_IS_SPEAKING[session_id] = any(
        metrics.is_speaking for metrics in tracker.speakers.values()
    )

    return tracker


def record_speech_activity(session_id: str, is_speaking: bool) -> None:
    """Track generic speech activity for silence detection."""
    SESSION_IS_SPEAKING[session_id] = is_speaking
    if is_speaking:
        SESSION_LAST_SPEECH_AT[session_id] = datetime.utcnow()


def record_speaker_durations(
    session_id: str, durations_ms: Dict[str, int]
) -> Optional[BalanceTracker]:
    """Update balance tracker with diarized speaker durations."""
    tracker = SESSION_BALANCE_TRACKERS.get(session_id)
    if not tracker:
        return None

    updated = False
    for speaker_label, duration_ms in durations_ms.items():
        participant_id = _resolve_speaker_id(session_id, str(speaker_label))
        if not participant_id:
            continue
        tracker.add_speaking_duration(participant_id, duration_ms)
        updated = True

    if updated:
        SESSION_LAST_SPEECH_AT[session_id] = datetime.utcnow()

    return tracker


def is_anyone_speaking(session_id: str) -> bool:
    """Return True if anyone is currently speaking in the session."""
    return SESSION_IS_SPEAKING.get(session_id, False)


def get_balance_snapshot(session_id: str) -> Optional[Dict[str, Any]]:
    """Return the latest balance snapshot with participant names."""
    tracker = SESSION_BALANCE_TRACKERS.get(session_id)
    session = get_session(session_id)
    if not tracker or not session:
        return None

    balance = tracker.get_balance()
    if balance.waiting_for_speakers:
        return {"status": "waiting_for_speakers"}

    names = {p.id: p.name for p in session.participants}
    payload = balance.to_dict()
    payload["participantA"]["name"] = names.get(
        balance.participant_a_id, "Participant A"
    )
    payload["participantB"]["name"] = names.get(
        balance.participant_b_id, "Participant B"
    )
    return payload


def store_balance_metrics(session_id: str, metrics: Dict[str, Any]) -> None:
    """Persist final balance metrics for summaries."""
    SESSION_BALANCE_METRICS[session_id] = metrics


def get_balance_metrics(session_id: str) -> Optional[Dict[str, Any]]:
    """Return persisted balance metrics if available."""
    return SESSION_BALANCE_METRICS.get(session_id)


# =============================================================================
# WebSocket Event Connection Management
# =============================================================================


def register_event_connection(session_id: str, websocket: WebSocket) -> None:
    """Register a WebSocket connection for session events.

    Args:
        session_id: The session identifier.
        websocket: The WebSocket connection to register.
    """
    if session_id not in SESSION_EVENTS:
        SESSION_EVENTS[session_id] = []
    SESSION_EVENTS[session_id].append(websocket)


def unregister_event_connection(session_id: str, websocket: WebSocket) -> None:
    """Unregister a WebSocket connection from session events.

    Args:
        session_id: The session identifier.
        websocket: The WebSocket connection to unregister.
    """
    if session_id in SESSION_EVENTS:
        try:
            SESSION_EVENTS[session_id].remove(websocket)
        except ValueError:
            pass  # WebSocket not in list


def get_event_connections(session_id: str) -> List[WebSocket]:
    """Get all WebSocket connections for a session.

    Args:
        session_id: The session identifier.

    Returns:
        List of WebSocket connections for the session.
    """
    return SESSION_EVENTS.get(session_id, [])


async def broadcast_session_event(
    session_id: str, event_type: str, data: dict
) -> None:
    """Broadcast an event to all connected clients for a session.

    Args:
        session_id: The session identifier.
        event_type: The type of event (e.g., "session_state", "balance_update").
        data: The event data to broadcast.
    """
    from datetime import datetime

    connections = get_event_connections(session_id)
    event = {
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }
    for ws in connections:
        try:
            await ws.send_json(event)
        except Exception:
            # Connection closed, will be cleaned up on disconnect
            pass


# =============================================================================
# Session Summary Storage
# =============================================================================


def store_summary(session_id: str, summary: SessionSummary) -> SessionSummary:
    """Store a session summary.

    Args:
        session_id: The session identifier.
        summary: The SessionSummary object to store.

    Returns:
        The stored SessionSummary object.
    """
    SESSION_SUMMARIES[session_id] = summary
    return summary


def get_summary(session_id: str) -> Optional[SessionSummary]:
    """Retrieve a session summary by session ID.

    Args:
        session_id: The session identifier.

    Returns:
        The SessionSummary object if found, None otherwise.
    """
    return SESSION_SUMMARIES.get(session_id)


def delete_summary(session_id: str) -> bool:
    """Delete a session summary by session ID.

    Args:
        session_id: The session identifier.

    Returns:
        True if the summary was deleted, False if not found.
    """
    if session_id in SESSION_SUMMARIES:
        del SESSION_SUMMARIES[session_id]
        return True
    return False
