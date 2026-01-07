"""API routes for the Speaking Meeting Bot application."""

import asyncio
import uuid
from datetime import datetime
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple
import random

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse, StreamingResponse

from app.models import (
    BotRequest,
    ConsentRequest,
    ConsentResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    EndSessionResponse,
    JoinResponse,
    LeaveBotRequest,
    PauseResumeResponse,
    PersonaImageRequest,
    PersonaImageResponse,
    Session,
    SessionListResponse,
    SessionStatus,
    SessionSummary,
    StartSessionRequest,
    StartSessionResponse,
)
from app.services.image_service import image_service
from config.persona_utils import persona_manager
from core.connection import MEETING_DETAILS, PIPECAT_PROCESSES, registry
from core.process import start_pipecat_process, terminate_process_gracefully
from core.router import router as message_router

# Import from the app module (will be defined in __init__.py)
from meetingbaas_pipecat.utils.logger import logger
from scripts.meetingbaas_api import create_meeting_bot, leave_meeting_bot
from utils.ngrok import (
    LOCAL_DEV_MODE,
    determine_websocket_url,
    log_ngrok_status,
    release_ngrok_url,
    update_ngrok_client_id,
)
from config.prompts import PERSONA_INTERACTION_INSTRUCTIONS

# Import the new persona detail extraction service
from app.services.persona_detail_extraction import extract_persona_details_from_prompt

# Import session service
from app.services.session_service import session_service

router = APIRouter()


