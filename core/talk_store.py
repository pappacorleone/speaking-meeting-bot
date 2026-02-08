"""Talk storage for Diadi facilitation talks.

Hybrid storage: in-memory dicts for active runtime state (timers, trackers,
WebSocket connections) and SQLite for persistent talk/summary data.
"""

import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import WebSocket
from loguru import logger

from app.models import Talk, TalkSummary
from core.balance_tracker import BalanceTracker
from core.intervention_engine import InterventionEngine, InterventionType

# In-memory talk storage (Alpha)
# Maps talk_id -> Talk object
TALK_STORE: Dict[str, Talk] = {}

# Talk events for WebSocket broadcast
# Maps talk_id -> list of connected WebSockets
TALK_EVENTS: Dict[str, List[WebSocket]] = {}

# Talk summaries storage (Alpha)
# Maps talk_id -> TalkSummary object
TALK_SUMMARIES: Dict[str, TalkSummary] = {}

# Talk runtime timers
@dataclass
class TalkTimerState:
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


TALK_TIMER_STATE: Dict[str, TalkTimerState] = {}
TALK_TIMER_TASKS: Dict[str, asyncio.Task] = {}
TALK_INTERVENTION_ENGINES: Dict[str, InterventionEngine] = {}
TALK_BALANCE_TRACKERS: Dict[str, BalanceTracker] = {}
TALK_SPEAKER_MAPS: Dict[str, Dict[str, str]] = {}
TALK_LAST_SPEECH_AT: Dict[str, datetime] = {}
TALK_IS_SPEAKING: Dict[str, bool] = {}
TALK_BALANCE_METRICS: Dict[str, Dict[str, Any]] = {}


# =============================================================================
# Helper Functions for Talk CRUD Operations
# =============================================================================


def get_talk(talk_id: str) -> Optional[Talk]:
    """Retrieve a talk by ID. Checks in-memory first, then SQLite."""
    talk = TALK_STORE.get(talk_id)
    if talk:
        return talk
    # Fall back to database for historical talks
    try:
        import asyncio

        from core.database import load_talk

        loop = asyncio.get_event_loop()
        if loop.is_running():
            # We're inside an async context but called synchronously.
            # Return None here; callers in async routes should use get_talk_async.
            return None
        data = loop.run_until_complete(load_talk(talk_id))
        if data:
            return Talk.model_validate_json(data)
    except Exception:
        pass
    return None


async def get_talk_async(talk_id: str) -> Optional[Talk]:
    """Async version of get_talk. Checks in-memory first, then SQLite."""
    talk = TALK_STORE.get(talk_id)
    if talk:
        return talk
    try:
        from core.database import load_talk

        data = await load_talk(talk_id)
        if data:
            return Talk.model_validate_json(data)
    except Exception:
        pass
    return None


def get_talk_by_invite_token(invite_token: str) -> Optional[Talk]:
    """Retrieve a talk by its invite token (in-memory only for active talks)."""
    for talk in TALK_STORE.values():
        if talk.invite_token == invite_token:
            return talk
    return None


def get_talk_by_client_id(client_id: str) -> Optional[Talk]:
    """Retrieve a talk by its Pipecat client ID (in-memory only)."""
    for talk in TALK_STORE.values():
        if talk.client_id == client_id:
            return talk
    return None


def create_talk(talk: Talk) -> Talk:
    """Store a new talk in memory and persist to SQLite."""
    TALK_STORE[talk.id] = talk
    _persist_talk_async(talk)
    return talk


def update_talk(talk_id: str, talk: Talk) -> Optional[Talk]:
    """Update a talk in memory and persist to SQLite."""
    TALK_STORE[talk_id] = talk
    _persist_talk_async(talk)
    return talk


def delete_talk(talk_id: str) -> bool:
    """Delete a talk from memory and SQLite."""
    if talk_id in TALK_STORE:
        del TALK_STORE[talk_id]
        stop_talk_timer(talk_id)
        stop_balance_tracker(talk_id)
        TALK_BALANCE_METRICS.pop(talk_id, None)
        if talk_id in TALK_EVENTS:
            del TALK_EVENTS[talk_id]
        if talk_id in TALK_SUMMARIES:
            del TALK_SUMMARIES[talk_id]
        # Also delete from database
        try:
            import asyncio

            from core.database import delete_talk_from_db

            asyncio.ensure_future(delete_talk_from_db(talk_id))
        except Exception:
            pass
        return True
    return False


