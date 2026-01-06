"""In-memory session storage for Diadi sessions.

This module provides in-memory storage for session data during Alpha.
Future: Replace with database (Postgres, Redis) for persistence.
"""

from typing import Dict, List, Optional
from fastapi import WebSocket

from app.models import Session, SessionStatus, SessionSummary


# =============================================================================
# Global Session Storage
# =============================================================================

# Main session storage: session_id -> Session
SESSION_STORE: Dict[str, Session] = {}

# Session summaries: session_id -> SessionSummary
SESSION_SUMMARIES: Dict[str, SessionSummary] = {}

# WebSocket connections for session events: session_id -> list of WebSockets
SESSION_EVENTS: Dict[str, List[WebSocket]] = {}

# Invite token lookup: invite_token -> session_id
INVITE_TOKEN_INDEX: Dict[str, str] = {}


# =============================================================================
# Helper Functions
# =============================================================================


def get_session(session_id: str) -> Optional[Session]:
    """Get a session by ID.

    Args:
        session_id: The session identifier.

    Returns:
        The Session object if found, None otherwise.
    """
    return SESSION_STORE.get(session_id)


def get_session_by_invite_token(invite_token: str) -> Optional[Session]:
    """Get a session by its invite token.

    Args:
        invite_token: The invitation token.

    Returns:
        The Session object if found, None otherwise.
    """
    session_id = INVITE_TOKEN_INDEX.get(invite_token)
    if session_id:
        return SESSION_STORE.get(session_id)
    return None


def save_session(session: Session) -> None:
    """Save or update a session.

    Args:
        session: The Session object to save.
    """
    SESSION_STORE[session.id] = session
    # Update invite token index
    if session.invite_token:
        INVITE_TOKEN_INDEX[session.invite_token] = session.id


def delete_session(session_id: str) -> bool:
    """Delete a session.

    Args:
        session_id: The session identifier.

    Returns:
        True if the session was deleted, False if not found.
    """
    session = SESSION_STORE.pop(session_id, None)
    if session:
        # Clean up invite token index
        if session.invite_token:
            INVITE_TOKEN_INDEX.pop(session.invite_token, None)
        # Clean up summary
        SESSION_SUMMARIES.pop(session_id, None)
        # Clean up event connections
        SESSION_EVENTS.pop(session_id, None)
        return True
    return False


def list_sessions(
    status: Optional[SessionStatus] = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[List[Session], int]:
    """List sessions with optional filtering.

    Args:
        status: Optional status filter.
        limit: Maximum number of sessions to return.
        offset: Number of sessions to skip.

    Returns:
        Tuple of (list of sessions, total count).
    """
    sessions = list(SESSION_STORE.values())

    # Filter by status if provided
    if status:
        sessions = [s for s in sessions if s.status == status]

    # Sort by created_at descending (newest first)
    sessions.sort(key=lambda s: s.created_at, reverse=True)

    total = len(sessions)
    paginated = sessions[offset : offset + limit]

    return paginated, total


def get_session_summary(session_id: str) -> Optional[SessionSummary]:
    """Get the summary for a session.

    Args:
        session_id: The session identifier.

    Returns:
        The SessionSummary if available, None otherwise.
    """
    return SESSION_SUMMARIES.get(session_id)


def save_session_summary(summary: SessionSummary) -> None:
    """Save a session summary.

    Args:
        summary: The SessionSummary to save.
    """
    SESSION_SUMMARIES[summary.session_id] = summary


def register_event_connection(session_id: str, websocket: WebSocket) -> None:
    """Register a WebSocket connection for session events.

    Args:
        session_id: The session identifier.
        websocket: The WebSocket connection.
    """
    if session_id not in SESSION_EVENTS:
        SESSION_EVENTS[session_id] = []
    SESSION_EVENTS[session_id].append(websocket)


def unregister_event_connection(session_id: str, websocket: WebSocket) -> None:
    """Unregister a WebSocket connection for session events.

    Args:
        session_id: The session identifier.
        websocket: The WebSocket connection.
    """
    if session_id in SESSION_EVENTS:
        try:
            SESSION_EVENTS[session_id].remove(websocket)
        except ValueError:
            pass  # Already removed


def get_event_connections(session_id: str) -> List[WebSocket]:
    """Get all WebSocket connections for a session.

    Args:
        session_id: The session identifier.

    Returns:
        List of WebSocket connections.
    """
    return SESSION_EVENTS.get(session_id, [])