@router.post(
    "/bots",
    tags=["bots"],
    response_model=JoinResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Bot successfully created and joined the meeting"},
        400: {"description": "Bad request - Missing required fields or invalid data"},
        500: {
            "description": "Server error - Failed to create bot through MeetingBaas API"
        },
    },
)
async def join_meeting(request: BotRequest, client_request: Request):
    """
    Create and deploy a speaking bot in a meeting.

    Launches an AI-powered bot that joins a video meeting through MeetingBaas
    and processes audio using Pipecat's voice AI framework.
    """
    # Validate required parameters
    if not request.meeting_url:
        return JSONResponse(
            content={"message": "Meeting URL is required", "status": "error"},
            status_code=400,
        )

    # Get API key from request state (set by middleware)
    api_key = client_request.state.api_key

    # Log local dev mode status
    if LOCAL_DEV_MODE:
        logger.info("🔍 Running in LOCAL_DEV_MODE - will prioritize ngrok URLs")
    else:
        logger.info("🔍 Running in standard mode")

    # Determine WebSocket URL (works in all cases now)
    websocket_url, temp_client_id = determine_websocket_url(None, client_request)

    logger.info(f"Starting bot for meeting {request.meeting_url}")
    logger.info(f"WebSocket URL: {websocket_url}")
    logger.info(f"Bot name: {request.bot_name}")

    # INTERNAL PARAMETER: Set a fixed value for streaming_audio_frequency
    # This is not exposed in the API and is always "16khz"
    streaming_audio_frequency = "16khz"
    logger.info(f"Using fixed streaming audio frequency: {streaming_audio_frequency}")

    # Set the converter sample rate based on our fixed streaming_audio_frequency
    from core.converter import converter

    sample_rate = 16000  # Always 16000 Hz for 16khz audio
    converter.set_sample_rate(sample_rate)
    logger.info(
        f"Set audio sample rate to {sample_rate} Hz for {streaming_audio_frequency}"
    )

    # Generate a unique client ID for this bot
    bot_client_id = str(uuid.uuid4())

    # If we're in local dev mode and we have a temp client ID, update the mapping
    if LOCAL_DEV_MODE and temp_client_id:
        update_ngrok_client_id(temp_client_id, bot_client_id)
        log_ngrok_status()

    # --- Streamlined Persona and Prompt Resolution Logic ---
    final_prompt: str = ""
    resolved_persona_data: Dict[str, Any] = {}
    persona_name_for_logging: str = "Unknown"

    if request.prompt:  # Case 1: Custom prompt provided (dynamic persona)
        logger.info(f"Processing custom prompt for bot {bot_client_id}")
        prompt_derived_details = await extract_persona_details_from_prompt(
            request.prompt
        )

        if prompt_derived_details and isinstance(
            prompt_derived_details, dict
        ):  # Ensure it's a dict
            # Construct resolved_persona_data from derived details
            resolved_persona_data = {
                "name": prompt_derived_details.get("name", "Bot"),
                "prompt": request.prompt,  # Store original request prompt as the base prompt for dynamic persona
                "description": prompt_derived_details.get(
                    "description", request.prompt
                ),  # Use derived description or fallback to full prompt
                "gender": prompt_derived_details.get("gender", "male"),
                "characteristics": prompt_derived_details.get(
                    "characteristics", []
                ),  # Ensure it's a list
                "image": None,  # Will be generated/resolved later
                "cartesia_voice_id": None,  # Will be matched later
                "relevant_links": [],
                "additional_content": None,
                "is_temporary": True,  # Mark as temporary persona
            }
            persona_name_for_logging = resolved_persona_data["name"]
            final_prompt = request.prompt + PERSONA_INTERACTION_INSTRUCTIONS
            logger.info(
                f"Dynamically created persona '{persona_name_for_logging}' from prompt."
            )
        else:
            # Fallback if prompt details extraction fails or returns unexpected type
            logger.warning(
                "Failed to extract persona details from custom prompt or received unexpected type. Falling back to default bot persona."
            )
            resolved_persona_data = persona_manager.get_persona("baas_onboarder")
            resolved_persona_data["is_temporary"] = (
                False  # Ensure fallback is not marked temporary
            )
            persona_name_for_logging = resolved_persona_data.get(
                "name", "baas_onboarder"
            )
            final_prompt = (
                resolved_persona_data["prompt"] + PERSONA_INTERACTION_INSTRUCTIONS
            )

    else:  # Case 2: No custom prompt, use pre-defined persona
        resolved_persona_name: str

        # Priority: request.personas > request.bot_name > random > baas_onboarder
        if request.personas and len(request.personas) > 0:
            resolved_persona_name = request.personas[0]
            logger.info(f"Using specified persona '{resolved_persona_name}' for bot.")
        elif request.bot_name and request.bot_name in persona_manager.personas:
            resolved_persona_name = request.bot_name
            logger.info(f"Using bot_name as persona '{resolved_persona_name}' for bot.")
        else:
            available_personas = list(persona_manager.personas.keys())
            if available_personas:
                resolved_persona_name = random.choice(available_personas)
                logger.info(
                    f"No persona specified, using random persona '{resolved_persona_name}' for bot."
                )
            else:
                resolved_persona_name = "baas_onboarder"
                logger.warning(
                    "No personas found, using fallback persona: baas_onboarder."
                )

        try:
            resolved_persona_data = persona_manager.get_persona(resolved_persona_name)
            resolved_persona_data["is_temporary"] = False  # Mark as not temporary
            persona_name_for_logging = resolved_persona_data.get(
                "name", resolved_persona_name
            )
            final_prompt = (
                resolved_persona_data["prompt"] + PERSONA_INTERACTION_INSTRUCTIONS
            )
            logger.info(f"Using pre-defined persona '{persona_name_for_logging}'.")
        except KeyError as e:
            logger.error(
                f"Resolved persona '{resolved_persona_name}' not found: {e}. Falling back to baas_onboarder."
            )
            resolved_persona_data = persona_manager.get_persona("baas_onboarder")
            resolved_persona_data["is_temporary"] = (
                False  # Ensure fallback is not marked temporary
            )
            persona_name_for_logging = resolved_persona_data.get(
                "name", "baas_onboarder"
            )
            final_prompt = (
                resolved_persona_data["prompt"] + PERSONA_INTERACTION_INSTRUCTIONS
            )
            logger.info(f"Using fallback persona '{persona_name_for_logging}'.")

    # Populate image if not present
    if not resolved_persona_data.get("image"):
        image_prompt_desc = resolved_persona_data.get(
            "description"
        ) or resolved_persona_data.get("prompt")
        if image_prompt_desc:
            logger.info(
                f"Attempting to generate image for '{persona_name_for_logging}' with prompt: {image_prompt_desc}"
            )
            try:
                generated_image = await image_service.generate_persona_image(
                    name=resolved_persona_data.get(
                        "name", "Bot"
                    ),  # Use persona's resolved name
                    prompt=image_prompt_desc,
                    style="cinematic, detailed, photorealistic, professional headshot",
                    size=(512, 512),
                )

                if generated_image:
                    resolved_persona_data["image"] = generated_image
                    logger.info(
                        f"Generated image URL for '{persona_name_for_logging}': {generated_image}"
                    )
                else:
                    logger.warning(f"Image generation returned no URL.")
                    resolved_persona_data["image"] = (
                        None  # Ensure no invalid image data is stored
                    )
            except Exception as e:
                logger.error(
                    f"Failed to generate image for '{persona_name_for_logging}': {e}"
                )

    # Populate voice ID if not present
    if not resolved_persona_data.get("cartesia_voice_id"):
        from config.voice_utils import (
            VoiceUtils,
        )  # Import here to avoid circular dependency issues

        voice_utils = VoiceUtils()
        cartesia_voice_id = await voice_utils.match_voice_to_persona(
            persona_details=resolved_persona_data
        )  # Pass the whole dict
        resolved_persona_data["cartesia_voice_id"] = cartesia_voice_id
        logger.info(
            f"Resolved Cartesia voice ID for '{persona_name_for_logging}': {cartesia_voice_id}"
        )

    logger.info(f"Final resolved persona data for Pipecat process:")
    logger.info(f"  Name: {resolved_persona_data.get('name')}")
    logger.info(f"  Image: {resolved_persona_data.get('image')}")
    logger.info(f"  Voice ID: {resolved_persona_data.get('cartesia_voice_id')}")
    logger.info(f"  Is Temporary: {resolved_persona_data.get('is_temporary')}")

    # Store all relevant details in MEETING_DETAILS dictionary
    # Note: Index 5 stores the full resolved_persona_data for use by websocket handler
    MEETING_DETAILS[bot_client_id] = (
        request.meeting_url,
        resolved_persona_data.get(
            "name", persona_name_for_logging
        ),  # Use display name from resolved data
        None,  # meetingbaas_bot_id, will be set after creation
        request.enable_tools,
        streaming_audio_frequency,
        resolved_persona_data,  # Full persona data for Pipecat subprocess
    )

    # Get image URL: Prioritize request.bot_image > persona_data.image > generate_image (if custom prompt and details derived)
    bot_image = request.bot_image
    if not bot_image:
        # Check persona data first (whether existing or temporary)
        if resolved_persona_data.get("image"):
            # Ensure the image is a string
            try:
                bot_image = str(resolved_persona_data.get("image"))
                logger.info(
                    f"Using persona image from resolved persona data: {bot_image}"
                )
            except Exception as e:
                logger.error(
                    f"Error converting persona image from resolved persona data to string: {e}"
                )
                bot_image = None
        # Only attempt to generate image if custom prompt was originally used AND details were derived
        elif request.prompt and prompt_derived_details:
            logger.info(
                "Attempting to generate image based on custom LLM prompt derived details..."
            )
            # Use details from prompt_derived_details to create a PersonaImageRequest
            try:
                # Use derived details, falling back to defaults or original prompt where needed
                image_request_data = PersonaImageRequest(
                    name=prompt_derived_details.get("name", "Bot"),
                    description=prompt_derived_details.get(
                        "description", request.prompt
                    ),
                    gender=prompt_derived_details.get("gender", "male"),
                    characteristics=prompt_derived_details.get("characteristics", []),
                )
                # Construct a more detailed prompt for the image service if possible
                image_prompt_desc = image_request_data.description
                if image_request_data.gender:
                    image_prompt_desc = (
                        f"{image_request_data.gender.capitalize()}. {image_prompt_desc}"
                    )
                if image_request_data.characteristics:
                    traits = ", ".join(image_request_data.characteristics)
                    image_prompt_desc = (
                        f"{image_prompt_desc}. With features like {traits}"
                    )

                # Add standard quality guidelines
                image_prompt_desc += ". High quality, single person, only face and shoulders, centered, neutral background, avoid borders."

                generated_image_url = await image_service.generate_persona_image(
                    name=image_request_data.name,
                    prompt=image_prompt_desc,
                    style="realistic",
                    size=(512, 512),
                )
                if generated_image_url:
                    bot_image = generated_image_url
                    logger.info(f"Generated image: {bot_image}")
                else:
                    logger.error(
                        f"Failed to generate image from prompt derived details: No URL returned."
                    )
                    bot_image = None
            except Exception as e:
                logger.error(
                    f"Failed to generate image from prompt derived details: {e}"
                )
                bot_image = None

    # Ensure the bot_image is definitely a string or None before passing to 'create_meeting_bot
    bot_image_str = str(bot_image) if bot_image is not None else None
    if bot_image_str is not None:
        logger.info(f"Final bot image URL: {bot_image_str}")
    else:
        logger.info("No bot image URL resolved.")

    # Determine the final entry message
    final_entry_message: Optional[str] = request.entry_message
    if not final_entry_message and resolved_persona_data.get("entry_message"):
        final_entry_message = resolved_persona_data.get("entry_message")
    elif not final_entry_message and resolved_persona_data.get("is_temporary", False):
        # For temporary personas without a specified entry_message, provide a dynamic default
        final_entry_message = f"Hello, I'm {persona_name_for_logging}, ready to assist you throughout this session."

    # Create bot directly through MeetingBaas API
    # Use persona display name from resolved_persona_data for MeetingBaas API call
    # Use the websocket_url as the webhook_url (same base URL, different endpoint)
    webhook_url = f"{websocket_url}/webhook"
    meetingbaas_bot_id = create_meeting_bot(
        meeting_url=request.meeting_url,
        websocket_url=websocket_url,
        bot_id=bot_client_id,
        persona_name=resolved_persona_data.get(
            "name", persona_name_for_logging
        ),  # Use resolved display name
        api_key=api_key,
        bot_image=bot_image_str,  # Use the pre-stringified value
        entry_message=final_entry_message,
        extra=request.extra,
        streaming_audio_frequency=streaming_audio_frequency,
        webhook_url=webhook_url,
    )

    if meetingbaas_bot_id:
        # Update the meetingbaas_bot_id in MEETING_DETAILS
        # Convert tuple to list to allow assignment
        details = list(MEETING_DETAILS[bot_client_id])
        details[2] = meetingbaas_bot_id
        MEETING_DETAILS[bot_client_id] = tuple(details)

        # Log the client_id for internal reference
        logger.info(f"Bot created with MeetingBaas bot_id: {meetingbaas_bot_id}")
        logger.info(f"Internal client_id for WebSocket connections: {bot_client_id}")

        # Start the Pipecat process as a subprocess
        # The Pipecat process should connect to our LOCAL WebSocket server, not the external one
        pipecat_websocket_url = f"ws://localhost:7014/pipecat/{bot_client_id}"
        process = start_pipecat_process(
            client_id=bot_client_id,
            websocket_url=pipecat_websocket_url,  # Use internal URL, not external
            meeting_url=request.meeting_url,
            persona_data=resolved_persona_data,
            streaming_audio_frequency=streaming_audio_frequency,
            enable_tools=request.enable_tools,
            api_key=api_key,
            meetingbaas_bot_id=meetingbaas_bot_id,
        )

        # Store the process for later termination
        PIPECAT_PROCESSES[bot_client_id] = process

        # Return bot_id and client_id in the response
        return JoinResponse(bot_id=meetingbaas_bot_id, client_id=bot_client_id)
    else:
        # Clean up MEETING_DETAILS if bot creation failed
        if bot_client_id in MEETING_DETAILS:
            MEETING_DETAILS.pop(bot_client_id)

        return JSONResponse(
            content={
                "message": "Failed to create bot through MeetingBaas API",
                "status": "error",
            },
            status_code=500,
        )


