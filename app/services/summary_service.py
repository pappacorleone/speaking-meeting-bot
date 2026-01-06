"""Summary generation service for Diadi facilitation sessions.

Generates post-session summaries using OpenAI GPT-4.
"""

import json
import os
from typing import Any, Dict, List, Optional

import openai
from loguru import logger

from app.models import SessionSummary, TalkBalanceMetrics


# OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


class SummaryService:
    """Generates post-session summaries using OpenAI GPT-4."""

    def __init__(self):
        """Initialize the summary service with OpenAI client."""
        if not OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set - summary generation will fail")
            self.client = None
        else:
            self.client = openai.AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate_summary(
        self,
        session_id: str,
        goal: str,
        duration_minutes: int,
        participants: List[Dict[str, Any]],
        balance_metrics: Optional[Dict[str, Any]] = None,
        intervention_history: Optional[List[Dict[str, Any]]] = None,
        transcript: Optional[str] = None,
    ) -> Optional[SessionSummary]:
        """Generate a post-session summary using OpenAI.

        Args:
            session_id: The session identifier.
            goal: The original session goal.
            duration_minutes: Session duration in minutes.
            participants: List of participant dicts with id, name, role.
            balance_metrics: Optional talk balance metrics dict.
            intervention_history: Optional list of interventions that occurred.
            transcript: Optional session transcript (if available).

        Returns:
            SessionSummary object if successful, None otherwise.
        """
        if not self.client:
            logger.error("OpenAI client not initialized - cannot generate summary")
            return self._create_fallback_summary(
                session_id, goal, duration_minutes, participants, balance_metrics
            )

        try:
            # Build context for the summary generation
            context = self._build_summary_context(
                goal=goal,
                duration_minutes=duration_minutes,
                participants=participants,
                balance_metrics=balance_metrics,
                intervention_history=intervention_history,
                transcript=transcript,
            )

            # Generate summary using OpenAI
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(),
                    },
                    {
                        "role": "user",
                        "content": context,
                    },
                ],
                max_tokens=2000,
                temperature=0.7,
            )

            content = response.choices[0].message.content
            if not content:
                logger.warning("OpenAI returned empty content for summary generation")
                return self._create_fallback_summary(
                    session_id, goal, duration_minutes, participants, balance_metrics
                )

            # Parse the response
            summary_data = json.loads(content)

            # Build balance metrics
            balance = self._build_balance_metrics(balance_metrics, participants)

            # Build SessionSummary
            summary = SessionSummary(
                session_id=session_id,
                duration_minutes=duration_minutes,
                consensus_summary=summary_data.get(
                    "consensus_summary",
                    "Session completed. Key points were discussed.",
                ),
                action_items=summary_data.get("action_items", []),
                balance=balance,
                intervention_count=len(intervention_history)
                if intervention_history
                else 0,
                key_agreements=summary_data.get("key_agreements", []),
            )

            logger.info(f"Generated summary for session {session_id}")
            return summary

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse summary JSON: {e}")
            return self._create_fallback_summary(
                session_id, goal, duration_minutes, participants, balance_metrics
            )
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication error: {e}")
            return self._create_fallback_summary(
                session_id, goal, duration_minutes, participants, balance_metrics
            )
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            return self._create_fallback_summary(
                session_id, goal, duration_minutes, participants, balance_metrics
            )
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return self._create_fallback_summary(
                session_id, goal, duration_minutes, participants, balance_metrics
            )

    def _get_system_prompt(self) -> str:
        """Get the system prompt for summary generation."""
        return """You are an AI facilitator summary generator for Diadi, a dyadic conversation platform.

Your task is to analyze conversation data and generate a helpful, constructive summary.

Generate a JSON response with the following structure:
{
    "consensus_summary": "A 2-3 sentence summary of what was discussed and any consensus reached. Focus on progress made and positive outcomes.",
    "action_items": ["List of specific action items that emerged from the conversation", "Each item should be actionable and assigned to one or both participants"],
    "key_agreements": [
        {"title": "Brief title of agreement", "description": "More detailed description of what was agreed upon"}
    ]
}

Guidelines:
- Be constructive and focus on progress made
- Highlight areas of agreement rather than conflict
- Keep action items specific and actionable
- If there was no clear consensus, acknowledge progress toward understanding
- Keep the tone warm and encouraging
- Do not make up details not present in the input
- If information is limited, provide a graceful summary acknowledging the conversation occurred"""

    def _build_summary_context(
        self,
        goal: str,
        duration_minutes: int,
        participants: List[Dict[str, Any]],
        balance_metrics: Optional[Dict[str, Any]],
        intervention_history: Optional[List[Dict[str, Any]]],
        transcript: Optional[str],
    ) -> str:
        """Build the context string for summary generation."""
        participant_names = [p.get("name", "Participant") for p in participants]

        context_parts = [
            f"Session Goal: {goal}",
            f"Duration: {duration_minutes} minutes",
            f"Participants: {', '.join(participant_names)}",
        ]

        # Add balance information if available
        if balance_metrics:
            p_a = balance_metrics.get("participant_a", {})
            p_b = balance_metrics.get("participant_b", {})
            balance_status = balance_metrics.get("status", "unknown")
            context_parts.append(
                f"Talk Balance: {p_a.get('name', 'Participant A')} spoke {p_a.get('percentage', 50)}%, "
                f"{p_b.get('name', 'Participant B')} spoke {p_b.get('percentage', 50)}% ({balance_status})"
            )

        # Add intervention summary if available
        if intervention_history:
            intervention_types = {}
            for intervention in intervention_history:
                int_type = intervention.get("type", "unknown")
                intervention_types[int_type] = intervention_types.get(int_type, 0) + 1

            intervention_summary = ", ".join(
                f"{count} {int_type}" for int_type, count in intervention_types.items()
            )
            context_parts.append(f"AI Interventions: {intervention_summary}")

        # Add transcript if available (truncated for context limit)
        if transcript:
            max_transcript_chars = 8000  # Keep within context limits
            if len(transcript) > max_transcript_chars:
                transcript = transcript[:max_transcript_chars] + "\n...[truncated]"
            context_parts.append(f"\nConversation Transcript:\n{transcript}")
        else:
            context_parts.append(
                "\n(No transcript available - generate summary based on session metadata)"
            )

        return "\n".join(context_parts)

    def _build_balance_metrics(
        self,
        balance_metrics: Optional[Dict[str, Any]],
        participants: List[Dict[str, Any]],
    ) -> TalkBalanceMetrics:
        """Build TalkBalanceMetrics from available data."""
        if balance_metrics:
            return TalkBalanceMetrics(
                participant_a=balance_metrics.get(
                    "participant_a",
                    {
                        "id": "",
                        "name": participants[0].get("name", "") if participants else "",
                        "percentage": 50,
                    },
                ),
                participant_b=balance_metrics.get(
                    "participant_b",
                    {
                        "id": "",
                        "name": participants[1].get("name", "")
                        if len(participants) > 1
                        else "",
                        "percentage": 50,
                    },
                ),
                status=balance_metrics.get("status", "balanced"),
            )

        # Default balanced metrics
        return TalkBalanceMetrics(
            participant_a={
                "id": participants[0].get("id", "") if participants else "",
                "name": participants[0].get("name", "") if participants else "",
                "percentage": 50,
            },
            participant_b={
                "id": participants[1].get("id", "") if len(participants) > 1 else "",
                "name": participants[1].get("name", "")
                if len(participants) > 1
                else "",
                "percentage": 50,
            },
            status="balanced",
        )

    def _create_fallback_summary(
        self,
        session_id: str,
        goal: str,
        duration_minutes: int,
        participants: List[Dict[str, Any]],
        balance_metrics: Optional[Dict[str, Any]],
    ) -> SessionSummary:
        """Create a fallback summary when OpenAI is unavailable."""
        participant_names = [p.get("name", "Participant") for p in participants]

        return SessionSummary(
            session_id=session_id,
            duration_minutes=duration_minutes,
            consensus_summary=(
                f"A {duration_minutes}-minute facilitated conversation took place between "
                f"{' and '.join(participant_names)} regarding: {goal}. "
                "The AI facilitator helped maintain balanced dialogue throughout the session."
            ),
            action_items=[
                "Review this session's key discussion points",
                "Schedule a follow-up conversation if needed",
            ],
            balance=self._build_balance_metrics(balance_metrics, participants),
            intervention_count=0,
            key_agreements=[],
        )


# Global service instance
summary_service = SummaryService()
