"""Session service for Diadi facilitation sessions.

This module provides business logic for managing session lifecycle,
including creation, consent, starting, pausing, and ending sessions.
"""

import secrets
from datetime import datetime
from typing import Optional, List

from loguru import logger

from app.models import (
    Session,
    SessionStatus,
    SessionSummary,
    Participant,
    FacilitatorConfig,
    Platform,
    TalkBalanceMetrics,
    CreateSessionRequest,
    CreateSessionResponse,
    ConsentRequest,
    ConsentResponse,
    StartSessionRequest,
    StartSessionResponse,
    EndSessionResponse,
)
from core.session_store import (
    get_session,
    get_session_by_invite_token,
    save_session,
    list_sessions as store_list_sessions,
    get_session_summary,
    save_session_summary,
)


class SessionService:
    """Manages Diadi session lifecycle and state transitions."""

    def __init__(self, base_url: str = "http://localhost:7014"):
        """Initialize the session service.

        Args:
            base_url: Base URL for generating invite links.
        """
        self.base_url = base_url

    async def create_session(
        self,
        request: CreateSessionRequest,
        creator_id: str = "",
        creator_name: str = "",
    ) -> CreateSessionResponse:
        """Create a new session in draft status.

        Args:
            request: The session creation request.
            creator_id: Optional ID of the creator (from auth).
            creator_name: Optional name of the creator (from auth).

        Returns:
            CreateSessionResponse with session ID and invite link.
        """
        session_id = secrets.token_urlsafe(16)
        invite_token = secrets.token_urlsafe(32)

        # Generate creator ID if not provided
        if not creator_id:
            creator_id = secrets.token_urlsafe(8)

        session = Session(
            id=session_id,
            goal=request.goal,
            relationship_context=request.relationship_context,
            partner_name=request.partner_name,
            platform=request.platform,
            duration_minutes=request.duration_minutes,
            scheduled_at=request.scheduled_at,
            status=SessionStatus.DRAFT,
            participants=[
                Participant(
                    id=creator_id,
                    name=creator_name or "Session Creator",
                    role="creator",
                    consented=True,  # Creator implicitly consents
                )
            ],
            facilitator=request.facilitator,
            created_at=datetime.utcnow().isoformat(),
            invite_token=invite_token,
        )

        save_session(session)

        # Update status to pending_consent since we're waiting for partner
        session.status = SessionStatus.PENDING_CONSENT
        save_session(session)

        invite_link = f"{self.base_url}/invite/{invite_token}"

        logger.info(f"Created session {session_id} with invite token {invite_token[:8]}...")

        return CreateSessionResponse(
            session_id=session_id,
            status=session.status,
            invite_link=invite_link,
            invite_token=invite_token,
        )

    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID.

        Args:
            session_id: The session identifier.

        Returns:
            The Session if found, None otherwise.
        """
        return get_session(session_id)

    async def get_session_by_token(self, invite_token: str) -> Optional[Session]:
        """Get a session by invite token.

        Args:
            invite_token: The invitation token.

        Returns:
            The Session if found, None otherwise.
        """
        return get_session_by_invite_token(invite_token)

    async def list_sessions(
        self,
        status: Optional[SessionStatus] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[List[Session], int, bool]:
        """List sessions with optional filtering.

        Args:
            status: Optional status filter.
            limit: Maximum number of sessions to return.
            offset: Number of sessions to skip.

        Returns:
            Tuple of (sessions, total count, has more).
        """
        sessions, total = store_list_sessions(status, limit, offset)
        has_more = offset + len(sessions) < total
        return sessions, total, has_more

    async def record_consent(
        self,
        session_id: str,
        request: ConsentRequest,
    ) -> ConsentResponse:
        """Record partner consent and transition status if both consented.

        Args:
            session_id: The session identifier.
            request: The consent request.

        Returns:
            ConsentResponse with updated status and participants.

        Raises:
            ValueError: If session not found or invalid token.
        """
        session = get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.invite_token != request.invite_token:
            raise ValueError("Invalid invite token")

        if request.consented:
            # Add the invitee as a participant
            invitee_id = secrets.token_urlsafe(8)
            session.participants.append(
                Participant(
                    id=invitee_id,
                    name=request.invitee_name,
                    role="invitee",
                    consented=True,
                )
            )

            # Check if both participants have consented
            all_consented = all(p.consented for p in session.participants)
            if all_consented and len(session.participants) >= 2:
                session.status = SessionStatus.READY
                logger.info(f"Session {session_id} is now READY - both parties consented")
            else:
                session.status = SessionStatus.PENDING_CONSENT

            save_session(session)
        else:
            # Decline is private - archive the session
            session.status = SessionStatus.ARCHIVED
            save_session(session)
            logger.info(f"Session {session_id} declined privately")

        return ConsentResponse(
            status=session.status,
            participants=session.participants,
        )

    async def start_session(
        self,
        session_id: str,
        request: StartSessionRequest,
        api_key: str = "",
    ) -> StartSessionResponse:
        """Start the session: spawn Pipecat, call MeetingBaas.

        Args:
            session_id: The session identifier.
            request: The start session request with meeting URL.
            api_key: MeetingBaas API key.

        Returns:
            StartSessionResponse with bot IDs and event URL.

        Raises:
            ValueError: If session not found or not ready.
        """
        session = get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.status != SessionStatus.READY:
            raise ValueError(f"Session not ready to start. Current status: {session.status}")

        # Generate client ID for WebSocket routing
        client_id = secrets.token_urlsafe(16)

        # Import here to avoid circular imports
        from config.persona_utils import PersonaManager
        from scripts.meetingbaas_api import create_meeting_bot
        from core.process import start_pipecat_process
        from core.connection import MEETING_DETAILS, PIPECAT_PROCESSES
        import os

        # Load persona
        persona_manager = PersonaManager()
        persona_name = session.facilitator.persona.value
        try:
            persona_data = persona_manager.get_persona(persona_name)
        except Exception as e:
            logger.warning(f"Persona {persona_name} not found, using default: {e}")
            persona_data = persona_manager.get_persona("baas_onboarder")

        # Get API key from env if not provided
        if not api_key:
            api_key = os.environ.get("MEETING_BAAS_API_KEY", "")

        # Get base URL for WebSocket
        base_url = os.environ.get("BASE_URL", self.base_url)
        ws_base = base_url.replace("http://", "ws://").replace("https://", "wss://")

        # Create MeetingBaas bot
        try:
            bot_id = create_meeting_bot(
                meeting_url=request.meeting_url,
                websocket_url=base_url,
                bot_id=client_id,
                persona_name=persona_name,
                api_key=api_key,
                bot_image=persona_data.get("image"),
                entry_message=persona_data.get("entry_message"),
            )
        except Exception as e:
            logger.error(f"Failed to create MeetingBaas bot: {e}")
            raise ValueError(f"Failed to create meeting bot: {e}")

        # Store meeting details
        MEETING_DETAILS[client_id] = (
            request.meeting_url,
            persona_name,
            bot_id,
            False,  # enable_tools - disabled for Diadi
            "16khz",
            persona_data,
        )

        # Start Pipecat process
        try:
            process = start_pipecat_process(
                client_id=client_id,
                websocket_url=f"{ws_base}/pipecat/{client_id}",
                meeting_url=request.meeting_url,
                persona_data=persona_data,
                streaming_audio_frequency="16khz",
                enable_tools=False,  # Disable tools for Diadi
                api_key=api_key,
                meetingbaas_bot_id=bot_id,
            )
            PIPECAT_PROCESSES[client_id] = process
        except Exception as e:
            logger.error(f"Failed to start Pipecat process: {e}")
            raise ValueError(f"Failed to start facilitation: {e}")

        # Update session
        session.status = SessionStatus.IN_PROGRESS
        session.bot_id = bot_id
        session.client_id = client_id
        session.meeting_url = request.meeting_url
        save_session(session)

        event_url = f"{ws_base}/sessions/{session_id}/events"

        logger.info(f"Session {session_id} started with bot {bot_id}")

        return StartSessionResponse(
            status=session.status,
            bot_id=bot_id,
            client_id=client_id,
            event_url=event_url,
        )

    async def end_session(self, session_id: str) -> EndSessionResponse:
        """End the session, cleanup resources, trigger summary generation.

        Args:
            session_id: The session identifier.

        Returns:
            EndSessionResponse with status and summary availability.

        Raises:
            ValueError: If session not found.
        """
        session = get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # Cleanup Pipecat and MeetingBaas
        if session.client_id:
            from core.process import terminate_process_gracefully
            from core.connection import PIPECAT_PROCESSES, MEETING_DETAILS
            from scripts.meetingbaas_api import leave_meeting_bot
            import os

            # Terminate Pipecat process
            process = PIPECAT_PROCESSES.get(session.client_id)
            if process:
                terminate_process_gracefully(process)
                PIPECAT_PROCESSES.pop(session.client_id, None)

            # Leave MeetingBaas meeting
            if session.bot_id:
                api_key = os.environ.get("MEETING_BAAS_API_KEY", "")
                try:
                    leave_meeting_bot(session.bot_id, api_key)
                except Exception as e:
                    logger.warning(f"Failed to leave meeting: {e}")

            # Cleanup meeting details
            MEETING_DETAILS.pop(session.client_id, None)

        session.status = SessionStatus.ENDED
        save_session(session)

        # Trigger summary generation (placeholder for now)
        summary_available = await self._generate_summary(session_id)

        logger.info(f"Session {session_id} ended")

        return EndSessionResponse(
            status=session.status,
            summary_available=summary_available,
        )

    async def pause_facilitation(self, session_id: str) -> Session:
        """Pause AI facilitation (kill switch).

        Args:
            session_id: The session identifier.

        Returns:
            Updated Session.

        Raises:
            ValueError: If session not found or not in progress.
        """
        session = get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.status != SessionStatus.IN_PROGRESS:
            raise ValueError("Session not in progress")

        session.status = SessionStatus.PAUSED
        save_session(session)

        # Notify Pipecat to stop interventions
        await self._notify_pipecat(session.client_id, {"action": "pause"})

        logger.info(f"Session {session_id} paused")

        return session

    async def resume_facilitation(self, session_id: str) -> Session:
        """Resume AI facilitation after pause.

        Args:
            session_id: The session identifier.

        Returns:
            Updated Session.

        Raises:
            ValueError: If session not found or not paused.
        """
        session = get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.status != SessionStatus.PAUSED:
            raise ValueError("Session not paused")

        session.status = SessionStatus.IN_PROGRESS
        save_session(session)

        # Notify Pipecat to resume interventions
        await self._notify_pipecat(session.client_id, {"action": "resume"})

        logger.info(f"Session {session_id} resumed")

        return session

    async def get_summary(self, session_id: str) -> Optional[SessionSummary]:
        """Get the summary for a session.

        Args:
            session_id: The session identifier.

        Returns:
            SessionSummary if available, None otherwise.
        """
        return get_session_summary(session_id)

    async def _generate_summary(self, session_id: str) -> bool:
        """Generate post-session summary.

        Args:
            session_id: The session identifier.

        Returns:
            True if summary was generated, False otherwise.
        """
        session = get_session(session_id)
        if not session:
            return False

        # Placeholder summary - will be replaced with OpenAI generation
        summary = SessionSummary(
            session_id=session_id,
            duration_minutes=session.duration_minutes,
            consensus_summary="Session completed. Summary generation pending.",
            action_items=[],
            balance=TalkBalanceMetrics(
                participant_a={"id": "", "name": "", "percentage": 50},
                participant_b={"id": "", "name": "", "percentage": 50},
                status="balanced",
            ),
            intervention_count=0,
            key_agreements=[],
        )

        save_session_summary(summary)
        return True

    async def _notify_pipecat(self, client_id: Optional[str], message: dict) -> None:
        """Send a control message to Pipecat process.

        Args:
            client_id: The client ID for the Pipecat connection.
            message: The message to send.
        """
        if not client_id:
            return

        # Placeholder - would send message via WebSocket to Pipecat
        logger.debug(f"Pipecat notification for {client_id}: {message}")