@router.delete(
    "/bots/{bot_id}",
    tags=["bots"],
    response_model=Dict[str, Any],
    responses={
        200: {"description": "Bot successfully removed from meeting"},
        400: {"description": "Bad request - Missing required fields or identifiers"},
        404: {"description": "Bot not found - No bot with the specified ID"},
        500: {
            "description": "Server error - Failed to remove bot from MeetingBaas API"
        },
    },
)
async def leave_bot(
    bot_id: str,
    request: LeaveBotRequest,
    client_request: Request,
):
    """
    Remove a bot from a meeting by its ID.

    This will:
    1. Call the MeetingBaas API to make the bot leave
    2. Close WebSocket connections if they exist
    3. Terminate the associated Pipecat process
    """
    logger.info(f"Removing bot with ID: {bot_id}")
    # Get API key from request state (set by middleware)
    api_key = client_request.state.api_key

    # Verify we have the bot_id
    if not bot_id and not request.bot_id:
        return JSONResponse(
            content={
                "message": "Bot ID is required",
                "status": "error",
            },
            status_code=400,
        )

    # Use the path parameter bot_id if provided, otherwise use request.bot_id
    meetingbaas_bot_id = bot_id or request.bot_id
    client_id = None

    # Look through MEETING_DETAILS to find the client ID for this bot ID
    for cid, details in MEETING_DETAILS.items():
        # Check if the stored meetingbaas_bot_id matches
        if details[2] == meetingbaas_bot_id:  # Accessing tuple element by index
            client_id = cid
            logger.info(f"Found client ID {client_id} for bot ID {meetingbaas_bot_id}")
            break

    if not client_id:
        logger.warning(f"No client ID found for bot ID {meetingbaas_bot_id}")

    success = True

    # 1. Call MeetingBaas API to make the bot leave
    if meetingbaas_bot_id:
        logger.info(f"Removing bot with ID: {meetingbaas_bot_id} from MeetingBaas API")
        result = leave_meeting_bot(
            bot_id=meetingbaas_bot_id,
            api_key=api_key,
        )
        if not result:
            success = False
            logger.error(
                f"Failed to remove bot {meetingbaas_bot_id} from MeetingBaas API"
            )
    else:
        logger.warning("No MeetingBaas bot ID or API key found, skipping API call")

    # 2. Close WebSocket connections if they exist
    if client_id:
        # Mark the client as closing to prevent further messages
        message_router.mark_closing(client_id)

        # Close Pipecat WebSocket first
        if client_id in registry.pipecat_connections:
            try:
                await registry.disconnect(client_id, is_pipecat=True)
                logger.info(f"Closed Pipecat WebSocket for client {client_id}")
            except Exception as e:
                success = False
                logger.error(f"Error closing Pipecat WebSocket: {e}")

        # Then close client WebSockets (output/input) if they exist
        if registry.get_client_output(client_id):
            try:
                await registry.disconnect(client_id, client_direction="output")
                logger.info(f"Closed client OUTPUT WebSocket for client {client_id}")
            except Exception as e:
                success = False
                logger.error(f"Error closing client OUTPUT WebSocket: {e}")

        if registry.get_client_input(client_id):
            try:
                await registry.disconnect(client_id, client_direction="input")
                logger.info(f"Closed client INPUT WebSocket for client {client_id}")
            except Exception as e:
                success = False
                logger.error(f"Error closing client INPUT WebSocket: {e}")

        # Add a small delay to allow for clean disconnection
        await asyncio.sleep(0.5)

    # 3. Terminate the Pipecat process after WebSockets are closed
    if client_id and client_id in PIPECAT_PROCESSES:
        process = PIPECAT_PROCESSES[client_id]
        if process and process.poll() is None:  # If process is still running
            try:
                if terminate_process_gracefully(process, timeout=3.0):
                    logger.info(
                        f"Gracefully terminated Pipecat process for client {client_id}"
                    )
                else:
                    logger.warning(
                        f"Had to forcefully kill Pipecat process for client {client_id}"
                    )
            except Exception as e:
                success = False
                logger.error(f"Error terminating Pipecat process: {e}")

        # Remove from our storage
        PIPECAT_PROCESSES.pop(client_id, None)

        # Clean up meeting details
        if client_id in MEETING_DETAILS:
            MEETING_DETAILS.pop(client_id, None)

        # Release ngrok URL if in local dev mode
        if LOCAL_DEV_MODE and client_id:
            release_ngrok_url(client_id)
            log_ngrok_status()
    else:
        logger.warning(f"No Pipecat process found for client {client_id}")

    return {
        "message": "Bot removal request processed",
        "status": "success" if success else "partial",
        "bot_id": meetingbaas_bot_id,
    }


