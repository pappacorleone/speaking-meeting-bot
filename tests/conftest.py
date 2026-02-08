"""Pytest configuration and shared fixtures for integration tests."""

import pytest


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "asyncio: mark test as an async test")


@pytest.fixture(autouse=True)
def reset_talk_store():
    """Reset talk store before each test."""
    # Import and clear the talk store
    try:
        from core.talk_store import TALK_STORE, TALK_EVENTS, TALK_SUMMARIES

        TALK_STORE.clear()
        TALK_EVENTS.clear()
        TALK_SUMMARIES.clear()
    except ImportError:
        pass
    yield
    # Cleanup after test
    try:
        from core.talk_store import TALK_STORE, TALK_EVENTS, TALK_SUMMARIES

        TALK_STORE.clear()
        TALK_EVENTS.clear()
        TALK_SUMMARIES.clear()
    except ImportError:
        pass
