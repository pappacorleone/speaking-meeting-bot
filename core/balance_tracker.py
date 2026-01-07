"""Balance tracker for monitoring talk time distribution.

Tracks speaking time for each participant and calculates talk balance
percentages. Used to trigger balance interventions when one participant
dominates the conversation.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, Optional


@dataclass
class SpeakerMetrics:
    """Metrics for a single speaker's participation.

    Attributes:
        total_speaking_time_ms: Cumulative speaking time in milliseconds.
        last_spoke_at: Timestamp when the speaker started their current turn.
        is_speaking: Whether the speaker is currently speaking.
    """

    total_speaking_time_ms: int = 0
    last_spoke_at: Optional[datetime] = None
    is_speaking: bool = False


@dataclass
class BalanceResult:
    """Result of a balance calculation.

    Attributes:
        participant_a_id: ID of the first participant.
        participant_a_percentage: Percentage of talk time for participant A.
        participant_b_id: ID of the second participant.
        participant_b_percentage: Percentage of talk time for participant B.
        status: Balance status ("balanced", "mild_imbalance", "severe_imbalance").
        waiting_for_speakers: True if not enough speakers have been detected.
    """

    participant_a_id: Optional[str] = None
    participant_a_percentage: int = 50
    participant_b_id: Optional[str] = None
    participant_b_percentage: int = 50
    status: str = "balanced"
    waiting_for_speakers: bool = False

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        if self.waiting_for_speakers:
            return {"status": "waiting_for_speakers"}

        return {
            "participantA": {
                "id": self.participant_a_id,
                "percentage": self.participant_a_percentage,
            },
            "participantB": {
                "id": self.participant_b_id,
                "percentage": self.participant_b_percentage,
            },
            "status": self.status,
        }


class BalanceTracker:
    """Tracks talk balance between two participants.

    Monitors speaking time for each participant and calculates their
    relative contribution to the conversation. Triggers intervention
    recommendations when imbalance thresholds are exceeded.

    Thresholds (from requirements):
        - Balanced: <= 35% difference (65/35 or better)
        - Mild imbalance: > 35% but <= 40% difference
        - Severe imbalance: > 40% difference (70/30 or worse)

    Intervention triggers:
        - Mild imbalance for 3+ minutes: Visual balance prompt
        - Severe imbalance for 5+ minutes: Voice balance prompt

    Attributes:
        session_id: The session being tracked.
        speakers: Dictionary of speaker_id to SpeakerMetrics.
        session_start: When the session started.
        imbalance_start: When mild imbalance began (for intervention timing).
        severe_imbalance_start: When severe imbalance began.
    """

    # Thresholds for balance status determination
    MILD_IMBALANCE_THRESHOLD = 35  # >35% difference = mild imbalance (65/35)
    SEVERE_IMBALANCE_THRESHOLD = 40  # >40% difference = severe imbalance (70/30)

    # Duration thresholds for intervention triggers
    MILD_IMBALANCE_DURATION = timedelta(minutes=3)
    SEVERE_IMBALANCE_DURATION = timedelta(minutes=5)

    def __init__(self, session_id: str):
        """Initialize the balance tracker.

        Args:
            session_id: The unique session identifier.
        """
        self.session_id = session_id
        self.speakers: Dict[str, SpeakerMetrics] = {}
        self.session_start: datetime = datetime.utcnow()

        # Imbalance tracking for intervention triggers
        self.imbalance_start: Optional[datetime] = None
        self.severe_imbalance_start: Optional[datetime] = None

    def update_speaker(self, speaker_id: str, is_speaking: bool) -> None:
        """Update speaker state from diarization.

        Call this method whenever a speaker starts or stops speaking.
        The balance tracker will accumulate speaking time and update
        metrics accordingly.

        Args:
            speaker_id: Unique identifier for the speaker.
            is_speaking: Whether the speaker is currently speaking.
        """
        if speaker_id not in self.speakers:
            self.speakers[speaker_id] = SpeakerMetrics()

        metrics = self.speakers[speaker_id]
        now = datetime.utcnow()

        if is_speaking and not metrics.is_speaking:
            # Speaker started speaking
            metrics.is_speaking = True
            metrics.last_spoke_at = now
        elif not is_speaking and metrics.is_speaking:
            # Speaker stopped speaking - accumulate time
            if metrics.last_spoke_at:
                duration = (now - metrics.last_spoke_at).total_seconds() * 1000
                metrics.total_speaking_time_ms += int(duration)
            metrics.is_speaking = False

    def add_speaking_duration(self, speaker_id: str, duration_ms: int) -> None:
        """Add speaking time directly (used when diarization provides durations).

        Args:
            speaker_id: Unique identifier for the speaker.
            duration_ms: Duration to add in milliseconds.
        """
        if duration_ms <= 0:
            return

        if speaker_id not in self.speakers:
            self.speakers[speaker_id] = SpeakerMetrics()

        self.speakers[speaker_id].total_speaking_time_ms += int(duration_ms)

    def get_current_speaking_time(self, speaker_id: str) -> int:
        """Get total speaking time including current turn.

        Args:
            speaker_id: The speaker to query.

        Returns:
            Total speaking time in milliseconds.
        """
        if speaker_id not in self.speakers:
            return 0

        metrics = self.speakers[speaker_id]
        total = metrics.total_speaking_time_ms

        # Add current speaking duration if actively speaking
        if metrics.is_speaking and metrics.last_spoke_at:
            current_duration = (
                datetime.utcnow() - metrics.last_spoke_at
            ).total_seconds() * 1000
            total += int(current_duration)

        return total

    def get_balance(self) -> BalanceResult:
        """Calculate current talk balance percentages.

        Returns:
            BalanceResult with participant percentages and status.
        """
        if len(self.speakers) < 2:
            return BalanceResult(waiting_for_speakers=True)

        speaker_ids = list(self.speakers.keys())

        # Get current speaking times (including active speakers)
        times = [self.get_current_speaking_time(sid) for sid in speaker_ids]
        total = sum(times)

        if total == 0:
            percentages = [50, 50]
        else:
            percentages = [int((t / total) * 100) for t in times]

        # Ensure percentages sum to 100 (handle rounding)
        if percentages[0] + percentages[1] != 100:
            percentages[1] = 100 - percentages[0]

        # Determine status based on difference
        diff = abs(percentages[0] - percentages[1])

        if diff <= self.MILD_IMBALANCE_THRESHOLD:
            status = "balanced"
        elif diff <= self.SEVERE_IMBALANCE_THRESHOLD:
            status = "mild_imbalance"
        else:
            status = "severe_imbalance"

        return BalanceResult(
            participant_a_id=speaker_ids[0],
            participant_a_percentage=percentages[0],
            participant_b_id=speaker_ids[1],
            participant_b_percentage=percentages[1],
            status=status,
            waiting_for_speakers=False,
        )

    def check_intervention_trigger(self) -> Optional[str]:
        """Check if balance warrants intervention.

        Evaluates current balance state and duration to determine
        if an intervention should be triggered.

        Returns:
            "severe_balance" for voice intervention (5+ min at 70/30+)
            "balance" for visual intervention (3+ min at 65/35+)
            None if no intervention needed
        """
        balance = self.get_balance()
        if balance.waiting_for_speakers:
            return None

        now = datetime.utcnow()
        status = balance.status

        # Check for severe imbalance (voice intervention)
        if status == "severe_imbalance":
            if not self.severe_imbalance_start:
                self.severe_imbalance_start = now
            elif (now - self.severe_imbalance_start) > self.SEVERE_IMBALANCE_DURATION:
                return "severe_balance"  # Voice intervention
        else:
            self.severe_imbalance_start = None

        # Check for mild imbalance (visual intervention)
        if status in ("mild_imbalance", "severe_imbalance"):
            if not self.imbalance_start:
                self.imbalance_start = now
            elif (now - self.imbalance_start) > self.MILD_IMBALANCE_DURATION:
                return "balance"  # Visual intervention
        else:
            self.imbalance_start = None

        return None

    def get_dominant_speaker(self) -> Optional[str]:
        """Get the ID of the speaker with more talk time.

        Returns:
            Speaker ID with higher percentage, or None if balanced/waiting.
        """
        balance = self.get_balance()
        if balance.waiting_for_speakers or balance.status == "balanced":
            return None

        if balance.participant_a_percentage > balance.participant_b_percentage:
            return balance.participant_a_id
        return balance.participant_b_id

    def get_quiet_speaker(self) -> Optional[str]:
        """Get the ID of the speaker with less talk time.

        Useful for intervention targeting.

        Returns:
            Speaker ID with lower percentage, or None if balanced/waiting.
        """
        balance = self.get_balance()
        if balance.waiting_for_speakers or balance.status == "balanced":
            return None

        if balance.participant_a_percentage < balance.participant_b_percentage:
            return balance.participant_a_id
        return balance.participant_b_id

    def reset_intervention_timers(self) -> None:
        """Reset intervention timers after an intervention is delivered.

        Call this after a balance intervention is triggered to prevent
        immediate re-triggering.
        """
        self.imbalance_start = None
        self.severe_imbalance_start = None

    def get_session_duration_seconds(self) -> float:
        """Get total session duration in seconds.

        Returns:
            Duration since session start in seconds.
        """
        return (datetime.utcnow() - self.session_start).total_seconds()

    def to_metrics_dict(self) -> Dict:
        """Export metrics for API response.

        Returns:
            Dictionary with speaker metrics and balance state.
        """
        balance = self.get_balance()

        return {
            "session_id": self.session_id,
            "session_duration_seconds": self.get_session_duration_seconds(),
            "balance": balance.to_dict(),
            "dominant_speaker": self.get_dominant_speaker(),
            "quiet_speaker": self.get_quiet_speaker(),
            "speakers": {
                sid: {
                    "total_speaking_time_ms": self.get_current_speaking_time(sid),
                    "is_speaking": metrics.is_speaking,
                }
                for sid, metrics in self.speakers.items()
            },
        }