@router.post(
    "/personas/generate-image",
    tags=["personas"],
    response_model=PersonaImageResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Image successfully generated"},
        400: {"description": "Invalid request data"},
    },
)
async def generate_persona_image(request: PersonaImageRequest) -> PersonaImageResponse:
    """Generate an image for a persona using Replicate."""
    try:
        # Build the prompt from available fields
        # Build the prompt using a more concise approach
        name = request.name
        prompt = f"A detailed professional portrait of a single person named {name}"

        if request.gender:
            prompt += f". {request.gender.capitalize()}"

        if request.description:
            cleaned_desc = request.description.strip().rstrip(".")
            prompt += f". Who {cleaned_desc}"

        if request.characteristics and len(request.characteristics) > 0:
            traits = ", ".join(request.characteristics)
            prompt += f". With features like {traits}"

        # Add standard quality guidelines
        prompt += ". High quality, single person, only face and shoulders, centered, neutral background, avoid borders."

        # Generate the image
        image_generation_result = await image_service.generate_persona_image(
            name=name, prompt=prompt, style="realistic", size=(512, 512)
        )

        if not image_generation_result:  # Check if the string is empty/None
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to generate image: No URL returned.",
            )

        image_url = image_generation_result  # Use the string directly

        return PersonaImageResponse(
            name=name,
            image_url=image_url,
            generated_at=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        if isinstance(e, ValueError):
            # ValueError typically indicates invalid input
            status_code = status.HTTP_400_BAD_REQUEST
        elif "connection" in str(e).lower() or "timeout" in str(e).lower():
            # Network errors should be 503 Service Unavailable
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        else:
            # Default to internal server error
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(status_code=status_code, detail=str(e))


# =============================================================================
# Diadi Session Routes
# =============================================================================


@router.post(
    "/sessions",
    tags=["sessions"],
    response_model=CreateSessionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Session successfully created"},
        400: {"description": "Bad request - Missing required fields or invalid data"},
    },
)
async def create_session(
    request: CreateSessionRequest,
    client_request: Request,
):
    """
    Create a new Diadi facilitation session.

    Creates a session in pending_consent status and generates an invite token
    for the partner. The creator is implicitly consented.
    """
    try:
        # Get creator name from the first participant (creator)
        # For now, we use a placeholder - in production, this would come from auth
        creator_name = "Session Creator"

        session = await session_service.create_session(
            creator_name=creator_name,
            partner_name=request.partner_name,
            goal=request.goal,
            relationship_context=request.relationship_context,
            facilitator_config=request.facilitator,
            duration_minutes=request.duration_minutes,
            platform=request.platform,
            scheduled_at=request.scheduled_at,
            meeting_url=request.meeting_url,
            skip_consent=request.skip_consent,
        )

        # Build the invite link
        # In production, this would use BASE_URL or request headers
        base_url = (
            client_request.headers.get("x-forwarded-proto", "http")
            + "://"
            + client_request.headers.get("host", "localhost:7014")
        )
        invite_link = f"{base_url}/invite/{session.invite_token}"

        return CreateSessionResponse(
            id=session.id,
            session_id=session.id,
            status=session.status,
            invite_link=invite_link,
            invite_token=session.invite_token,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create session",
        )


