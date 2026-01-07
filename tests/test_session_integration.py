"""Integration tests for Diadi session lifecycle.

Tests the complete flow:
1. Session creation -> Invite -> Consent -> Start -> Pause/Resume -> End -> Summary
"""

import asyncio
import json
from datetime import datetime
from typing import Optional
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# We need to patch external dependencies before importing the app
with patch.dict(
    "os.environ",
    {
        "MEETING_BAAS_API_KEY": "test-api-key",
        "OPENAI_API_KEY": "test-openai-key",
        "CARTESIA_API_KEY": "test-cartesia-key",
        "DEEPGRAM_API_KEY": "test-deepgram-key",
    },
):
    # Mock external API calls
    import sys
    import os

    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# Test API key for authentication
TEST_API_KEY = "test-api-key"
HEADERS = {"x-meeting-baas-api-key": TEST_API_KEY}


class TestSessionCRUD:
    """Tests for session CRUD operations."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client with mocked dependencies."""
        # Import with mocked validation
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app

            app = create_app()

            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                yield client

    @pytest.mark.asyncio
    async def test_create_session(self, client):
        """Test creating a new session."""
        request_data = {
            "partner_name": "Test Partner",
            "goal": "Discuss project timeline and deliverables",
            "relationship_context": "Team members working on the same project",
            "facilitator": {
                "persona": "neutral_mediator",
                "interrupt_authority": True,
                "direct_inquiry": True,
                "silence_detection": True,
            },
            "duration_minutes": 30,
            "platform": "diadi",
        }

        response = await client.post("/sessions", json=request_data, headers=HEADERS)

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "session_id" in data
        assert data["id"] == data["session_id"]
        assert data["status"] == "pending_consent"
        assert "invite_link" in data
        assert "invite_token" in data

    @pytest.mark.asyncio
    async def test_create_session_missing_required_fields(self, client):
        """Test creating session without required fields."""
        request_data = {
            "partner_name": "Test Partner",
            # Missing goal
        }

        response = await client.post("/sessions", json=request_data, headers=HEADERS)

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_session_requires_meeting_url_for_external(self, client):
        """Test meeting URL requirement for external platforms."""
        request_data = {
            "partner_name": "Test Partner",
            "goal": "Discuss next steps",
            "relationship_context": "Colleagues preparing a launch",
            "facilitator": {"persona": "neutral_mediator"},
            "duration_minutes": 30,
            "platform": "meet",
        }

        response = await client.post("/sessions", json=request_data, headers=HEADERS)

        assert response.status_code == 400
        assert "Meeting URL is required" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_session_rejects_invalid_meet_url(self, client):
        """Test Meet URL validation on session creation."""
        request_data = {
            "partner_name": "Test Partner",
            "goal": "Discuss next steps",
            "relationship_context": "Colleagues preparing a launch",
            "facilitator": {"persona": "neutral_mediator"},
            "duration_minutes": 30,
            "platform": "meet",
            "meeting_url": "https://example.com/invalid",
        }

        response = await client.post("/sessions", json=request_data, headers=HEADERS)

        assert response.status_code == 400
        assert "Google Meet" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_list_sessions(self, client):
        """Test listing all sessions."""
        # Create a session first
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )
        assert create_response.status_code == 201

        # List sessions
        response = await client.get("/sessions", headers=HEADERS)

        assert response.status_code == 200
        data = response.json()
        assert "sessions" in data
        assert "total" in data
        assert "hasMore" in data
        assert len(data["sessions"]) >= 1

    @pytest.mark.asyncio
    async def test_list_sessions_with_status_filter(self, client):
        """Test listing sessions with status filter."""
        response = await client.get(
            "/sessions?status_filter=pending_consent",
            headers=HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        # All returned sessions should have pending_consent status
        for session in data["sessions"]:
            assert session["status"] == "pending_consent"

    @pytest.mark.asyncio
    async def test_get_session_by_id(self, client):
        """Test getting a session by ID."""
        # Create a session first
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )
        session_id = create_response.json()["id"]

        # Get session by ID
        response = await client.get(f"/sessions/{session_id}", headers=HEADERS)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
        assert data["goal"] == "Test goal"

    @pytest.mark.asyncio
    async def test_get_session_not_found(self, client):
        """Test getting a non-existent session."""
        response = await client.get("/sessions/non-existent-id", headers=HEADERS)

        assert response.status_code == 404


