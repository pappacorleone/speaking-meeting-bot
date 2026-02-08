"""Talk service for Diadi facilitation talks.

Handles talk lifecycle, state transitions, and business logic.
"""

import json
import secrets
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from loguru import logger

from app.models import (
    FacilitatorConfig,
    Participant,
    Platform,
    Talk,
    TalkStatus,
)
from core.talk_store import (
    close_event_connections,
    create_talk as store_create_talk,
    get_talk as store_get_talk,
    get_talk_by_invite_token as store_get_talk_by_token,
    get_summary,
    list_talks as store_list_talks,
    get_balance_snapshot,
    get_intervention_history,
    pause_talk_timer,
    resume_talk_timer,
    store_balance_metrics,
    start_balance_tracker,
    start_intervention_engine,
    start_talk_timer,
    stop_balance_tracker,
    stop_intervention_engine,
    stop_talk_timer,
    update_talk as store_update_talk,
)

ALLOWED_DURATIONS = {15, 30, 45, 60}
MEET_URL_PATTERN = re.compile(r"^https://meet\.google\.com/[a-z0-9-]+(?:\?.*)?$", re.IGNORECASE)


class TalkService:
    """Manages talk lifecycle and state transitions."""

    def _normalize_meeting_url(self, meeting_url: Optional[str]) -> Optional[str]:
        if meeting_url is None:
            return None
        cleaned = meeting_url.strip()
        return cleaned or None

    def _validate_duration(self, duration_minutes: int) -> None:
        if duration_minutes not in ALLOWED_DURATIONS:
            raise ValueError("Duration must be one of 15, 30, 45, or 60 minutes")

    def _validate_meeting_url(
        self, platform: Platform, meeting_url: Optional[str]
    ) -> Optional[str]:
        normalized = self._normalize_meeting_url(meeting_url)

        if platform == Platform.DIADI:
            return normalized

        if not normalized:
            raise ValueError("Meeting URL is required for external platforms")

        if platform == Platform.MEET and not MEET_URL_PATTERN.match(normalized):
            raise ValueError("Meeting URL must be a valid Google Meet link")

        return normalized

    def _build_talk_state_payload(
        self,
        talk: Talk,
        ai_status: Optional[str] = None,
        facilitator_paused: Optional[bool] = None,
    ) -> Dict[str, Any]:
        paused = facilitator_paused
        if paused is None:
            paused = talk.status == TalkStatus.PAUSED

        status_value = talk.status.value
        if ai_status is None:
            if status_value == TalkStatus.ENDING.value:
                ai_status = "ending"
            elif paused:
                ai_status = "paused"
            elif status_value == TalkStatus.IN_PROGRESS.value:
                ai_status = "listening"
            else:
                ai_status = "idle"

        return {
            "status": status_value,
            "goal": talk.goal,
            "durationMinutes": talk.duration_minutes,
            "participants": [
                {
                    "id": p.id,
                    "name": p.name,
                    "role": p.role,
                    "consented": p.consented,
                }
                for p in talk.participants
            ],
            "facilitatorConfig": {
                "persona": talk.facilitator.persona.value,
                "interruptAuthority": talk.facilitator.interrupt_authority,
                "directInquiry": talk.facilitator.direct_inquiry,
                "silenceDetection": talk.facilitator.silence_detection,
            },
            "botId": talk.bot_id,
            "clientId": talk.client_id,
            "facilitatorPaused": paused,
            "aiStatus": ai_status,
        }

    async def create_talk(
        self,
        creator_name: str,
        partner_name: str,
        goal: str,
        relationship_context: str,
        facilitator_config: Optional[FacilitatorConfig] = None,
        duration_minutes: int = 30,
        platform: Platform = Platform.MEET,
        scheduled_at: Optional[str] = None,
        meeting_url: Optional[str] = None,
        skip_consent: bool = False,
        owner_session_id: Optional[str] = None,
    ) -> Talk:
        """Create a new talk in pending_consent status (or ready in dev mode).

        Args:
            creator_name: Name of the talk creator.
            partner_name: Name of the invited partner.
            goal: The talk goal (max 200 chars).
            relationship_context: Context about the relationship.
            facilitator_config: Optional facilitator configuration.
            duration_minutes: Talk duration in minutes.
            platform: Meeting platform to use.
            scheduled_at: Optional scheduled time (ISO format).
            meeting_url: Optional meeting URL for external platforms.
            skip_consent: Skip partner consent for testing (creates talk in ready status).

        Returns:
            The created Talk object.
        """
        self._validate_duration(duration_minutes)
        meeting_url = self._validate_meeting_url(platform, meeting_url)

        talk_id = secrets.token_urlsafe(16)
        invite_token = secrets.token_urlsafe(32)
        creator_id = secrets.token_urlsafe(8)

        if facilitator_config is None:
            facilitator_config = FacilitatorConfig()

        # Build participants list
        participants = [
            Participant(
                id=creator_id,
                name=creator_name,
                role="creator",
                consented=True,  # Creator implicitly consents
            )
        ]

        # If skip_consent, add a test partner and set status to READY
        if skip_consent:
            partner_id = secrets.token_urlsafe(8)
            participants.append(
                Participant(
                    id=partner_id,
                    name=partner_name,
                    role="invitee",
                    consented=True,  # Test partner auto-consents
                )
            )
            initial_status = TalkStatus.READY
            logger.info(f"Skipping consent for talk {talk_id} (dev mode)")
        else:
            initial_status = TalkStatus.PENDING_CONSENT

        talk = Talk(
            id=talk_id,
            title=f"Talk with {partner_name}",
            goal=goal,
            relationship_context=relationship_context,
            partner_name=partner_name,
            platform=platform,
            meeting_url=meeting_url,
            duration_minutes=duration_minutes,
            scheduled_at=scheduled_at,
            status=initial_status,
            participants=participants,
            facilitator=facilitator_config,
            created_at=datetime.utcnow().isoformat(),
            invite_token=invite_token,
            owner_session_id=owner_session_id,
        )

        store_create_talk(talk)
        logger.info(f"Created talk {talk_id} for {creator_name}")

        return talk

    def get_talk(self, talk_id: str) -> Optional[Talk]:
        """Retrieve a talk by ID.

        Args:
            talk_id: The unique talk identifier.

        Returns:
            The Talk object if found, None otherwise.
        """
        return store_get_talk(talk_id)

    def get_talk_by_invite_token(self, invite_token: str) -> Optional[Talk]:
        """Retrieve a talk by its invite token.

        Args:
            invite_token: The unique invite token.

        Returns:
            The Talk object if found, None otherwise.
        """
        return store_get_talk_by_token(invite_token)

    def list_talks(self, status: Optional[str] = None) -> List[Talk]:
        """List all talks, optionally filtered by status.

        Args:
            status: Optional status filter (e.g., "draft", "in_progress").

        Returns:
            List of Talk objects matching the filter.
        """
        return store_list_talks(status)

    async def record_consent(
        self,
        talk_id: str,
        invite_token: str,
        invitee_name: str,
        consented: bool,
    ) -> Talk:
        """Record partner consent and transition status if both consented.

        Args:
            talk_id: The talk identifier.
            invite_token: The invite token for verification.
            invitee_name: Name of the invitee.
            consented: Whether the invitee consented.

        Returns:
            The updated Talk object.

        Raises:
            ValueError: If talk not found or invalid token.
        """
        talk = store_get_talk(talk_id)
        if not talk:
            raise ValueError("Talk not found")
        if talk.invite_token != invite_token:
            raise ValueError("Invalid invite token")

        if consented:
            invitee_id = secrets.token_urlsafe(8)
            talk.participants.append(
                Participant(
                    id=invitee_id,
                    name=invitee_name,
                    role="invitee",
                    consented=True,
                )
            )
            # Check if both consented
            if all(p.consented for p in talk.participants):
                talk.status = TalkStatus.READY
                logger.info(f"Talk {talk_id} is ready - both parties consented")
        else:
            # Decline is private - don't notify creator
            talk.status = TalkStatus.ARCHIVED
            logger.info(f"Talk {talk_id} archived - partner declined")

        store_update_talk(talk_id, talk)
        return talk

    async def start_talk(
        self,
        talk_id: str,
        meeting_url: Optional[str],
        api_key: str,
        websocket_base_url: str,
    ) -> Dict[str, Any]:
        """Start the talk: spawn Pipecat, call MeetingBaas.

        Args:
            talk_id: The talk identifier.
            meeting_url: Optional meeting platform URL (required for external platforms).
            api_key: The MeetingBaas API key for bot creation.
            websocket_base_url: Base URL for WebSocket connections.

        Returns:
            Dict with status, bot_id, client_id, and event_url.

        Raises:
            ValueError: If talk not found or not ready.
            RuntimeError: If bot creation fails.
        """
        logger.debug(f"start_talk websocket_base_url: {websocket_base_url}")
        logger.debug(f"start_talk api_key: {api_key[:8]}..." if api_key else "start_talk api_key: None")
        talk = store_get_talk(talk_id)
        if not talk:
            raise ValueError("Talk not found")
        if talk.status != TalkStatus.READY:
            raise ValueError(
                f"Talk not ready to start (current status: {talk.status.value})"
            )
        if talk.platform == Platform.DIADI:
            raise ValueError("Diadi platform is coming soon")

        meeting_url = meeting_url or talk.meeting_url
        meeting_url = self._validate_meeting_url(talk.platform, meeting_url)

        # Import dependencies here to avoid circular imports
        from config.persona_utils import persona_manager
        from config.voice_utils import VoiceUtils
        from core.connection import MEETING_DETAILS, PIPECAT_PROCESSES
        from core.process import start_pipecat_process
        from scripts.meetingbaas_api import create_meeting_bot

        # Generate unique client ID for this talk
        client_id = secrets.token_urlsafe(16)

        # Load persona based on facilitator configuration
        persona_name = talk.facilitator.persona.value
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

        logger.info(f"Loaded persona '{persona_name}' for talk {talk_id}")

        # Resolve voice ID if not present
        if not persona_data.get("cartesia_voice_id"):
            voice_utils = VoiceUtils()
            cartesia_voice_id = await voice_utils.match_voice_to_persona(
                persona_details=persona_data
            )
            persona_data["cartesia_voice_id"] = cartesia_voice_id
            logger.info(f"Resolved voice ID for persona: {cartesia_voice_id}")

        # Build entry message with talk context
        entry_message = persona_data.get("entry_message", "")
        if not entry_message:
            display_name = persona_data.get("name", "AI Facilitator")
            entry_message = (
                f"Hello, I'm {display_name}. "
                f"I'm here to help facilitate your conversation about: {talk.goal}"
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
        # Convert wss:// back to https:// for webhook URL
        http_base_url = websocket_base_url.replace("wss://", "https://").replace("ws://", "http://")
        webhook_url = f"{http_base_url}/webhook"
        logger.info(f"[DEBUG] websocket_base_url: {websocket_base_url}")
        logger.info(f"[DEBUG] http_base_url: {http_base_url}")
        logger.info(f"[DEBUG] webhook_url: {webhook_url}")
        meetingbaas_bot_id = create_meeting_bot(
            meeting_url=meeting_url,
            websocket_url=websocket_base_url,
            bot_id=client_id,
            persona_name=persona_data.get("name", persona_name),
            api_key=api_key,
            bot_image=persona_data.get("image"),
            entry_message=entry_message,
            extra={
                "talk_id": talk_id,
                "goal": talk.goal,
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

        # Update talk state
        talk.status = TalkStatus.IN_PROGRESS
        talk.meeting_url = meeting_url
        talk.bot_id = meetingbaas_bot_id
        talk.client_id = client_id

        store_update_talk(talk_id, talk)
        logger.info(f"Talk {talk_id} started successfully")

        # Start time tracking and broadcast initial state
        start_talk_timer(talk_id, talk.duration_minutes)
        start_balance_tracker(talk)
        start_intervention_engine(talk)
        try:
            from core.talk_store import broadcast_talk_event

            await broadcast_talk_event(
                talk_id,
                "session_state",
                self._build_talk_state_payload(talk),
            )
        except Exception as e:
            logger.warning(f"Failed to broadcast talk start state: {e}")

        return {
            "status": talk.status,
            "bot_id": meetingbaas_bot_id,
            "client_id": client_id,
            "event_url": f"/talks/{talk_id}/events",
        }

    async def end_talk(self, talk_id: str, api_key: str) -> Dict[str, Any]:
        """End the talk, cleanup resources, generate summary.

        This method handles the full talk end lifecycle following the proven
        cleanup order from leave_bot():
        1. Idempotency check (return early if already ended/ending)
        2. Set transitional ENDING status and broadcast
        3. Capture metrics while trackers are still active
        4. Call MeetingBaas API to make bot leave
        5. Mark router as closing to prevent further messages
        6. Close WebSocket connections gracefully
        7. Wait grace period for messages to flush (0.5s)
        8. Terminate Pipecat process
        9. Clean up in-memory state
        10. Stop timers and trackers
        11. Update talk status to ENDED
        12. Broadcast final session_state event
        13. Generate summary

        Args:
            talk_id: The talk identifier.
            api_key: The MeetingBaas API key for bot removal.

        Returns:
            Dict with status and summary_available flag.

        Raises:
            ValueError: If talk not found or not in a state that can be ended.
        """
        import asyncio

        talk = store_get_talk(talk_id)
        if not talk:
            raise ValueError("Talk not found")

        # Idempotency: If already ended, return cached result
        if talk.status == TalkStatus.ENDED:
            logger.info(f"Talk {talk_id} already ended, returning cached result")
            return {
                "status": talk.status,
                "summary_available": get_summary(talk_id) is not None,
            }

        # Idempotency: If already ending, return current status
        if talk.status == TalkStatus.ENDING:
            logger.warning(f"Talk {talk_id} is already ending")
            return {
                "status": talk.status,
                "summary_available": False,
            }

        # Talk can be ended from in_progress or paused states
        if talk.status not in [TalkStatus.IN_PROGRESS, TalkStatus.PAUSED]:
            raise ValueError(
                f"Talk cannot be ended (current status: {talk.status.value})"
            )

        # Import dependencies here to avoid circular imports
        from core.connection import MEETING_DETAILS, PIPECAT_PROCESSES, registry
        from core.process import terminate_process_gracefully
        from core.router import router as message_router
        from core.talk_store import broadcast_talk_event
        from scripts.meetingbaas_api import leave_meeting_bot

        client_id = talk.client_id
        bot_id = talk.bot_id

        # =====================================================================
        # STEP 1: Set transitional ENDING status and broadcast
        # =====================================================================
        talk.status = TalkStatus.ENDING
        store_update_talk(talk_id, talk)
        logger.info(f"Talk {talk_id} transitioning to ending status")

        try:
            await broadcast_talk_event(
                talk_id,
                "session_state",
                {
                    **self._build_talk_state_payload(
                        talk, ai_status="ending", facilitator_paused=True
                    ),
                },
            )
        except Exception as e:
            logger.warning(f"Failed to broadcast ending state: {e}")

        # =====================================================================
        # STEP 2: Capture metrics BEFORE cleanup (while trackers still active)
        # =====================================================================
        intervention_history = get_intervention_history(talk_id)

        balance_metrics = None
        balance_snapshot = get_balance_snapshot(talk_id)
        if balance_snapshot and balance_snapshot.get("status") != "waiting_for_speakers":
            balance_metrics = {
                "participant_a": {
                    "id": balance_snapshot["participantA"]["id"],
                    "name": balance_snapshot["participantA"]["name"],
                    "percentage": balance_snapshot["participantA"]["percentage"],
                },
                "participant_b": {
                    "id": balance_snapshot["participantB"]["id"],
                    "name": balance_snapshot["participantB"]["name"],
                    "percentage": balance_snapshot["participantB"]["percentage"],
                },
                "status": balance_snapshot["status"],
            }
            store_balance_metrics(talk_id, balance_metrics)

        # =====================================================================
        # STEP 3: Call MeetingBaas API to make the bot leave FIRST
        # =====================================================================
        if bot_id:
            try:
                result = leave_meeting_bot(bot_id=bot_id, api_key=api_key)
                if result:
                    logger.info(f"Bot {bot_id} successfully left the meeting")
                else:
                    logger.warning(f"Failed to remove bot {bot_id} from meeting")
            except Exception as e:
                logger.error(f"Error calling leave_meeting_bot: {e}")

        # =====================================================================
        # STEP 4: Mark router as closing BEFORE disconnecting WebSockets
        # =====================================================================
        if client_id:
            message_router.mark_closing(client_id)
            logger.debug(f"Marked client {client_id} as closing")

        # =====================================================================
        # STEP 5: Close WebSocket connections gracefully
        # =====================================================================
        if client_id:
            # Close Pipecat WebSocket first
            if client_id in registry.pipecat_connections:
                try:
                    await registry.disconnect(client_id, is_pipecat=True)
                    logger.info(f"Closed Pipecat WebSocket for talk {talk_id}")
                except Exception as e:
                    logger.error(f"Error closing Pipecat WebSocket: {e}")

            # Then close client WebSockets (output/input)
            if registry.get_client_output(client_id):
                try:
                    await registry.disconnect(client_id, client_direction="output")
                    logger.info(f"Closed client OUTPUT WebSocket for talk {talk_id}")
                except Exception as e:
                    logger.error(f"Error closing client OUTPUT WebSocket: {e}")

            if registry.get_client_input(client_id):
                try:
                    await registry.disconnect(client_id, client_direction="input")
                    logger.info(f"Closed client INPUT WebSocket for talk {talk_id}")
                except Exception as e:
                    logger.error(f"Error closing client INPUT WebSocket: {e}")

        # =====================================================================
        # STEP 6: CRITICAL - Wait grace period for messages to flush
        # =====================================================================
        await asyncio.sleep(0.5)
        logger.debug(f"Grace period complete for talk {talk_id}")

        # =====================================================================
        # STEP 7: Terminate Pipecat process AFTER WebSockets are closed
        # =====================================================================
        if client_id and client_id in PIPECAT_PROCESSES:
            process = PIPECAT_PROCESSES[client_id]
            if process and process.poll() is None:  # Process is still running
                try:
                    if terminate_process_gracefully(process, timeout=3.0):
                        logger.info(
                            f"Gracefully terminated Pipecat process for talk {talk_id}"
                        )
                    else:
                        logger.warning(
                            f"Had to forcefully kill Pipecat process for talk {talk_id}"
                        )
                except Exception as e:
                    logger.error(f"Error terminating Pipecat process: {e}")

            # Remove from process tracking
            PIPECAT_PROCESSES.pop(client_id, None)

        # =====================================================================
        # STEP 8: Clean up in-memory state
        # =====================================================================
        if client_id and client_id in MEETING_DETAILS:
            MEETING_DETAILS.pop(client_id, None)
            logger.info(f"Cleaned up meeting details for talk {talk_id}")

        # =====================================================================
        # STEP 9: Stop time tracking and runtime engines
        # =====================================================================
        stop_talk_timer(talk_id)
        stop_intervention_engine(talk_id)
        stop_balance_tracker(talk_id)

        # =====================================================================
        # STEP 10: Update talk status to ENDED
        # =====================================================================
        talk.status = TalkStatus.ENDED
        store_update_talk(talk_id, talk)
        logger.info(f"Talk {talk_id} ended successfully")

        # =====================================================================
        # STEP 11: Broadcast final session_state event
        # =====================================================================
        try:
            await broadcast_talk_event(
                talk_id,
                "session_state",
                {
                    **self._build_talk_state_payload(
                        talk, ai_status="idle", facilitator_paused=False
                    ),
                },
            )
        except Exception as e:
            logger.warning(f"Error broadcasting talk end event: {e}")

        # Close all event WebSocket connections with code 1000 to prevent reconnection
        try:
            await close_event_connections(talk_id)
        except Exception as e:
            logger.warning(f"Error closing event connections: {e}")

        # =====================================================================
        # STEP 12: Generate summary
        # =====================================================================
        summary_available = await self._generate_summary(
            talk_id,
            balance_metrics=balance_metrics,
            intervention_history=intervention_history,
        )

        return {
            "status": talk.status,
            "summary_available": summary_available,
        }

    async def pause_facilitation(self, talk_id: str) -> Talk:
        """Pause AI facilitation (kill switch).

        Immediately pauses AI interventions while keeping the talk active.
        This is the kill switch functionality that gives participants control.

        Args:
            talk_id: The talk identifier.

        Returns:
            The updated Talk object with status "paused".

        Raises:
            ValueError: If talk not found or not in progress.
        """
        talk = store_get_talk(talk_id)
        if not talk:
            raise ValueError("Talk not found")

        if talk.status != TalkStatus.IN_PROGRESS:
            raise ValueError("Talk not in progress")

        talk.status = TalkStatus.PAUSED
        store_update_talk(talk_id, talk)
        logger.info(f"Paused facilitation for talk {talk_id}")

        # Notify Pipecat to stop interventions
        await self._notify_pipecat(talk.client_id, {"action": "pause"})

        pause_talk_timer(talk_id)

        # Broadcast pause event to connected clients
        from core.talk_store import broadcast_talk_event

        await broadcast_talk_event(
            talk_id,
            "session_state",
            {
                **self._build_talk_state_payload(
                    talk, ai_status="paused", facilitator_paused=True
                ),
            },
        )

        return talk

    async def resume_facilitation(self, talk_id: str) -> Talk:
        """Resume AI facilitation after pause.

        Re-enables AI interventions for a previously paused talk.

        Args:
            talk_id: The talk identifier.

        Returns:
            The updated Talk object with status "in_progress".

        Raises:
            ValueError: If talk not found or not paused.
        """
        talk = store_get_talk(talk_id)
        if not talk:
            raise ValueError("Talk not found")

        if talk.status != TalkStatus.PAUSED:
            raise ValueError("Talk not paused")

        talk.status = TalkStatus.IN_PROGRESS
        store_update_talk(talk_id, talk)
        logger.info(f"Resumed facilitation for talk {talk_id}")

        # Notify Pipecat to resume interventions
        await self._notify_pipecat(talk.client_id, {"action": "resume"})

        resume_talk_timer(talk_id)

        # Broadcast resume event to connected clients
        from core.talk_store import broadcast_talk_event

        await broadcast_talk_event(
            talk_id,
            "session_state",
            {
                **self._build_talk_state_payload(
                    talk, ai_status="listening", facilitator_paused=False
                ),
            },
        )

        return talk

    async def _generate_summary(
        self,
        talk_id: str,
        balance_metrics: Optional[Dict[str, Any]] = None,
        intervention_history: Optional[List[Dict[str, Any]]] = None,
    ) -> bool:
        """Generate post-talk summary using OpenAI.

        Args:
            talk_id: The talk identifier.
            balance_metrics: Optional talk balance metrics to include.
            intervention_history: Optional intervention history to include.

        Returns:
            True if summary was generated and stored, False otherwise.
        """
        talk = store_get_talk(talk_id)
        if not talk:
            logger.warning(f"Cannot generate summary: talk {talk_id} not found")
            return False

        # Import summary service here to avoid circular imports
        from app.services.summary_service import summary_service
        from core.talk_store import store_summary

        try:
            # Prepare participants data
            participants = [
                {"id": p.id, "name": p.name, "role": p.role}
                for p in talk.participants
            ]

            # TODO: Wire in live balance metrics when available.
            transcript = None

            # Generate summary via SummaryService
            summary = await summary_service.generate_summary(
                talk_id=talk_id,
                goal=talk.goal,
                duration_minutes=talk.duration_minutes,
                participants=participants,
                balance_metrics=balance_metrics,
                intervention_history=intervention_history,
                transcript=transcript,
            )

            if summary:
                # Store the summary
                store_summary(talk_id, summary)
                logger.info(f"Generated and stored summary for talk {talk_id}")
                return True
            else:
                logger.warning(
                    f"Summary generation returned None for talk {talk_id}"
                )
                return False

        except Exception as e:
            logger.error(f"Error generating summary for talk {talk_id}: {e}")
            return False

    async def _notify_pipecat(self, client_id: Optional[str], message: dict) -> None:
        """Send a control message to Pipecat process.

        Args:
            client_id: The client ID for the Pipecat connection.
            message: The message to send.
        """
        if not client_id:
            return
        from core.connection import registry
        from datetime import datetime

        pipecat_ws = registry.get_pipecat(client_id)
        if not pipecat_ws:
            return

        payload = {
            "type": "control",
            "data": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        try:
            from protobufs import frames_pb2

            frame = frames_pb2.Frame()
            frame.text.text = json.dumps(payload)
            await pipecat_ws.send_bytes(frame.SerializeToString())
        except Exception as e:
            logger.debug(f"Failed to notify Pipecat {client_id}: {e}")


# Create global service instance
talk_service = TalkService()