@router.get(
    "/sessions",
    tags=["sessions"],
    response_model=SessionListResponse,
    responses={
        200: {"description": "List of sessions returned"},
    },
)
async def list_sessions(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """
    List all sessions, optionally filtered by status.

    Args:
        status_filter: Optional status to filter by (e.g., "draft", "in_progress").
        limit: Maximum number of sessions to return (default 50).
        offset: Number of sessions to skip for pagination (default 0).

    Returns:
        Object with sessions array, total count, and hasMore flag.
    """
    sessions = session_service.list_sessions(status=status_filter)

    # Apply pagination
    total = len(sessions)
    paginated_sessions = sessions[offset : offset + limit]
    has_more = (offset + limit) < total

    return SessionListResponse(
        sessions=paginated_sessions,
        total=total,
        hasMore=has_more,
    )


@router.get(
    "/sessions/invite/{invite_token}",
    tags=["sessions"],
    response_model=Session,
    responses={
        200: {"description": "Session details returned"},
        404: {"description": "Session not found for invite token"},
    },
)
async def get_session_by_invite_token(invite_token: str):
    """
    Get a session by its invite token.

    This endpoint is used by partners to view session details before consenting.
    The invite token is included in the invite link shared by the session creator.

    Args:
        invite_token: The unique invite token from the invite link.

    Returns:
        The Session object (with limited fields for privacy).

    Raises:
        HTTPException: 404 if no session found for the invite token.
    """
    session = session_service.get_session_by_invite_token(invite_token)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found for invite token",
        )

    return session