class TestInviteAndConsent:
    """Tests for invite token lookup and consent flow."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client with mocked dependencies."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app

            app = create_app()

            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                yield client

    @pytest.mark.asyncio
    async def test_get_session_by_invite_token(self, client):
        """Test looking up session by invite token."""
        # Create a session
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )
        invite_token = create_response.json()["invite_token"]

        # Look up by invite token
        response = await client.get(f"/sessions/invite/{invite_token}", headers=HEADERS)

        assert response.status_code == 200
        data = response.json()
        assert data["invite_token"] == invite_token

    @pytest.mark.asyncio
    async def test_get_session_by_invalid_invite_token(self, client):
        """Test looking up session with invalid invite token."""
        response = await client.get("/sessions/invite/invalid-token", headers=HEADERS)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_record_consent_accept(self, client):
        """Test recording partner consent (accept)."""
        # Create a session
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )
        data = create_response.json()
        session_id = data["id"]
        invite_token = data["invite_token"]

        # Record consent
        consent_response = await client.post(
            f"/sessions/{session_id}/consent",
            json={
                "invite_token": invite_token,
                "invitee_name": "Partner Name",
                "consented": True,
            },
            headers=HEADERS,
        )

        assert consent_response.status_code == 200
        consent_data = consent_response.json()
        assert consent_data["status"] == "ready"  # Both parties consented
        assert len(consent_data["participants"]) == 2

    @pytest.mark.asyncio
    async def test_record_consent_decline(self, client):
        """Test recording partner consent (decline)."""
        # Create a session
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )
        data = create_response.json()
        session_id = data["id"]
        invite_token = data["invite_token"]

        # Decline consent
        consent_response = await client.post(
            f"/sessions/{session_id}/consent",
            json={
                "invite_token": invite_token,
                "invitee_name": "Partner Name",
                "consented": False,
            },
            headers=HEADERS,
        )

        assert consent_response.status_code == 200
        consent_data = consent_response.json()
        assert consent_data["status"] == "archived"

    @pytest.mark.asyncio
    async def test_record_consent_invalid_token(self, client):
        """Test recording consent with invalid invite token."""
        # Create a session
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )
        session_id = create_response.json()["id"]

        # Try consent with wrong token
        consent_response = await client.post(
            f"/sessions/{session_id}/consent",
            json={
                "invite_token": "wrong-token",
                "invitee_name": "Partner Name",
                "consented": True,
            },
            headers=HEADERS,
        )

        assert consent_response.status_code == 400


class TestSessionLifecycle:
    """Tests for session start, pause, resume, and end."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client with mocked dependencies."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app

            app = create_app()

            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                yield client

    @pytest_asyncio.fixture
    async def ready_session(self, client):
        """Create a session in 'ready' status (both parties consented)."""
        # Create session
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal for lifecycle testing",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "zoom",
                "meeting_url": "https://zoom.us/j/123456789",
            },
            headers=HEADERS,
        )
        data = create_response.json()

        # Record consent to make it ready
        await client.post(
            f"/sessions/{data['id']}/consent",
            json={
                "invite_token": data["invite_token"],
                "invitee_name": "Partner Name",
                "consented": True,
            },
            headers=HEADERS,
        )

        return data["id"]

    @pytest.mark.asyncio
    @patch("app.services.session_service.create_meeting_bot")
    @patch("app.services.session_service.start_pipecat_process")
    async def test_start_session(
        self, mock_pipecat, mock_meetingbaas, client, ready_session
    ):
        """Test starting a session."""
        # Mock MeetingBaas bot creation
        mock_meetingbaas.return_value = "mock-bot-id"
        mock_pipecat.return_value = MagicMock()

        response = await client.post(
            f"/sessions/{ready_session}/start",
            json={"meeting_url": "https://zoom.us/j/123456789"},
            headers=HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert "bot_id" in data
        assert "client_id" in data
        assert "event_url" in data

    @pytest.mark.asyncio
    async def test_start_session_not_ready(self, client):
        """Test starting a session that's not in ready status."""
        # Create session (still pending_consent)
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "zoom",
                "meeting_url": "https://zoom.us/j/123456789",
            },
            headers=HEADERS,
        )
        session_id = create_response.json()["id"]

        # Try to start without consent
        response = await client.post(
            f"/sessions/{session_id}/start",
            json={"meeting_url": "https://zoom.us/j/123456789"},
            headers=HEADERS,
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    @patch("app.services.session_service.create_meeting_bot")
    @patch("app.services.session_service.start_pipecat_process")
    async def test_pause_session(
        self, mock_pipecat, mock_meetingbaas, client, ready_session
    ):
        """Test pausing a session (kill switch)."""
        mock_meetingbaas.return_value = "mock-bot-id"
        mock_pipecat.return_value = MagicMock()

        # Start the session first
        await client.post(
            f"/sessions/{ready_session}/start",
            json={"meeting_url": "https://zoom.us/j/123456789"},
            headers=HEADERS,
        )

        # Pause the session
        response = await client.post(
            f"/sessions/{ready_session}/pause",
            headers=HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paused"

    @pytest.mark.asyncio
    @patch("app.services.session_service.create_meeting_bot")
    @patch("app.services.session_service.start_pipecat_process")
    async def test_resume_session(
        self, mock_pipecat, mock_meetingbaas, client, ready_session
    ):
        """Test resuming a paused session."""
        mock_meetingbaas.return_value = "mock-bot-id"
        mock_pipecat.return_value = MagicMock()

        # Start the session
        await client.post(
            f"/sessions/{ready_session}/start",
            json={"meeting_url": "https://zoom.us/j/123456789"},
            headers=HEADERS,
        )

        # Pause the session
        await client.post(f"/sessions/{ready_session}/pause", headers=HEADERS)

        # Resume the session
        response = await client.post(
            f"/sessions/{ready_session}/resume",
            headers=HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_pause_session_not_in_progress(self, client, ready_session):
        """Test pausing a session that's not in progress."""
        # Try to pause without starting
        response = await client.post(
            f"/sessions/{ready_session}/pause",
            headers=HEADERS,
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    @patch("app.services.session_service.create_meeting_bot")
    @patch("app.services.session_service.start_pipecat_process")
    @patch("app.services.session_service.terminate_process_gracefully")
    @patch("app.services.session_service.leave_meeting_bot")
    async def test_end_session(
        self,
        mock_leave,
        mock_terminate,
        mock_pipecat,
        mock_meetingbaas,
        client,
        ready_session,
    ):
        """Test ending a session."""
        mock_meetingbaas.return_value = "mock-bot-id"
        mock_pipecat.return_value = MagicMock()
        mock_terminate.return_value = True
        mock_leave.return_value = True

        # Start the session
        await client.post(
            f"/sessions/{ready_session}/start",
            json={"meeting_url": "https://zoom.us/j/123456789"},
            headers=HEADERS,
        )

        # End the session
        response = await client.post(
            f"/sessions/{ready_session}/end",
            headers=HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ended"
        assert "summary_available" in data


class TestSessionSummary:
    """Tests for session summary endpoint."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client with mocked dependencies."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app

            app = create_app()

            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                yield client

    @pytest.mark.asyncio
    async def test_get_summary_session_not_found(self, client):
        """Test getting summary for non-existent session."""
        response = await client.get("/sessions/non-existent/summary", headers=HEADERS)

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_summary_not_available(self, client):
        """Test getting summary when not yet generated."""
        # Create a session
        create_response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )
        session_id = create_response.json()["id"]

        # Try to get summary (not available yet)
        response = await client.get(f"/sessions/{session_id}/summary", headers=HEADERS)

        assert response.status_code == 404
        assert "not available" in response.json()["detail"].lower()


class TestAPIAuthentication:
    """Tests for API authentication."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client with mocked dependencies."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app

            app = create_app()

            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                yield client

    @pytest.mark.asyncio
    async def test_missing_api_key(self, client):
        """Test request without API key."""
        response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            # No headers
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_health_endpoint_no_auth(self, client):
        """Test health endpoint doesn't require auth."""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"


class TestFacilitatorPersonas:
    """Tests for facilitator persona selection."""

    @pytest_asyncio.fixture
    async def client(self):
        """Create test client with mocked dependencies."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app

            app = create_app()

            transport = ASGITransport(app=app)
            async with AsyncClient(
                transport=transport, base_url="http://test"
            ) as client:
                yield client

    @pytest.mark.asyncio
    async def test_create_session_neutral_mediator(self, client):
        """Test creating session with neutral_mediator persona."""
        response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "neutral_mediator"},
                "duration_minutes": 30,
                "platform": "diadi",
            },
            headers=HEADERS,
        )

        assert response.status_code == 201

        # Get session to verify persona
        session_id = response.json()["id"]
        get_response = await client.get(f"/sessions/{session_id}", headers=HEADERS)
        data = get_response.json()
        assert data["facilitator"]["persona"] == "neutral_mediator"

    @pytest.mark.asyncio
    async def test_create_session_deep_empath(self, client):
        """Test creating session with deep_empath persona."""
        response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Test goal",
                "facilitator": {"persona": "deep_empath"},
                "duration_minutes": 45,
                "platform": "diadi",
            },
            headers=HEADERS,
        )

        assert response.status_code == 201

        session_id = response.json()["id"]
        get_response = await client.get(f"/sessions/{session_id}", headers=HEADERS)
        data = get_response.json()
        assert data["facilitator"]["persona"] == "deep_empath"

    @pytest.mark.asyncio
    async def test_create_session_decision_catalyst(self, client):
        """Test creating session with decision_catalyst persona."""
        response = await client.post(
            "/sessions",
            json={
                "partner_name": "Test Partner",
                "goal": "Make a decision about project direction",
                "facilitator": {"persona": "decision_catalyst"},
                "duration_minutes": 60,
                "platform": "diadi",
            },
            headers=HEADERS,
        )

        assert response.status_code == 201

        session_id = response.json()["id"]
        get_response = await client.get(f"/sessions/{session_id}", headers=HEADERS)
        data = get_response.json()
        assert data["facilitator"]["persona"] == "decision_catalyst"


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
