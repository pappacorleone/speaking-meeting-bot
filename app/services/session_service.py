"""Session service for Diadi facilitation sessions.

Handles session lifecycle, state transitions, and business logic.
"""

import secrets
from datetime import datetime
from typing import Any, Dict, List, Optional

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
            partner_name=partner_name,
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
        api_key: str,
        websocket_base_url: str,
    ) -> Dict[str, Any]:
        """Start the session: spawn Pipecat, call MeetingBaas.

        Args:
            session_id: The session identifier.
            meeting_url: The meeting platform URL.
            api_key: The MeetingBaas API key for bot creation.
            websocket_base_url: Base URL for WebSocket connections.

        Returns:
            Dict with status, bot_id, client_id, and event_url.

        Raises:
            ValueError: If session not found or not ready.
            RuntimeError: If bot creation fails.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        if session.status != SessionStatus.READY:
            raise ValueError(
                f"Session not ready to start (current status: {session.status.value})"
            )

        # Import dependencies here to avoid circular imports
        from config.persona_utils import persona_manager
        from config.voice_utils import VoiceUtils
        from core.connection import MEETING_DETAILS, PIPECAT_PROCESSES
        from core.process import start_pipecat_process
        from scripts.meetingbaas_api import create_meeting_bot

        # Generate unique client ID for this session
        client_id = secrets.token_urlsafe(16)

        # Load persona based on facilitator configuration
        persona_name = session.facilitator.persona.value
        try:
            persona_data = persona_manager.get_persona(persona_name)
            persona_data["is_temporary"] = False
        except KeyError:
            logger.warning(
                f"Persona '{persona_name}' not found, falling back to neutral_mediator"
            )
            try:
                persona_data = persona_manager.get_persona("neutral_mediator")
                persona_data["is_temporary"] = False
            except KeyError:
                # Final fallback to baas_onboarder
                persona_data = persona_manager.get_persona("baas_onboarder")
                persona_data["is_temporary"] = False

        logger.info(f"Loaded persona '{persona_name}' for session {session_id}")

        # Resolve voice ID if not present
        if not persona_data.get("cartesia_voice_id"):
            voice_utils = VoiceUtils()
            cartesia_voice_id = await voice_utils.match_voice_to_persona(
                persona_details=persona_data
            )
            persona_data["cartesia_voice_id"] = cartesia_voice_id
            logger.info(f"Resolved voice ID for persona: {cartesia_voice_id}")

        # Build entry message with session context
        entry_message = persona_data.get("entry_message", "")
        if not entry_message:
            display_name = persona_data.get("name", "AI Facilitator")
            entry_message = (
                f"Hello, I'm {display_name}. "
                f"I'm here to help facilitate your conversation about: {session.goal}"
            )

        # Fixed streaming audio frequency for consistency
        streaming_audio_frequency = "16khz"

        # Store meeting details for WebSocket handler
        MEETING_DETAILS[client_id] = (
            meeting_url,
            persona_data.get("name", persona_name),
            None,  # meetingbaas_bot_id, will be set after creation
            False,  # enable_tools - disabled for Diadi facilitation
            streaming_audio_frequency,
            persona_data,  # Full persona data for Pipecat subprocess
        )

        # Create MeetingBaas bot
        webhook_url = f"{websocket_base_url}/webhook"
        meetingbaas_bot_id = create_meeting_bot(
            meeting_url=meeting_url,
            websocket_url=websocket_base_url,
            bot_id=client_id,
            persona_name=persona_data.get("name", persona_name),
            api_key=api_key,
            bot_image=persona_data.get("image"),
            entry_message=entry_message,
            extra={
                "session_id": session_id,
                "goal": session.goal,
                "facilitator_persona": persona_name,
            },
            streaming_audio_frequency=streaming_audio_frequency,
            webhook_url=webhook_url,
        )

        if not meetingbaas_bot_id:
            # Clean up meeting details on failure
            MEETING_DETAILS.pop(client_id, None)
            raise RuntimeError("Failed to create MeetingBaas bot")

        # Update MEETING_DETAILS with the bot ID
        details = list(MEETING_DETAILS[client_id])
        details[2] = meetingbaas_bot_id
        MEETING_DETAILS[client_id] = tuple(details)

        logger.info(f"Created MeetingBaas bot with ID: {meetingbaas_bot_id}")

        # Start Pipecat process
        # Pipecat connects to the local WebSocket server, not external URL
        pipecat_websocket_url = f"ws://localhost:7014/pipecat/{client_id}"
        process = start_pipecat_process(
            client_id=client_id,
            websocket_url=pipecat_websocket_url,
            meeting_url=meeting_url,
            persona_data=persona_data,
            streaming_audio_frequency=streaming_audio_frequency,
            enable_tools=False,  # Disable weather/time tools for Diadi
            api_key=api_key,
            meetingbaas_bot_id=meetingbaas_bot_id,
        )

        # Store the process for later cleanup
        PIPECAT_PROCESSES[client_id] = process
        logger.info(f"Started Pipecat process with PID {process.pid}")

        # Update session state
        session.status = SessionStatus.IN_PROGRESS
        session.meeting_url = meeting_url
        session.bot_id = meetingbaas_bot_id
        session.client_id = client_id

        store_update_session(session_id, session)
        logger.info(f"Session {session_id} started successfully")

        return {
            "status": session.status,
            "bot_id": meetingbaas_bot_id,
            "client_id": client_id,
            "event_url": f"/sessions/{session_id}/events",
        }

    async def end_session(self, session_id: str, api_key: str) -> Dict[str, Any]:
        """End the session, cleanup resources, generate summary.

        This method handles the full session end lifecycle:
        1. Validates session exists and can be ended
        2. Terminates the Pipecat process
        3. Calls MeetingBaas API to make the bot leave
        4. Cleans up in-memory state
        5. Broadcasts session_state event
        6. Triggers summary generation (async)

        Args:
            session_id: The session identifier.
            api_key: The MeetingBaas API key for bot removal.

        Returns:
            Dict with status and summary_available flag.

        Raises:
            ValueError: If session not found or not in a state that can be ended.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        # Session can be ended from in_progress or paused states
        if session.status not in [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED]:
            raise ValueError(
                f"Session cannot be ended (current status: {session.status.value})"
            )

        # Import dependencies here to avoid circular imports
        from core.connection import MEETING_DETAILS, PIPECAT_PROCESSES, registry
        from core.process import terminate_process_gracefully
        from core.router import router as message_router
        from core.session_store import broadcast_session_event
        from scripts.meetingbaas_api import leave_meeting_bot

        client_id = session.client_id
        bot_id = session.bot_id

        # 1. Terminate the Pipecat process
        if client_id and client_id in PIPECAT_PROCESSES:
            process = PIPECAT_PROCESSES[client_id]
            if process and process.poll() is None:  # Process is still running
                try:
                    # Mark client as closing to prevent further messages
                    message_router.mark_closing(client_id)

                    if terminate_process_gracefully(process, timeout=3.0):
                        logger.info(
                            f"Gracefully terminated Pipecat process for session {session_id}"
                        )
                    else:
                        logger.warning(
                            f"Had to forcefully kill Pipecat process for session {session_id}"
                        )
                except Exception as e:
                    logger.error(f"Error terminating Pipecat process: {e}")

            # Remove from process tracking
            PIPECAT_PROCESSES.pop(client_id, None)

        # 2. Call MeetingBaas API to make the bot leave
        if bot_id:
            try:
                result = leave_meeting_bot(bot_id=bot_id, api_key=api_key)
                if result:
                    logger.info(f"Bot {bot_id} successfully left the meeting")
                else:
                    logger.warning(f"Failed to remove bot {bot_id} from meeting")
            except Exception as e:
                logger.error(f"Error calling leave_meeting_bot: {e}")

        # 3. Close WebSocket connections
        if client_id:
            try:
                # Close Pipecat WebSocket
                if client_id in registry.pipecat_connections:
                    await registry.disconnect(client_id, is_pipecat=True)
                    logger.info(f"Closed Pipecat WebSocket for session {session_id}")

                # Close client WebSockets
                if registry.get_client_output(client_id):
                    await registry.disconnect(client_id, client_direction="output")
                if registry.get_client_input(client_id):
                    await registry.disconnect(client_id, client_direction="input")
            except Exception as e:
                logger.error(f"Error closing WebSocket connections: {e}")

        # 4. Clean up in-memory state
        if client_id and client_id in MEETING_DETAILS:
            MEETING_DETAILS.pop(client_id, None)
            logger.info(f"Cleaned up meeting details for session {session_id}")

        # 5. Update session status
        session.status = SessionStatus.ENDED
        store_update_session(session_id, session)
        logger.info(f"Session {session_id} ended successfully")

        # 6. Broadcast session_state event to any connected clients
        try:
            await broadcast_session_event(
                session_id,
                "session_state",
                {
                    "status": session.status.value,
                    "ended": True,
                },
            )
        except Exception as e:
            logger.warning(f"Error broadcasting session end event: {e}")

        # 7. Trigger summary generation (async - does not block return)
        summary_available = await self._generate_summary(session_id)

        return {
            "status": session.status,
            "summary_available": summary_available,
        }

    async def pause_facilitation(self, session_id: str) -> Session:
        """Pause AI facilitation (kill switch).

        Immediately pauses AI interventions while keeping the session active.
        This is the kill switch functionality that gives participants control.

        Args:
            session_id: The session identifier.

        Returns:
            The updated Session object with status "paused".

        Raises:
            ValueError: If session not found or not in progress.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.status != SessionStatus.IN_PROGRESS:
            raise ValueError("Session not in progress")

        session.status = SessionStatus.PAUSED
        store_update_session(session_id, session)
        logger.info(f"Paused facilitation for session {session_id}")

        # Notify Pipecat to stop interventions
        await self._notify_pipecat(session.client_id, {"action": "pause"})

        # Broadcast pause event to connected clients
        from core.session_store import broadcast_session_event

        await broadcast_session_event(
            session_id,
            "session_state",
            {
                "status": session.status.value,
                "facilitator_paused": True,
            },
        )

        return session

    async def resume_facilitation(self, session_id: str) -> Session:
        """Resume AI facilitation after pause.

        Re-enables AI interventions for a previously paused session.

        Args:
            session_id: The session identifier.

        Returns:
            The updated Session object with status "in_progress".

        Raises:
            ValueError: If session not found or not paused.
        """
        session = store_get_session(session_id)
        if not session:
            raise ValueError("Session not found")

        if session.status != SessionStatus.PAUSED:
            raise ValueError("Session not paused")

        session.status = SessionStatus.IN_PROGRESS
        store_update_session(session_id, session)
        logger.info(f"Resumed facilitation for session {session_id}")

        # Notify Pipecat to resume interventions
        await self._notify_pipecat(session.client_id, {"action": "resume"})

        # Broadcast resume event to connected clients
        from core.session_store import broadcast_session_event

        await broadcast_session_event(
            session_id,
            "session_state",
            {
                "status": session.status.value,
                "facilitator_paused": False,
            },
        )

        return session

    async def _generate_summary(self, session_id: str) -> bool:
        """Generate post-session summary using OpenAI.

        Args:
            session_id: The session identifier.

        Returns:
            True if summary was generated and stored, False otherwise.
        """
        session = store_get_session(session_id)
        if not session:
            logger.warning(f"Cannot generate summary: session {session_id} not found")
            return False

        # Import summary service here to avoid circular imports
        from app.services.summary_service import summary_service
        from core.session_store import store_summary

        try:
            # Prepare participants data
            participants = [
                {"id": p.id, "name": p.name, "role": p.role}
                for p in session.participants
            ]

            # TODO: Get actual balance metrics and intervention history from session
            # For now, use defaults
            balance_metrics = None
            intervention_history = None
            transcript = None

            # Generate summary via SummaryService
            summary = await summary_service.generate_summary(
                session_id=session_id,
                goal=session.goal,
                duration_minutes=session.duration_minutes,
                participants=participants,
                balance_metrics=balance_metrics,
                intervention_history=intervention_history,
                transcript=transcript,
            )

            if summary:
                # Store the summary
                store_summary(session_id, summary)
                logger.info(f"Generated and stored summary for session {session_id}")
                return True
            else:
                logger.warning(
                    f"Summary generation returned None for session {session_id}"
                )
                return False

        except Exception as e:
            logger.error(f"Error generating summary for session {session_id}: {e}")
            return False

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