@router.get(
    "/sessions/{session_id}",
    tags=["sessions"],
    response_model=Session,
    responses={
        200: {"description": "Session details returned"},
        404: {"description": "Session not found"},
    },
)
async def get_session(session_id: str):
    """
    Get a single session by ID.

    Args:
        session_id: The unique session identifier.

    Returns:
        The Session object.

    Raises:
        HTTPException: 404 if session not found.
    """
    session = session_service.get_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return session


@router.post(
    "/sessions/{session_id}/consent",
    tags=["sessions"],
    response_model=ConsentResponse,
    responses={
        200: {"description": "Consent recorded successfully"},
        400: {"description": "Invalid invite token or consent already recorded"},
        404: {"description": "Session not found"},
    },
)
async def record_consent(session_id: str, request: ConsentRequest):
    """
    Record partner consent for a session.

    When a partner receives an invite link, they view the session details and
    can choose to consent or decline. This endpoint records their decision.

    - If consented: Partner is added to participants, and if both parties have
      consented, the session status transitions to "ready".
    - If declined: The session is archived privately (creator is not notified
      of the specific reason).

    Args:
        session_id: The session identifier.
        request: ConsentRequest with invite_token, invitee_name, and consented flag.

    Returns:
        ConsentResponse with updated status and participants list.

    Raises:
        HTTPException: 404 if session not found, 400 if invalid token.
    """
    try:
        session = await session_service.record_consent(
            session_id=session_id,
            invite_token=request.invite_token,
            invitee_name=request.invitee_name,
            consented=request.consented,
        )

        return ConsentResponse(
            status=session.status,
            participants=session.participants,
        )

    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )
    except Exception as e:
        logger.error(f"Error recording consent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record consent",
        )


