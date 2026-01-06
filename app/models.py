"""Data models for the Speaking Meeting Bot API."""

from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


# =============================================================================
# Diadi Session Models
# =============================================================================


class SessionStatus(str, Enum):
    """Status of a Diadi facilitation session."""

    DRAFT = "draft"
    PENDING_CONSENT = "pending_consent"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    ENDED = "ended"
    ARCHIVED = "archived"


class Platform(str, Enum):
    """Meeting platform for the session."""

    ZOOM = "zoom"
    MEET = "meet"
    TEAMS = "teams"
    DIADI = "diadi"  # Future: native video


class FacilitatorPersona(str, Enum):
    """Available facilitator personas."""

    NEUTRAL_MEDIATOR = "neutral_mediator"
    DEEP_EMPATH = "deep_empath"
    DECISION_CATALYST = "decision_catalyst"


class InterventionType(str, Enum):
    """Types of AI interventions."""

    BALANCE = "balance"
    SILENCE = "silence"
    GOAL_DRIFT = "goal_drift"
    TIME_WARNING = "time_warning"
    ESCALATION = "escalation"
    ICEBREAKER = "icebreaker"


class InterventionModality(str, Enum):
    """How the intervention is delivered."""

    VISUAL = "visual"
    VOICE = "voice"


class Participant(BaseModel):
    """A participant in a Diadi session."""

    id: str = Field(..., description="Unique identifier for the participant")
    name: str = Field(..., description="Display name of the participant")
    role: str = Field(
        ..., description="Role in the session: 'creator' or 'invitee'"
    )
    consented: bool = Field(
        default=False, description="Whether the participant has consented to AI facilitation"
    )


class FacilitatorConfig(BaseModel):
    """Configuration for the AI facilitator."""

    persona: FacilitatorPersona = Field(
        default=FacilitatorPersona.NEUTRAL_MEDIATOR,
        description="The facilitator persona to use",
    )
    interrupt_authority: bool = Field(
        default=True,
        description="Facilitator may pause speakers to clarify",
    )
    direct_inquiry: bool = Field(
        default=True,
        description="Asks challenging, data-driven questions",
    )
    silence_detection: bool = Field(
        default=False,
        description="Nudges room if silence > 20s",
    )


class Session(BaseModel):
    """A Diadi facilitation session."""

    id: str = Field(..., description="Unique session identifier")
    title: Optional[str] = Field(None, description="Optional session title")
    goal: str = Field(..., max_length=200, description="Session goal (max 200 chars)")
    relationship_context: str = Field(
        ..., description="Description of the relationship dynamic"
    )
    partner_name: str = Field(..., description="Name of the invited partner")
    platform: Platform = Field(
        default=Platform.MEET, description="Meeting platform to use"
    )
    meeting_url: Optional[str] = Field(
        None, description="URL of the external meeting"
    )
    duration_minutes: int = Field(
        default=30, description="Planned session duration in minutes"
    )
    scheduled_at: Optional[str] = Field(
        None, description="ISO8601 timestamp for scheduled sessions"
    )
    status: SessionStatus = Field(
        default=SessionStatus.DRAFT, description="Current session status"
    )
    participants: List[Participant] = Field(
        default_factory=list, description="Session participants"
    )
    facilitator: FacilitatorConfig = Field(
        default_factory=FacilitatorConfig, description="Facilitator configuration"
    )
    created_at: str = Field(..., description="ISO8601 timestamp of creation")
    invite_token: str = Field(..., description="Token for partner invitation link")
    bot_id: Optional[str] = Field(
        None, description="MeetingBaas bot ID when session is active"
    )
    client_id: Optional[str] = Field(
        None, description="Internal client ID for WebSocket routing"
    )


class TalkBalanceMetrics(BaseModel):
    """Talk balance metrics for a session."""

    participant_a: Dict[str, Any] = Field(
        ..., description="Metrics for participant A: {id, name, percentage}"
    )
    participant_b: Dict[str, Any] = Field(
        ..., description="Metrics for participant B: {id, name, percentage}"
    )
    status: str = Field(
        ...,
        description="Balance status: 'balanced', 'mild_imbalance', or 'severe_imbalance'",
    )


class InterventionRecord(BaseModel):
    """Record of an intervention during a session."""

    id: str = Field(..., description="Unique intervention identifier")
    type: InterventionType = Field(..., description="Type of intervention")
    modality: InterventionModality = Field(
        ..., description="How the intervention was delivered"
    )
    message: str = Field(..., description="The intervention message")
    target_participant: Optional[str] = Field(
        None, description="ID of the targeted participant, if any"
    )
    created_at: str = Field(..., description="ISO8601 timestamp")


class SessionSummary(BaseModel):
    """Post-session summary."""

    session_id: str = Field(..., description="ID of the session")
    duration_minutes: int = Field(..., description="Actual session duration")
    consensus_summary: str = Field(..., description="AI-generated summary of consensus")
    action_items: List[str] = Field(
        default_factory=list, description="List of action items"
    )
    balance: TalkBalanceMetrics = Field(..., description="Final talk balance metrics")
    intervention_count: int = Field(
        ..., description="Number of interventions during session"
    )
    key_agreements: List[Dict[str, str]] = Field(
        default_factory=list,
        description="Key agreements reached: [{title, description}]",
    )


# Session API Request/Response Models


