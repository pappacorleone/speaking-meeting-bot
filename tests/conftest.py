"""Pytest configuration and shared fixtures for integration tests."""

import pytest


def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line("markers", "asyncio: mark test as an async test")


@pytest.fixture(autouse=True)
def reset_session_store():
    """Reset session store before each test."""
    # Import and clear the session store
    try:
        from core.session_store import SESSION_STORE, SESSION_EVENTS, SESSION_SUMMARIES

        SESSION_STORE.clear()
        SESSION_EVENTS.clear()
        SESSION_SUMMARIES.clear()
    except ImportError:
        pass
    yield
    # Cleanup after test
    try:
        from core.session_store import SESSION_STORE, SESSION_EVENTS, SESSION_SUMMARIES

        SESSION_STORE.clear()
        SESSION_EVENTS.clear()
        SESSION_SUMMARIES.clear()
    except ImportError:
        pass