async def list_talks_async(
    owner_session_id: Optional[str] = None,
    status: Optional[str] = None,
) -> List[Talk]:
    """List talks from SQLite, filtered by owner and/or status.

    Falls back to in-memory if database is not available.
    """
    try:
        from core.database import load_talks_for_owner

        if owner_session_id:
            rows = await load_talks_for_owner(owner_session_id)
            talks = [Talk.model_validate_json(r) for r in rows]
        else:
            # No owner filter — return in-memory talks
            talks = list(TALK_STORE.values())
    except Exception:
        talks = list(TALK_STORE.values())

    if status:
        talks = [t for t in talks if t.status.value == status]
    talks.sort(key=lambda t: t.created_at, reverse=True)
    return talks


def list_talks(status: Optional[str] = None) -> List[Talk]:
    """Synchronous list of in-memory talks (legacy compatibility)."""
    talks = list(TALK_STORE.values())
    if status:
        talks = [t for t in talks if t.status.value == status]
    talks.sort(key=lambda t: t.created_at, reverse=True)
    return talks


def _persist_talk_async(talk: Talk) -> None:
    """Fire-and-forget persist a talk to SQLite."""
    try:
        import asyncio

        from core.database import persist_talk

        owner = talk.owner_session_id or ""
        asyncio.ensure_future(persist_talk(talk.id, owner, talk.model_dump_json()))
    except Exception as e:
        logger.debug(f"Failed to persist talk {talk.id}: {e}")


# =============================================================================
# Talk Timer Management
# =============================================================================


async def _run_talk_timer(talk_id: str, duration_minutes: int) -> None:
    duration_seconds = max(duration_minutes, 0) * 60

    while True:
        state = TALK_TIMER_STATE.get(talk_id)
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

            await broadcast_talk_event(
                talk_id,
                "time_remaining",
                {
                    "minutes": minutes,
                    "seconds": seconds,
                    "totalSecondsRemaining": remaining,
                    "percentComplete": percent_complete,
                },
            )

            balance_snapshot = get_balance_snapshot(talk_id)
            if balance_snapshot and balance_snapshot.get("status") != "waiting_for_speakers":
                await broadcast_talk_event(
                    talk_id,
                    "balance_update",
                    balance_snapshot,
                )

            engine = TALK_INTERVENTION_ENGINES.get(talk_id)
            if engine:
                talk = get_talk(talk_id)
                talk_goal = talk.goal if talk else ""
                balance_result = None
                balance_status = "balanced"

                tracker = TALK_BALANCE_TRACKERS.get(talk_id)
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
                if not is_anyone_speaking(talk_id):
                    last_spoke_at = get_last_speech_at(talk_id)
                    if last_spoke_at:
                        silence_duration = datetime.utcnow() - last_spoke_at

                intervention = engine.evaluate(
                    balance_status=balance_status,
                    balance_result=balance_result,
                    silence_duration=silence_duration,
                    tension_score=0.0,
                    is_on_goal=True,
                    session_goal=talk_goal,
                )
                if intervention:
                    await broadcast_talk_event(
                        talk_id, "intervention", intervention.to_dict()
                    )
                    if tracker and intervention.type == InterventionType.BALANCE:
                        tracker.reset_intervention_timers()

            if remaining <= 0:
                return

        await asyncio.sleep(1)


def _cancel_talk_timer(talk_id: str) -> None:
    task = TALK_TIMER_TASKS.pop(talk_id, None)
    if task and not task.done():
        task.cancel()


def start_talk_timer(talk_id: str, duration_minutes: int) -> None:
    _cancel_talk_timer(talk_id)
    TALK_TIMER_STATE[talk_id] = TalkTimerState(started_at=datetime.utcnow())
    TALK_TIMER_TASKS[talk_id] = asyncio.create_task(
        _run_talk_timer(talk_id, duration_minutes)
    )


def pause_talk_timer(talk_id: str) -> None:
    state = TALK_TIMER_STATE.get(talk_id)
    if state:
        state.pause()
    engine = TALK_INTERVENTION_ENGINES.get(talk_id)
    if engine:
        engine.pause()


def resume_talk_timer(talk_id: str) -> None:
    state = TALK_TIMER_STATE.get(talk_id)
    if state:
        state.resume()
    engine = TALK_INTERVENTION_ENGINES.get(talk_id)
    if engine:
        engine.resume()


def stop_talk_timer(talk_id: str) -> None:
    _cancel_talk_timer(talk_id)
    TALK_TIMER_STATE.pop(talk_id, None)


