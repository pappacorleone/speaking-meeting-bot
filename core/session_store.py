"""Session storage for Diadi facilitation sessions.

In-memory session storage for the Alpha release.
Future: Replace with database (PostgreSQL, Redis).
"""

from typing import Dict, List, Optional

from fastapi import WebSocket

from app.models import Session, SessionSummary

# In-memory session storage (Alpha)
# Maps session_id -> Session object
SESSION_STORE: Dict[str, Session] = {}

# Session events for WebSocket broadcast
# Maps session_id -> list of connected WebSockets
SESSION_EVENTS: Dict[str, List[WebSocket]] = {}

# Session summaries storage (Alpha)
# Maps session_id -> SessionSummary object
SESSION_SUMMARIES: Dict[str, SessionSummary] = {}


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