class CreateSessionRequest(BaseModel):
    """Request to create a new session."""

    goal: str = Field(..., max_length=200, description="Session goal (max 200 chars)")
    relationship_context: str = Field(
        ..., description="Description of the relationship dynamic"
    )
    partner_name: str = Field(..., description="Name of the invited partner")
    facilitator: FacilitatorConfig = Field(
        default_factory=FacilitatorConfig, description="Facilitator configuration"
    )
    duration_minutes: int = Field(default=30, description="Session duration in minutes")
    scheduled_at: Optional[str] = Field(
        None, description="ISO8601 timestamp for scheduled sessions, or null for immediate"
    )
    platform: Platform = Field(default=Platform.MEET, description="Meeting platform")

    class Config:
        json_schema_extra = {
            "example": {
                "goal": "Discuss our equity split and reach agreement on fair terms",
                "relationship_context": "Co-founders, 3 years working together, high trust but recent friction",
                "partner_name": "David Miller",
                "facilitator": {
                    "persona": "neutral_mediator",
                    "interrupt_authority": True,
                    "direct_inquiry": True,
                    "silence_detection": False,
                },
                "duration_minutes": 45,
                "scheduled_at": None,
                "platform": "meet",
            }
        }


class CreateSessionResponse(BaseModel):
    """Response after creating a session."""

    session_id: str = Field(..., description="Unique session identifier")
    status: SessionStatus = Field(..., description="Session status (draft)")
    invite_link: str = Field(..., description="Full URL for partner invitation")
    invite_token: str = Field(..., description="Token for invitation")


class ConsentRequest(BaseModel):
    """Request to record consent for a session."""

    invite_token: str = Field(..., description="Invitation token from the invite link")
    invitee_name: str = Field(..., description="Name of the invitee")
    consented: bool = Field(..., description="Whether the invitee consents")


class ConsentResponse(BaseModel):
    """Response after recording consent."""

    status: SessionStatus = Field(..., description="Updated session status")
    participants: List[Participant] = Field(..., description="Updated participants list")


class StartSessionRequest(BaseModel):
    """Request to start a session."""

    meeting_url: str = Field(..., description="URL of the meeting to join")


class StartSessionResponse(BaseModel):
    """Response after starting a session."""

    status: SessionStatus = Field(..., description="Session status (in_progress)")
    bot_id: str = Field(..., description="MeetingBaas bot ID")
    client_id: str = Field(..., description="Internal client ID")
    event_url: str = Field(..., description="WebSocket URL for session events")


class EndSessionResponse(BaseModel):
    """Response after ending a session."""

    status: SessionStatus = Field(..., description="Session status (ended)")
    summary_available: bool = Field(
        ..., description="Whether the summary is ready"
    )


class SessionListResponse(BaseModel):
    """Response for listing sessions."""

    sessions: List[Session] = Field(..., description="List of sessions")
    total: int = Field(..., description="Total number of sessions")
    has_more: bool = Field(..., description="Whether there are more sessions")


# =============================================================================
# Original Bot Models
# =============================================================================


class BotRequest(BaseModel):
    """Request model for creating a speaking bot in a meeting."""

    # Define ONLY the fields we want in our API
    meeting_url: str = Field(
        ...,
        description="URL of the Google Meet, Zoom or Microsoft Teams meeting to join",
    )
    bot_name: str = Field("", description="Name to display for the bot in the meeting")
    personas: Optional[List[str]] = Field(
        None,
        description="List of persona names to use. The first available will be selected.",
    )
    bot_image: Optional[str] = None
    entry_message: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None
    enable_tools: bool = True
    prompt: Optional[str] = None

    # NOTE: streaming_audio_frequency is intentionally excluded and handled internally

    class Config:
        json_schema_extra = {
            "example": {
                "meeting_url": "https://meet.google.com/abc-defg-hij",
                "bot_name": "Meeting Assistant",
                "personas": ["helpful_assistant", "meeting_facilitator"],
                "bot_image": "https://example.com/bot-avatar.png",
                "entry_message": "Hello! I'm here to assist with the meeting.",
                "enable_tools": True,
                "extra": {"company": "ACME Corp", "meeting_purpose": "Weekly sync"},
                "prompt": "You are Meeting Assistant, a concise and professional \
                AI bot that helps summarize key points and keep the meeting on track. Speak clearly and stay on topic."
            }
        }

class JoinResponse(BaseModel):
    """Response model for a bot joining a meeting"""

    bot_id: str = Field(
        ...,
        description="The MeetingBaas bot ID used for API operations with MeetingBaas",
    )


class LeaveResponse(BaseModel):
    """Response model for a bot leaving a meeting"""

    ok: bool


class LeaveBotRequest(BaseModel):
    """Request model for making a bot leave a meeting"""

    bot_id: Optional[str] = Field(
        None,
        description="The MeetingBaas bot ID to remove from the meeting. This will also close the WebSocket connection made through Pipecat by this bot.",
    )


class PersonaImageRequest(BaseModel):
    """Request model for generating persona images."""
    name: str = Field(..., description="Name of the persona")
    description: str = Field(None, description="Description of the persona")
    gender: Optional[str] = Field(None, description="Gender of the persona")
    characteristics: Optional[List[str]] = Field(None, description="List of characteristics like blue eyes, etc.")

class PersonaImageResponse(BaseModel):
    """Response model for generated persona images."""
    name: str = Field(..., description="Name of the persona")
    image_url: str = Field(..., description="URL of the generated image")
    generated_at: datetime = Field(..., description="Timestamp of generation")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