def start_intervention_engine(talk: Talk) -> None:
    engine = InterventionEngine(
        talk_id=talk.id,
        talk_start=datetime.utcnow(),
        talk_duration_minutes=talk.duration_minutes,
        facilitator_config={
            "interrupt_authority": talk.facilitator.interrupt_authority,
            "direct_inquiry": talk.facilitator.direct_inquiry,
            "silence_detection": talk.facilitator.silence_detection,
        },
    )
    engine.set_participant_names({p.id: p.name for p in talk.participants})
    TALK_INTERVENTION_ENGINES[talk.id] = engine


def stop_intervention_engine(talk_id: str) -> None:
    TALK_INTERVENTION_ENGINES.pop(talk_id, None)


def get_intervention_history(talk_id: str) -> Optional[List[Dict[str, Any]]]:
    """Return intervention history for a talk if available."""
    engine = TALK_INTERVENTION_ENGINES.get(talk_id)
    if not engine:
        return None
    return engine.get_history()


def start_balance_tracker(talk: Talk) -> None:
    """Initialize talk balance tracking for a talk."""
    TALK_BALANCE_TRACKERS[talk.id] = BalanceTracker(talk.id)
    TALK_SPEAKER_MAPS[talk.id] = {}
    TALK_LAST_SPEECH_AT[talk.id] = datetime.utcnow()
    TALK_IS_SPEAKING[talk.id] = False


def stop_balance_tracker(talk_id: str) -> None:
    """Stop and clean up balance tracking state."""
    TALK_BALANCE_TRACKERS.pop(talk_id, None)
    TALK_SPEAKER_MAPS.pop(talk_id, None)
    TALK_LAST_SPEECH_AT.pop(talk_id, None)
    TALK_IS_SPEAKING.pop(talk_id, None)


def get_balance_tracker(talk_id: str) -> Optional[BalanceTracker]:
    """Return the BalanceTracker for a talk if available."""
    return TALK_BALANCE_TRACKERS.get(talk_id)


def get_last_speech_at(talk_id: str) -> Optional[datetime]:
    """Return the last time a participant spoke in the talk."""
    return TALK_LAST_SPEECH_AT.get(talk_id)


def _resolve_speaker_id(talk_id: str, speaker_label: str) -> Optional[str]:
    mapping = TALK_SPEAKER_MAPS.setdefault(talk_id, {})
    if speaker_label in mapping:
        return mapping[speaker_label]

    talk = get_talk(talk_id)
    if not talk:
        return None

    assigned = set(mapping.values())
    for participant in talk.participants:
        if participant.id not in assigned:
            mapping[speaker_label] = participant.id
            return participant.id

    if talk.participants:
        mapping[speaker_label] = talk.participants[0].id
        return mapping[speaker_label]

    return None


def record_speaker_activity(
    talk_id: str, speaker_label: str, is_speaking: bool
) -> Optional[BalanceTracker]:
    """Update balance tracker with per-speaker activity."""
    tracker = TALK_BALANCE_TRACKERS.get(talk_id)
    if not tracker:
        return None

    participant_id = _resolve_speaker_id(talk_id, speaker_label)
    if not participant_id:
        return None

    tracker.update_speaker(participant_id, is_speaking)
    if is_speaking:
        TALK_LAST_SPEECH_AT[talk_id] = datetime.utcnow()

    TALK_IS_SPEAKING[talk_id] = any(
        metrics.is_speaking for metrics in tracker.speakers.values()
    )

    return tracker


def record_speech_activity(talk_id: str, is_speaking: bool) -> None:
    """Track generic speech activity for silence detection."""
    TALK_IS_SPEAKING[talk_id] = is_speaking
    if is_speaking:
        TALK_LAST_SPEECH_AT[talk_id] = datetime.utcnow()


def record_speaker_durations(
    talk_id: str, durations_ms: Dict[str, int]
) -> Optional[BalanceTracker]:
    """Update balance tracker with diarized speaker durations."""
    tracker = TALK_BALANCE_TRACKERS.get(talk_id)
    if not tracker:
        return None

    updated = False
    for speaker_label, duration_ms in durations_ms.items():
        participant_id = _resolve_speaker_id(talk_id, str(speaker_label))
        if not participant_id:
            continue
        tracker.add_speaking_duration(participant_id, duration_ms)
        updated = True

    if updated:
        TALK_LAST_SPEECH_AT[talk_id] = datetime.utcnow()

    return tracker


def is_anyone_speaking(talk_id: str) -> bool:
    """Return True if anyone is currently speaking in the talk."""
    return TALK_IS_SPEAKING.get(talk_id, False)