@router.post(
    "/sessions/{session_id}/start",
    tags=["sessions"],
    response_model=StartSessionResponse,
    responses={
        200: {"description": "Session started successfully"},
        400: {"description": "Session not ready to start or invalid request"},
        404: {"description": "Session not found"},
        500: {"description": "Failed to start session (MeetingBaas or Pipecat error)"},
    },
)
async def start_session(
    session_id: str,
    request: StartSessionRequest,
    client_request: Request,
):
    """
    Start a Diadi facilitation session.

    This endpoint initiates the live session by:
    1. Loading the configured facilitator persona
    2. Creating a MeetingBaas bot to join the meeting
    3. Starting a Pipecat process for AI audio pipeline
    4. Transitioning the session status to "in_progress"

    Prerequisites:
    - Session must exist and be in "ready" status (both participants consented)
    - A valid meeting URL must be provided

    Args:
        session_id: The session identifier.
        request: StartSessionRequest with meeting_url.

    Returns:
        StartSessionResponse with status, bot_id, client_id, and event_url.

    Raises:
        HTTPException: 404 if session not found, 400 if not ready, 500 if start fails.
    """
    # Get API key from request state (set by middleware)
    api_key = client_request.state.api_key

    # Determine WebSocket base URL for MeetingBaas
    websocket_url, _ = determine_websocket_url(None, client_request)

    try:
        result = await session_service.start_session(
            session_id=session_id,
            meeting_url=request.meeting_url,
            api_key=api_key,
            websocket_base_url=websocket_url,
        )

        return StartSessionResponse(
            status=result["status"],
            bot_id=result["bot_id"],
            client_id=result["client_id"],
            event_url=result["event_url"],
        )

    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )
    except RuntimeError as e:
        logger.error(f"Failed to start session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Unexpected error starting session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start session",
        )


