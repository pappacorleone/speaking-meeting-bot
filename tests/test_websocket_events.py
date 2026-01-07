"""Integration tests for WebSocket session events.

Tests the WebSocket endpoint for real-time session updates:
- Connection management
- Event broadcasting (balance_update, intervention, etc.)
- Ping/pong heartbeat
"""

import asyncio
import json
from unittest.mock import patch, MagicMock

import pytest
import pytest_asyncio

# Test session data for WebSocket tests
TEST_API_KEY = "test-api-key"
HEADERS = {"x-meeting-baas-api-key": TEST_API_KEY}


class TestWebSocketSessionEvents:
    """Tests for WebSocket session events endpoint."""

    @pytest_asyncio.fixture
    async def test_session(self):
        """Create a test session in the store."""
        from core.session_store import create_session
        from app.models import (
            Session,
            SessionStatus,
            Platform,
            Participant,
            FacilitatorConfig,
            FacilitatorPersona,
        )
        from datetime import datetime

        session = Session(
            id="test-session-123",
            status=SessionStatus.IN_PROGRESS,
            goal="Test goal for WebSocket testing",
            participants=[
                Participant(
                    id="participant-1",
                    name="Alice",
                    role="creator",
                    consented=True,
                ),
                Participant(
                    id="participant-2",
                    name="Bob",
                    role="invitee",
                    consented=True,
                ),
            ],
            facilitator=FacilitatorConfig(
                persona=FacilitatorPersona.NEUTRAL_MEDIATOR,
                interrupt_authority=True,
                direct_inquiry=True,
                silence_detection=True,
            ),
            duration_minutes=30,
            platform=Platform.DIADI,
            invite_token="test-invite-token",
            created_at=datetime.utcnow(),
        )

        create_session(session)
        return session.id

    @pytest.mark.asyncio
    async def test_websocket_connection(self, test_session):
        """Test WebSocket connection to session events."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app
            from httpx import ASGITransport, AsyncClient
            from httpx_ws import aconnect_ws
            from httpx_ws.transport import ASGIWebSocketTransport

            app = create_app()

            async with aconnect_ws(
                f"http://test/sessions/{test_session}/events",
                app,
            ) as ws:
                # Should receive initial session state
                message = await asyncio.wait_for(ws.receive_json(), timeout=5.0)

                assert message["type"] == "session_state"
                assert "data" in message
                assert message["data"]["goal"] == "Test goal for WebSocket testing"
                assert message["data"]["durationMinutes"] == 30
                assert len(message["data"]["participants"]) == 2
                assert message["data"]["facilitatorPaused"] is False
                assert message["data"]["aiStatus"] == "listening"

    @pytest.mark.asyncio
    async def test_websocket_ping_pong(self, test_session):
        """Test WebSocket ping/pong heartbeat."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app
            from httpx_ws import aconnect_ws

            app = create_app()

            async with aconnect_ws(
                f"http://test/sessions/{test_session}/events",
                app,
            ) as ws:
                # Receive initial state
                await ws.receive_json()

                # Send ping
                await ws.send_json({"type": "ping"})

                # Should receive pong
                message = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
                assert message["type"] == "pong"

    @pytest.mark.asyncio
    async def test_websocket_update_settings(self, test_session):
        """Test update_settings payload uses data envelope."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app
            from httpx_ws import aconnect_ws

            app = create_app()

            async with aconnect_ws(
                f"http://test/sessions/{test_session}/events",
                app,
            ) as ws:
                # Receive initial state
                await ws.receive_json()

                # Send settings update with data envelope
                settings_payload = {"silence_detection": False}
                await ws.send_json(
                    {
                        "type": "update_settings",
                        "data": settings_payload,
                    }
                )

                message = await asyncio.wait_for(ws.receive_json(), timeout=5.0)
                assert message["type"] == "settings_updated"
                assert message["data"] == settings_payload

    @pytest.mark.asyncio
    async def test_websocket_nonexistent_session(self):
        """Test WebSocket connection to non-existent session."""
        with patch("config.validation.run_startup_validation"):
            from app.main import create_app
            from httpx_ws import aconnect_ws
            from httpx_ws._exceptions import WebSocketDisconnect

            app = create_app()

            # Should disconnect with 4004 code (not found)
            with pytest.raises(WebSocketDisconnect) as exc_info:
                async with aconnect_ws(
                    "http://test/sessions/nonexistent/events",
                    app,
                ) as ws:
                    await ws.receive_json()

            assert exc_info.value.code == 4004


class TestBalanceUpdateEvents:
    """Tests for balance update event broadcasting."""

    @pytest.mark.asyncio
    async def test_balance_update_broadcast(self):
        """Test broadcasting balance update events."""
        from core.session_store import (
            create_session,
            register_event_connection,
            broadcast_session_event,
            SESSION_EVENTS,
        )
        from app.models import (
            Session,
            SessionStatus,
            Platform,
            Participant,
            FacilitatorConfig,
            FacilitatorPersona,
        )
        from datetime import datetime
        from unittest.mock import AsyncMock

        # Create a session
        session = Session(
            id="balance-test-session",
            status=SessionStatus.IN_PROGRESS,
            goal="Test balance updates",
            participants=[
                Participant(
                    id="p1", name="Alice", role="creator", consented=True
                ),
                Participant(
                    id="p2", name="Bob", role="invitee", consented=True
                ),
            ],
            facilitator=FacilitatorConfig(persona=FacilitatorPersona.NEUTRAL_MEDIATOR),
            duration_minutes=30,
            platform=Platform.DIADI,
            invite_token="test-token",
            created_at=datetime.utcnow(),
        )
        create_session(session)

        # Create mock WebSocket
        mock_ws = AsyncMock()
        mock_ws.send_json = AsyncMock()

        # Register the mock connection
        register_event_connection(session.id, mock_ws)

        # Broadcast balance update
        await broadcast_session_event(
            session.id,
            "balance_update",
            {
                "participantA": {"id": "p1", "name": "Alice", "percentage": 60},
                "participantB": {"id": "p2", "name": "Bob", "percentage": 40},
                "status": "mild_imbalance",
            },
        )

        # Verify broadcast was called
        mock_ws.send_json.assert_called_once()
        call_args = mock_ws.send_json.call_args[0][0]
        assert call_args["type"] == "balance_update"
        assert call_args["data"]["status"] == "mild_imbalance"


class TestInterventionEvents:
    """Tests for intervention event handling."""

    @pytest.mark.asyncio
    async def test_intervention_event_broadcast(self):
        """Test broadcasting intervention events."""
        from core.session_store import (
            create_session,
            register_event_connection,
            broadcast_session_event,
        )
        from app.models import (
            Session,
            SessionStatus,
            Platform,
            Participant,
            FacilitatorConfig,
            FacilitatorPersona,
        )
        from datetime import datetime
        from unittest.mock import AsyncMock

        # Create a session
        session = Session(
            id="intervention-test-session",
            status=SessionStatus.IN_PROGRESS,
            goal="Test intervention events",
            participants=[
                Participant(
                    id="p1", name="Alice", role="creator", consented=True
                ),
                Participant(
                    id="p2", name="Bob", role="invitee", consented=True
                ),
            ],
            facilitator=FacilitatorConfig(persona=FacilitatorPersona.DEEP_EMPATH),
            duration_minutes=30,
            platform=Platform.DIADI,
            invite_token="test-token",
            created_at=datetime.utcnow(),
        )
        create_session(session)

        # Create mock WebSocket
        mock_ws = AsyncMock()
        mock_ws.send_json = AsyncMock()

        # Register connection
        register_event_connection(session.id, mock_ws)

        # Broadcast intervention
        await broadcast_session_event(
            session.id,
            "intervention",
            {
                "id": "intervention-1",
                "type": "balance",
                "message": "I notice one person has been doing most of the talking...",
                "priority": "medium",
                "modality": "visual",
            },
        )

        # Verify
        mock_ws.send_json.assert_called_once()
        call_args = mock_ws.send_json.call_args[0][0]
        assert call_args["type"] == "intervention"
        assert call_args["data"]["type"] == "balance"
        assert call_args["data"]["priority"] == "medium"


class TestSessionStateEvents:
    """Tests for session state change events."""

    @pytest.mark.asyncio
    async def test_session_pause_event(self):
        """Test session pause state event."""
        from core.session_store import (
            create_session,
            register_event_connection,
            broadcast_session_event,
        )
        from app.models import (
            Session,
            SessionStatus,
            Platform,
            Participant,
            FacilitatorConfig,
            FacilitatorPersona,
        )
        from datetime import datetime
        from unittest.mock import AsyncMock

        session = Session(
            id="pause-test-session",
            status=SessionStatus.IN_PROGRESS,
            goal="Test pause events",
            participants=[
                Participant(
                    id="p1", name="Alice", role="creator", consented=True
                ),
            ],
            facilitator=FacilitatorConfig(persona=FacilitatorPersona.NEUTRAL_MEDIATOR),
            duration_minutes=30,
            platform=Platform.DIADI,
            invite_token="test-token",
            created_at=datetime.utcnow(),
        )
        create_session(session)

        mock_ws = AsyncMock()
        mock_ws.send_json = AsyncMock()
        register_event_connection(session.id, mock_ws)

        # Broadcast pause event
        await broadcast_session_event(
            session.id,
            "session_state",
            {"facilitatorPaused": True},
        )

        mock_ws.send_json.assert_called_once()
        call_args = mock_ws.send_json.call_args[0][0]
        assert call_args["type"] == "session_state"
        assert call_args["data"]["facilitatorPaused"] is True


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
