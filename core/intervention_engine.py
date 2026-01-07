"""Intervention engine for AI facilitation decisions.

The InterventionEngine monitors session metrics and decides when and how
to intervene to maintain healthy conversation dynamics. It follows a
minimal intervention philosophy: visual-first, voice only for severe cases.

Intervention Policy (from requirements):
- No more than 1 intervention every 2 minutes
- No interventions in first 3 minutes
- Visual-first, voice only for severe cases
- Respects blockers (mid-sentence, emotional disclosure, etc.)

Intervention Priority Order:
1. Escalation (tension > 0.7 for 30s) - Voice
2. Severe Balance (>70/30 for 5 min) - Voice
3. Time Warning (<5 min remaining) - Visual
4. Silence (>15 seconds) - Visual
5. Mild Balance (>65/35 for 3 min) - Visual
6. Goal Drift (off-goal >2 min) - Visual
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid


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

    VISUAL = "visual"  # Visual prompt in the UI
    VOICE = "voice"  # Spoken by the AI facilitator


class InterventionPriority(str, Enum):
    """Priority levels for intervention queuing."""

    CRITICAL = "critical"  # Escalation detection
    HIGH = "high"  # Severe balance, voice interventions
    MEDIUM = "medium"  # Time warning, standard balance
    LOW = "low"  # Silence, goal drift


@dataclass
class Intervention:
    """An AI intervention to be delivered to participants.

    Attributes:
        id: Unique identifier for tracking.
        type: Type of intervention (balance, silence, etc.).
        modality: How it's delivered (visual or voice).
        message: The intervention message to display/speak.
        target_participant: ID of participant to address (if applicable).
        priority: Priority level for queuing.
        created_at: When the intervention was created.
        metadata: Additional context (e.g., balance percentages).
    """

    type: InterventionType
    modality: InterventionModality
    message: str
    target_participant: Optional[str] = None
    priority: InterventionPriority = InterventionPriority.MEDIUM
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "type": self.type.value,
            "modality": self.modality.value,
            "message": self.message,
            "target_participant": self.target_participant,
            "priority": self.priority.value,
            "created_at": self.created_at.isoformat(),
            "metadata": self.metadata,
        }


# =============================================================================
# Intervention Templates
# =============================================================================


class InterventionTemplates:
    """Pre-written intervention message templates.

    Templates follow the Diadi voice: warm, neutral, non-judgmental.
    Placeholders:
      - {name}: Target participant's name
      - {minutes}: Time remaining
      - {topic}: Conversation topic/goal
    """

    # Balance interventions
    BALANCE_VISUAL = "{name} hasn't shared their perspective yet"
    BALANCE_VISUAL_ALT = "I notice {name} has been quieter - would you like to share?"
    BALANCE_VOICE = (
        "I notice the conversation has been a bit one-sided. "
        "{name}, would you like to share your thoughts?"
    )
    BALANCE_VOICE_GENTLE = (
        "Thank you for sharing. {name}, what's your perspective on this?"
    )

    # Silence interventions
    SILENCE_VISUAL = "Taking a moment..."
    SILENCE_GENTLE = "It's okay to pause. When you're ready..."

    # Time warning interventions
    TIME_5_MIN = "You have about 5 minutes left."
    TIME_5_MIN_TOPIC = (
        "You have about 5 minutes left. You mentioned wanting to discuss "
        "{topic} - would you like to touch on that?"
    )
    TIME_2_MIN = "About 2 minutes remaining."
    TIME_1_MIN = "One minute left to wrap up."

    # Goal drift interventions
    GOAL_DRIFT_VISUAL = "Shall we return to the topic?"
    GOAL_DRIFT_VOICE = (
        "I notice we've drifted a bit from the original goal. "
        "Would you like to return to discussing {topic}?"
    )

    # Escalation interventions
    ESCALATION_PAUSE = "I sense some tension rising. Would a 2-minute break help?"
    ESCALATION_GROUNDING = (
        "Let's take a moment. Would a brief breathing exercise help before continuing?"
    )
    ESCALATION_ACKNOWLEDGE = (
        "I can see this topic brings up strong feelings. "
        "That's understandable. Would you like to pause?"
    )

    # Icebreaker interventions
    ICEBREAKER_START = (
        "Welcome both. Before we begin, I'd like each of you to "
        "share one thing you appreciate about your relationship."
    )
    ICEBREAKER_GOAL = (
        "To start us off: What would a successful outcome "
        "from this conversation look like for each of you?"
    )


# =============================================================================
# Intervention Engine
# =============================================================================


class InterventionEngine:
    """Decides when and how to intervene during a facilitated session.

    The engine monitors various session metrics and determines if an
    intervention is warranted. It implements the minimal intervention
    philosophy: intervene only when genuinely helpful, prefer visual
    over voice, and respect natural conversation flow.

    Configuration (from requirements):
        - MIN_INTERVENTION_INTERVAL: 30 seconds between any interventions
        - COOLDOWN_PERIOD: 2 minutes for same-type interventions
        - FIRST_MINUTES_QUIET: 3 minutes grace period at start
        - SILENCE_THRESHOLD: 15 seconds of silence triggers prompt
        - TIME_WARNING_THRESHOLD: 5 minutes remaining triggers warning

    Intervention Blockers:
        - Mid-sentence (speaker actively talking)
        - Emotional disclosure in progress
        - Repair attempt in progress (apology, reconciliation)
        - Too soon since last intervention
        - First 3 minutes of session
        - Grief or crisis expression
    """

    # Configurable thresholds
    MIN_INTERVENTION_INTERVAL = timedelta(seconds=30)
    COOLDOWN_PERIOD = timedelta(minutes=2)
    SILENCE_THRESHOLD = timedelta(seconds=15)
    FIRST_MINUTES_QUIET = timedelta(minutes=3)
    GOAL_DRIFT_THRESHOLD = timedelta(minutes=2)

    # Time warning thresholds
    TIME_WARNING_5_MIN = timedelta(minutes=5)
    TIME_WARNING_2_MIN = timedelta(minutes=2)
    TIME_WARNING_1_MIN = timedelta(minutes=1)

    # Escalation thresholds
    TENSION_THRESHOLD = 0.7
    TENSION_DURATION = timedelta(seconds=30)

    def __init__(
        self,
        session_id: str,
        session_start: datetime,
        session_duration_minutes: int = 30,
        facilitator_config: Optional[Dict[str, Any]] = None,
    ):
        """Initialize the intervention engine.

        Args:
            session_id: Unique session identifier.
            session_start: When the session started.
            session_duration_minutes: Planned session duration.
            facilitator_config: Configuration dict with:
                - interrupt_authority: Can interrupt speakers
                - direct_inquiry: Can ask probing questions
                - silence_detection: React to silence
        """
        self.session_id = session_id
        self.session_start = session_start
        self.session_duration = timedelta(minutes=session_duration_minutes)

        # Facilitator configuration
        config = facilitator_config or {}
        self.interrupt_authority = config.get("interrupt_authority", True)
        self.direct_inquiry = config.get("direct_inquiry", True)
        self.silence_detection = config.get("silence_detection", False)

        # Intervention tracking
        self.last_intervention: Optional[datetime] = None
        self.last_intervention_by_type: Dict[InterventionType, datetime] = {}
        self.intervention_count = 0
        self.intervention_history: List[Intervention] = []

        # Blocker states
        self.is_mid_sentence = False
        self.emotional_disclosure = False
        self.repair_in_progress = False
        self.crisis_detected = False
        self.is_paused = False

        # Tracking state for duration-based triggers
        self.tension_start: Optional[datetime] = None
        self.goal_drift_start: Optional[datetime] = None
        self.silence_start: Optional[datetime] = None

        # Time warning tracking (only trigger once per threshold)
        self.time_warnings_sent: List[timedelta] = []

        # Participant names for templates
        self.participant_names: Dict[str, str] = {}

    def set_participant_names(self, names: Dict[str, str]) -> None:
        """Set participant ID to name mapping for message templates.

        Args:
            names: Dict mapping participant IDs to display names.
        """
        self.participant_names = names

    def set_blocker(self, blocker: str, active: bool) -> None:
        """Set or clear a blocker condition.

        Args:
            blocker: One of "mid_sentence", "emotional_disclosure",
                     "repair_in_progress", "crisis_detected".
            active: Whether the blocker is currently active.
        """
        if blocker == "mid_sentence":
            self.is_mid_sentence = active
        elif blocker == "emotional_disclosure":
            self.emotional_disclosure = active
        elif blocker == "repair_in_progress":
            self.repair_in_progress = active
        elif blocker == "crisis_detected":
            self.crisis_detected = active

    def pause(self) -> None:
        """Pause the intervention engine (kill switch activated)."""
        self.is_paused = True

    def resume(self) -> None:
        """Resume the intervention engine."""
        self.is_paused = False
        # Reset duration trackers to avoid immediate interventions
        self.tension_start = None
        self.goal_drift_start = None
        self.silence_start = None

    def get_session_elapsed(self) -> timedelta:
        """Get time elapsed since session start."""
        return datetime.utcnow() - self.session_start

    def get_time_remaining(self) -> timedelta:
        """Get time remaining in the session."""
        elapsed = self.get_session_elapsed()
        remaining = self.session_duration - elapsed
        return max(remaining, timedelta(0))

    def can_intervene(
        self, intervention_type: Optional[InterventionType] = None
    ) -> bool:
        """Check if intervention is allowed right now.

        Evaluates all blocker conditions and timing constraints.

        Args:
            intervention_type: Optional type to check type-specific cooldown.

        Returns:
            True if intervention is allowed, False otherwise.
        """
        # Kill switch active
        if self.is_paused:
            return False

        now = datetime.utcnow()

        # First 3 minutes: no interventions (except icebreaker)
        if intervention_type != InterventionType.ICEBREAKER:
            if self.get_session_elapsed() < self.FIRST_MINUTES_QUIET:
                return False

        # Global cooldown since last intervention
        if self.last_intervention:
            if (now - self.last_intervention) < self.MIN_INTERVENTION_INTERVAL:
                return False

        # Type-specific cooldown
        if intervention_type and intervention_type in self.last_intervention_by_type:
            last_of_type = self.last_intervention_by_type[intervention_type]
            if (now - last_of_type) < self.COOLDOWN_PERIOD:
                return False

        # Blocker conditions
        if self.is_mid_sentence and self.interrupt_authority is False:
            return False

        if self.emotional_disclosure:
            return False

        if self.repair_in_progress:
            return False

        if self.crisis_detected:
            # Crisis = escalate to human support, not AI intervention
            return False

        return True

    def evaluate(
        self,
        balance_status: str,
        balance_result: Optional[Dict[str, Any]] = None,
        silence_duration: Optional[timedelta] = None,
        tension_score: float = 0.0,
        is_on_goal: bool = True,
        session_goal: str = "",
    ) -> Optional[Intervention]:
        """Evaluate current conditions and return intervention if needed.

        Checks conditions in priority order and returns the highest
        priority intervention that should be triggered.

        Args:
            balance_status: "balanced", "mild_imbalance", or "severe_imbalance".
            balance_result: Full balance data with participant info.
            silence_duration: How long the conversation has been silent.
            tension_score: 0.0-1.0 tension level from sentiment analysis.
            is_on_goal: Whether conversation is on topic.
            session_goal: The session goal for context in messages.

        Returns:
            Intervention object if one should trigger, None otherwise.
        """
        # Priority order evaluation
        # 1. Escalation (highest priority)
        intervention = self._check_escalation(tension_score)
        if intervention:
            return intervention

        # 2. Severe balance (voice intervention)
        intervention = self._check_severe_balance(balance_status, balance_result)
        if intervention:
            return intervention

        # 3. Time warnings
        intervention = self._check_time_warning(session_goal)
        if intervention:
            return intervention

        # 4. Silence detection
        if self.silence_detection and silence_duration:
            intervention = self._check_silence(silence_duration)
            if intervention:
                return intervention

        # 5. Mild balance (visual intervention)
        intervention = self._check_mild_balance(balance_status, balance_result)
        if intervention:
            return intervention

        # 6. Goal drift
        intervention = self._check_goal_drift(is_on_goal, session_goal)
        if intervention:
            return intervention

        return None

    def _check_escalation(self, tension_score: float) -> Optional[Intervention]:
        """Check for escalation condition.

        Triggers voice intervention when tension > 0.7 for 30+ seconds.
        """
        now = datetime.utcnow()

        if tension_score > self.TENSION_THRESHOLD:
            if self.tension_start is None:
                self.tension_start = now
            elif (now - self.tension_start) >= self.TENSION_DURATION:
                if self.can_intervene(InterventionType.ESCALATION):
                    return self._create_intervention(
                        InterventionType.ESCALATION,
                        InterventionModality.VOICE,
                        InterventionTemplates.ESCALATION_PAUSE,
                        priority=InterventionPriority.CRITICAL,
                        metadata={"tension_score": tension_score},
                    )
        else:
            # Reset tension timer when below threshold
            self.tension_start = None

        return None

    def _check_severe_balance(
        self, balance_status: str, balance_result: Optional[Dict[str, Any]]
    ) -> Optional[Intervention]:
        """Check for severe balance imbalance.

        Triggers voice intervention for >70/30 balance sustained.
        Note: Duration tracking is handled by BalanceTracker.
        """
        if balance_status != "severe_imbalance":
            return None

        if not self.can_intervene(InterventionType.BALANCE):
            return None

        # Get quiet participant name for personalized message
        quiet_name = self._get_quiet_participant_name(balance_result)
        message = InterventionTemplates.BALANCE_VOICE.format(name=quiet_name)

        return self._create_intervention(
            InterventionType.BALANCE,
            InterventionModality.VOICE,
            message,
            target_participant=balance_result.get("quiet_speaker")
            if balance_result
            else None,
            priority=InterventionPriority.HIGH,
            metadata={
                "balance_status": balance_status,
                "balance_result": balance_result,
            },
        )

    def _check_time_warning(self, session_goal: str) -> Optional[Intervention]:
        """Check if time warning should be shown.

        Triggers at 5 min, 2 min, and 1 min remaining (once each).
        """
        if not self.can_intervene(InterventionType.TIME_WARNING):
            return None

        remaining = self.get_time_remaining()

        # Check thresholds in order (only one per threshold)
        for threshold, template in [
            (self.TIME_WARNING_5_MIN, InterventionTemplates.TIME_5_MIN_TOPIC),
            (self.TIME_WARNING_2_MIN, InterventionTemplates.TIME_2_MIN),
            (self.TIME_WARNING_1_MIN, InterventionTemplates.TIME_1_MIN),
        ]:
            if remaining <= threshold and threshold not in self.time_warnings_sent:
                self.time_warnings_sent.append(threshold)
                message = template
                if "{topic}" in message:
                    message = message.format(topic=session_goal or "your goal")

                return self._create_intervention(
                    InterventionType.TIME_WARNING,
                    InterventionModality.VISUAL,
                    message,
                    priority=InterventionPriority.MEDIUM,
                    metadata={"time_remaining_seconds": remaining.total_seconds()},
                )

        return None

    def _check_silence(self, silence_duration: timedelta) -> Optional[Intervention]:
        """Check for extended silence.

        Triggers visual prompt when silence > 15 seconds.
        """
        if silence_duration < self.SILENCE_THRESHOLD:
            self.silence_start = None
            return None

        if not self.can_intervene(InterventionType.SILENCE):
            return None

        return self._create_intervention(
            InterventionType.SILENCE,
            InterventionModality.VISUAL,
            InterventionTemplates.SILENCE_VISUAL,
            priority=InterventionPriority.LOW,
            metadata={"silence_seconds": silence_duration.total_seconds()},
        )

    def _check_mild_balance(
        self, balance_status: str, balance_result: Optional[Dict[str, Any]]
    ) -> Optional[Intervention]:
        """Check for mild balance imbalance.

        Triggers visual intervention for >65/35 balance sustained.
        """
        if balance_status != "mild_imbalance":
            return None

        if not self.can_intervene(InterventionType.BALANCE):
            return None

        quiet_name = self._get_quiet_participant_name(balance_result)
        message = InterventionTemplates.BALANCE_VISUAL.format(name=quiet_name)

        return self._create_intervention(
            InterventionType.BALANCE,
            InterventionModality.VISUAL,
            message,
            target_participant=balance_result.get("quiet_speaker")
            if balance_result
            else None,
            priority=InterventionPriority.MEDIUM,
            metadata={"balance_status": balance_status},
        )

    def _check_goal_drift(
        self, is_on_goal: bool, session_goal: str
    ) -> Optional[Intervention]:
        """Check for goal drift.

        Triggers visual prompt when off-goal for > 2 minutes.
        """
        now = datetime.utcnow()

        if not is_on_goal:
            if self.goal_drift_start is None:
                self.goal_drift_start = now
            elif (now - self.goal_drift_start) >= self.GOAL_DRIFT_THRESHOLD:
                if self.can_intervene(InterventionType.GOAL_DRIFT):
                    return self._create_intervention(
                        InterventionType.GOAL_DRIFT,
                        InterventionModality.VISUAL,
                        InterventionTemplates.GOAL_DRIFT_VISUAL,
                        priority=InterventionPriority.LOW,
                        metadata={"session_goal": session_goal},
                    )
        else:
            # Reset goal drift timer when back on topic
            self.goal_drift_start = None

        return None

    def create_icebreaker(self, session_goal: str = "") -> Optional[Intervention]:
        """Create an icebreaker intervention for session start.

        Called explicitly at session start, not part of regular evaluation.

        Args:
            session_goal: Session goal for context.

        Returns:
            Icebreaker intervention or None if not appropriate.
        """
        # Icebreakers can happen in the first 3 minutes
        if self.can_intervene(InterventionType.ICEBREAKER):
            return self._create_intervention(
                InterventionType.ICEBREAKER,
                InterventionModality.VOICE,
                InterventionTemplates.ICEBREAKER_GOAL,
                priority=InterventionPriority.MEDIUM,
                metadata={"session_goal": session_goal},
            )
        return None

    def _create_intervention(
        self,
        intervention_type: InterventionType,
        modality: InterventionModality,
        message: str,
        target_participant: Optional[str] = None,
        priority: InterventionPriority = InterventionPriority.MEDIUM,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Intervention:
        """Create and record an intervention.

        Updates tracking state and returns the new intervention.
        """
        intervention = Intervention(
            type=intervention_type,
            modality=modality,
            message=message,
            target_participant=target_participant,
            priority=priority,
            metadata=metadata or {},
        )

        # Update tracking
        now = datetime.utcnow()
        self.last_intervention = now
        self.last_intervention_by_type[intervention_type] = now
        self.intervention_count += 1
        self.intervention_history.append(intervention)

        return intervention

    def _get_quiet_participant_name(
        self, balance_result: Optional[Dict[str, Any]]
    ) -> str:
        """Get the name of the quieter participant.

        Args:
            balance_result: Balance data with participant info.

        Returns:
            Participant name or "your partner" fallback.
        """
        if not balance_result:
            return "your partner"

        quiet_id = balance_result.get("quiet_speaker")
        if quiet_id and quiet_id in self.participant_names:
            return self.participant_names[quiet_id]

        # Try to get from balance result directly
        participant_a = balance_result.get("participantA", {})
        participant_b = balance_result.get("participantB", {})

        a_pct = participant_a.get("percentage", 50)
        b_pct = participant_b.get("percentage", 50)

        if a_pct < b_pct:
            return participant_a.get("name", "your partner")
        elif b_pct < a_pct:
            return participant_b.get("name", "your partner")

        return "your partner"

    def get_stats(self) -> Dict[str, Any]:
        """Get intervention statistics for the session.

        Returns:
            Dict with intervention counts and history.
        """
        return {
            "session_id": self.session_id,
            "total_interventions": self.intervention_count,
            "intervention_rate_per_30min": self._calculate_intervention_rate(),
            "interventions_by_type": self._count_by_type(),
            "interventions_by_modality": self._count_by_modality(),
            "is_paused": self.is_paused,
            "session_elapsed_seconds": self.get_session_elapsed().total_seconds(),
            "time_remaining_seconds": self.get_time_remaining().total_seconds(),
        }

    def _calculate_intervention_rate(self) -> float:
        """Calculate interventions per 30 minutes."""
        elapsed_minutes = self.get_session_elapsed().total_seconds() / 60
        if elapsed_minutes < 1:
            return 0.0
        return (self.intervention_count / elapsed_minutes) * 30

    def _count_by_type(self) -> Dict[str, int]:
        """Count interventions by type."""
        counts: Dict[str, int] = {}
        for intervention in self.intervention_history:
            type_name = intervention.type.value
            counts[type_name] = counts.get(type_name, 0) + 1
        return counts

    def _count_by_modality(self) -> Dict[str, int]:
        """Count interventions by modality."""
        counts: Dict[str, int] = {}
        for intervention in self.intervention_history:
            modality_name = intervention.modality.value
            counts[modality_name] = counts.get(modality_name, 0) + 1
        return counts

    def get_history(self) -> List[Dict[str, Any]]:
        """Get intervention history as serializable dicts."""
        return [intervention.to_dict() for intervention in self.intervention_history]