@router.post(
    "/sessions/{session_id}/pause",
    tags=["sessions"],
    response_model=PauseResumeResponse,
    responses={
        200: {"description": "Facilitation paused successfully"},
        400: {"description": "Session not in progress"},
        404: {"description": "Session not found"},
    },
)
async def pause_session(session_id: str):
    """
    Pause AI facilitation for a session (kill switch).

    This immediately pauses AI interventions while keeping the session active.
    The session status transitions from "in_progress" to "paused".
    Participants can still continue their conversation without AI assistance.

    Args:
        session_id: The session identifier.

    Returns:
        PauseResumeResponse with status "paused".

    Raises:
        HTTPException: 404 if session not found, 400 if not in progress.
    """
    try:
        session = await session_service.pause_facilitation(session_id)
        return PauseResumeResponse(status=session.status)

    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )
    except Exception as e:
        logger.error(f"Error pausing session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to pause session",
        )


@router.post(
    "/sessions/{session_id}/resume",
    tags=["sessions"],
    response_model=PauseResumeResponse,
    responses={
        200: {"description": "Facilitation resumed successfully"},
        400: {"description": "Session not paused"},
        404: {"description": "Session not found"},
    },
)
async def resume_session(session_id: str):
    """
    Resume AI facilitation for a paused session.

    This re-enables AI interventions for a previously paused session.
    The session status transitions from "paused" back to "in_progress".

    Args:
        session_id: The session identifier.

    Returns:
        PauseResumeResponse with status "in_progress".

    Raises:
        HTTPException: 404 if session not found, 400 if not paused.
    """
    try:
        session = await session_service.resume_facilitation(session_id)
        return PauseResumeResponse(status=session.status)

    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )
    except Exception as e:
        logger.error(f"Error resuming session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resume session",
        )


@router.post(
    "/sessions/{session_id}/end",
    tags=["sessions"],
    response_model=EndSessionResponse,
    responses={
        200: {"description": "Session ended successfully"},
        400: {"description": "Session cannot be ended (not in progress or paused)"},
        404: {"description": "Session not found"},
    },
)
async def end_session(session_id: str, client_request: Request):
    """
    End a Diadi facilitation session.

    This endpoint ends the session by:
    1. Terminating the Pipecat AI process
    2. Making the MeetingBaas bot leave the meeting
    3. Closing all WebSocket connections
    4. Cleaning up in-memory state
    5. Broadcasting session end event to connected clients
    6. Triggering async summary generation

    The session must be in "in_progress" or "paused" status to be ended.

    Args:
        session_id: The session identifier.

    Returns:
        EndSessionResponse with status "ended" and summaryAvailable flag.

    Raises:
        HTTPException: 404 if session not found, 400 if session cannot be ended.
    """
    # Get API key from request state (set by middleware)
    api_key = client_request.state.api_key

    try:
        result = await session_service.end_session(
            session_id=session_id,
            api_key=api_key,
        )

        return EndSessionResponse(
            status=result["status"],
            summary_available=result["summary_available"],
        )

    except ValueError as e:
        error_message = str(e)
        if "not found" in error_message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_message,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_message,
            )
    except Exception as e:
        logger.error(f"Error ending session {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to end session",
        )


@router.get(
    "/sessions/{session_id}/summary",
    tags=["sessions"],
    response_model=SessionSummary,
    responses={
        200: {"description": "Session summary returned"},
        404: {"description": "Session not found or summary not available"},
    },
)
async def get_session_summary(session_id: str, client_request: Request):
    """
    Get the summary for a completed session.

    Returns the AI-generated summary including:
    - Consensus summary of the conversation
    - Key agreements reached
    - Action items identified
    - Talk balance metrics
    - Intervention count

    The summary is generated asynchronously when a session ends.
    It may take a few seconds to become available after session end.

    Args:
        session_id: The session identifier.

    Returns:
        SessionSummary object with conversation insights.

    Raises:
        HTTPException: 404 if session not found or summary not yet available.
    """
    # Import here to avoid circular dependency
    from core.session_store import get_session, get_summary

    # First check if the session exists
    session = get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Get the summary
    summary = get_summary(session_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not available",
        )

    return summary


@router.post(
    "/webhook",
    tags=["webhook"],
    status_code=status.HTTP_200_OK,
)
async def meetingbaas_webhook(request: Request):
    """
    Webhook endpoint for MeetingBaas callbacks.

    Receives events like bot_joined, bot_left, transcription, etc.
    """
    try:
        body = await request.json()
        logger.info(f"Received MeetingBaas webhook: {body}")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        return {"status": "error", "message": str(e)}