def get_balance_snapshot(talk_id: str) -> Optional[Dict[str, Any]]:
    """Return the latest balance snapshot with participant names."""
    tracker = TALK_BALANCE_TRACKERS.get(talk_id)
    talk = get_talk(talk_id)
    if not tracker or not talk:
        return None

    balance = tracker.get_balance()
    if balance.waiting_for_speakers:
        return {"status": "waiting_for_speakers"}

    names = {p.id: p.name for p in talk.participants}
    payload = balance.to_dict()
    payload["participantA"]["name"] = names.get(
        balance.participant_a_id, "Participant A"
    )
    payload["participantB"]["name"] = names.get(
        balance.participant_b_id, "Participant B"
    )
    return payload


def store_balance_metrics(talk_id: str, metrics: Dict[str, Any]) -> None:
    """Persist final balance metrics for summaries."""
    TALK_BALANCE_METRICS[talk_id] = metrics


def get_balance_metrics(talk_id: str) -> Optional[Dict[str, Any]]:
    """Return persisted balance metrics if available."""
    return TALK_BALANCE_METRICS.get(talk_id)


# =============================================================================
# WebSocket Event Connection Management
# =============================================================================


def register_event_connection(talk_id: str, websocket: WebSocket) -> None:
    """Register a WebSocket connection for talk events.

    Args:
        talk_id: The talk identifier.
        websocket: The WebSocket connection to register.
    """
    if talk_id not in TALK_EVENTS:
        TALK_EVENTS[talk_id] = []
    TALK_EVENTS[talk_id].append(websocket)


def unregister_event_connection(talk_id: str, websocket: WebSocket) -> None:
    """Unregister a WebSocket connection from talk events.

    Args:
        talk_id: The talk identifier.
        websocket: The WebSocket connection to unregister.
    """
    if talk_id in TALK_EVENTS:
        try:
            TALK_EVENTS[talk_id].remove(websocket)
        except ValueError:
            pass  # WebSocket not in list


def get_event_connections(talk_id: str) -> List[WebSocket]:
    """Get all WebSocket connections for a talk.

    Args:
        talk_id: The talk identifier.

    Returns:
        List of WebSocket connections for the talk.
    """
    return TALK_EVENTS.get(talk_id, [])


async def broadcast_talk_event(
    talk_id: str, event_type: str, data: dict
) -> None:
    """Broadcast an event to all connected clients for a talk.

    Args:
        talk_id: The talk identifier.
        event_type: The type of event (e.g., "session_state", "balance_update").
        data: The event data to broadcast.
    """
    from datetime import datetime

    connections = get_event_connections(talk_id)
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


async def close_event_connections(talk_id: str) -> None:
    """Close all event WebSocket connections for a talk.

    This should be called after a talk ends to properly close all
    WebSocket connections with code 1000, preventing reconnection attempts.

    Args:
        talk_id: The talk identifier.
    """
    connections = TALK_EVENTS.pop(talk_id, [])
    for ws in connections:
        try:
            await ws.close(code=1000, reason="Talk ended")
        except Exception:
            pass  # Connection already closed


# =============================================================================
# Talk Summary Storage
# =============================================================================


def store_summary(talk_id: str, summary: TalkSummary) -> TalkSummary:
    """Store a talk summary in memory and persist to SQLite."""
    TALK_SUMMARIES[talk_id] = summary
    try:
        import asyncio

        from core.database import persist_talk_summary

        asyncio.ensure_future(persist_talk_summary(talk_id, summary.model_dump_json()))
    except Exception as e:
        logger.debug(f"Failed to persist summary for talk {talk_id}: {e}")
    return summary


def get_summary(talk_id: str) -> Optional[TalkSummary]:
    """Retrieve a talk summary. Checks in-memory first, then SQLite."""
    summary = TALK_SUMMARIES.get(talk_id)
    if summary:
        return summary
    # Fall back to database
    try:
        import asyncio

        from core.database import load_talk_summary

        loop = asyncio.get_event_loop()
        if loop.is_running():
            return None
        data = loop.run_until_complete(load_talk_summary(talk_id))
        if data:
            return TalkSummary.model_validate_json(data)
    except Exception:
        pass
    return None


async def get_summary_async(talk_id: str) -> Optional[TalkSummary]:
    """Async version of get_summary."""
    summary = TALK_SUMMARIES.get(talk_id)
    if summary:
        return summary
    try:
        from core.database import load_talk_summary

        data = await load_talk_summary(talk_id)
        if data:
            return TalkSummary.model_validate_json(data)
    except Exception:
        pass
    return None


def delete_summary(talk_id: str) -> bool:
    """Delete a talk summary by talk ID.

    Args:
        talk_id: The talk identifier.

    Returns:
        True if the summary was deleted, False if not found.
    """
    if talk_id in TALK_SUMMARIES:
        del TALK_SUMMARIES[talk_id]
        return True
    return False
