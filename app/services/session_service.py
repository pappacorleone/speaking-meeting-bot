"""Session service for Diadi facilitation sessions.

Handles session lifecycle, state transitions, and business logic.
"""

import secrets
from datetime import datetime
from typing import Dict, List, Optional

from loguru import logger

from app.models import (
    FacilitatorConfig,
    Participant,
    Platform,
    Session,
    SessionStatus,
)
from core.session_store import (
    create_session as store_create_session,
    get_session as store_get_session,
    get_session_by_invite_token as store_get_session_by_token,
    list_sessions as store_list_sessions,
    update_session as store_update_session,
)


class SessionService:
    """Manages session lifecycle and state transitions."""

    async def create_session(
        self,
        creator_name: str,
        partner_name: str,
        goal: str,
        relationship_context: str,
        facilitator_config: Optional[FacilitatorConfig] = None,
        duration_minutes: int = 30,
        platform: Platform = Platform.MEET,
        scheduled_at: Optional[str] = None,
    ) -> Session:
        """Create a new session in draft status.

        Args:
            creator_name: Name of the session creator.
            partner_name: Name of the invited partner.
            goal: The session goal (max 200 chars).
            relationship_context: Context about the relationship.
            facilitator_config: Optional facilitator configuration.
            duration_minutes: Session duration in minutes.
            platform: Meeting platform to use.
            scheduled_at: Optional scheduled time (ISO format).

        Returns:
            The created Session object.
        """
        session_id = secrets.token_urlsafe(16)
        invite_token = secrets.token_urlsafe(32)
        creator_id = secrets.token_urlsafe(8)

        if facilitator_config is None:
            facilitator_config = FacilitatorConfig()

        session = Session(
            id=session_id,
            title=f"Session with {partner_name}",
            goal=goal,
            relationship_context=relationship_context,
            platform=platform,
            duration_minutes=duration_minutes,
            scheduled_at=scheduled_at,
            status=SessionStatus.PENDING_CONSENT,
            participants=[
                Participant(
                    id=creator_id,
                    name=creator_name,
                    role="creator",
                    consented=True,  # Creator implicitly consents
                )
            ],
            facilitator=facilitator_config,
            created_at=datetime.utcnow().isoformat(),
            invite_token=invite_token,
        )

        store_create_session(session)
        logger.info(f"Created session {session_id} for {creator_name}")

        return session

    def get_session(self, session_id: str) -> Optional[Session]:
        """Retrieve a session by ID.

        Args:
            session_id: The unique session identifier.

        Returns:
            The Session object if found, None otherwise.
        """
        return store_get_session(session_id)

    def get_session_by_invite_token(self, invite_token: str) -> Optional[Session]:
        """Retrieve a session by its invite token.

        Args:
            invite_token: The unique invite token.

        Returns:
            The Session object if found, None otherwise.
        """
        return store_get_session_by_token(invite_token)

    def list_sessions(self, status: Optional[str] = None) -> List[Session]:
        """List all sessions, optionally filtered by status.

        Args:
            status: Optional status filter (e.g., "draft", "in_progress").

        Returns:
            List of Session objects matching the filter.
        """
        return store_list_sessions(status)

    async def record_consent(
        self,
        session_id: str,
        invite_token: str,
        invitee_name: str,
        consented: bool,
    ) -> Session:
        """Record partner consent and transition status if both consented.

        Args:
            session_id: The session identifier.
            invite_token: The invite token for verification.
            invitee_name: Name of the invitee.
            consented: Whether the invitee consented.

        Returns:
            The updated Session object.

        Raises:
            ValueError: If session not found or invalid token.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        if session.invite_token != invite_token:
            raise ValueError("Invalid invite token")

        if consented:
            invitee_id = secrets.token_urlsafe(8)
            session.participants.append(
                Participant(
                    id=invitee_id,
                    name=invitee_name,
                    role="invitee",
                    consented=True,
                )
            )
            # Check if both consented
            if all(p.consented for p in session.participants):
                session.status = SessionStatus.READY
                logger.info(f"Session {session_id} is ready - both parties consented")
        else:
            # Decline is private - don't notify creator
            session.status = SessionStatus.ARCHIVED
            logger.info(f"Session {session_id} archived - partner declined")

        store_update_session(session_id, session)
        return session

    async def start_session(
        self,
        session_id: str,
        meeting_url: str,
    ) -> Dict:
        """Start the session: spawn Pipecat, call MeetingBaas.

        Args:
            session_id: The session identifier.
            meeting_url: The meeting platform URL.

        Returns:
            Dict with status, bot_id, client_id, and event_url.

        Raises:
            ValueError: If session not found or not ready.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        if session.status != SessionStatus.READY:
            raise ValueError(
                f"Session not ready to start (current status: {session.status.value})"
            )

        # TODO: Implement full start_session logic in Phase 5
        # - Load persona via PersonaManager
        # - Create MeetingBaas bot
        # - Start Pipecat process
        # - Update session with bot_id and client_id

        client_id = secrets.token_urlsafe(16)
        bot_id = f"placeholder_bot_{client_id}"

        session.status = SessionStatus.IN_PROGRESS
        session.meeting_url = meeting_url
        session.bot_id = bot_id
        session.client_id = client_id

        store_update_session(session_id, session)
        logger.info(f"Started session {session_id}")

        return {
            "status": session.status,
            "bot_id": bot_id,
            "client_id": client_id,
            "event_url": f"/sessions/{session_id}/events",
        }

    async def end_session(self, session_id: str) -> Session:
        """End the session, cleanup resources, generate summary.

        Args:
            session_id: The session identifier.

        Returns:
            The updated Session object.

        Raises:
            ValueError: If session not found.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # TODO: Implement full end_session logic in Phase 8
        # - Cleanup Pipecat process
        # - Call leave_meeting_bot via MeetingBaas API
        # - Trigger summary generation

        session.status = SessionStatus.ENDED
        store_update_session(session_id, session)
        logger.info(f"Ended session {session_id}")

        # Trigger summary generation (async)
        await self._generate_summary(session_id)

        return session

    async def pause_facilitation(self, session_id: str) -> Session:
        """Pause AI facilitation (kill switch).

        Args:
            session_id: The session identifier.

        Returns:
            The updated Session object.

        Raises:
            ValueError: If session not found.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        session.status = SessionStatus.PAUSED
        store_update_session(session_id, session)
        logger.info(f"Paused facilitation for session {session_id}")

        # TODO: Notify Pipecat to stop interventions
        await self._notify_pipecat(session.client_id, {"action": "pause"})

        return session

    async def resume_facilitation(self, session_id: str) -> Session:
        """Resume AI facilitation after pause.

        Args:
            session_id: The session identifier.

        Returns:
            The updated Session object.

        Raises:
            ValueError: If session not found.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        session.status = SessionStatus.IN_PROGRESS
        store_update_session(session_id, session)
        logger.info(f"Resumed facilitation for session {session_id}")

        # TODO: Notify Pipecat to resume interventions
        await self._notify_pipecat(session.client_id, {"action": "resume"})

        return session

    async def _generate_summary(self, session_id: str) -> bool:
        """Generate post-session summary using OpenAI.

        Args:
            session_id: The session identifier.

        Returns:
            True if summary was generated, False otherwise.
        """
        session = store_get_session(session_id)
        if not session:
            return False

        # TODO: Implement full summary generation in Phase 9
        # via app/services/summary_service.py
        logger.info(f"Summary generation placeholder for session {session_id}")

        return True

    async def _notify_pipecat(self, client_id: Optional[str], message: dict) -> None:
        """Send a control message to Pipecat process.

        Args:
            client_id: The client ID for the Pipecat connection.
            message: The message to send.
        """
        if not client_id:
            return
        # TODO: Implement WebSocket message to Pipecat
        logger.debug(f"Pipecat notification placeholder: {client_id} -> {message}")


# Create global service instance
session_service = SessionService()
