"""SQLite database layer for persistent storage.

Provides async database access via aiosqlite for:
- Anonymous user sessions (browser cookie-based)
- Talk persistence (survives server restarts)
- Talk summary persistence
"""

import os
from datetime import datetime, timezone
from typing import Optional

import aiosqlite
from loguru import logger

# Database file path (configurable via environment variable)
DB_PATH = os.getenv("DIADI_DB_PATH", "diadi.db")

# Module-level connection (initialized on startup, closed on shutdown)
_db: Optional[aiosqlite.Connection] = None


async def init_db() -> None:
    """Initialize the database connection and create tables.

    Should be called once during FastAPI startup.
    """
    global _db
    try:
        _db = await aiosqlite.connect(DB_PATH)
        _db.row_factory = aiosqlite.Row
        await _db.execute("PRAGMA journal_mode=WAL")
        await _db.execute("PRAGMA foreign_keys=ON")

        await _db.executescript(
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                last_seen_at TEXT NOT NULL,
                metadata TEXT
            );

            CREATE TABLE IF NOT EXISTS talks (
                id TEXT PRIMARY KEY,
                owner_session_id TEXT NOT NULL REFERENCES user_sessions(id),
                data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS talk_summaries (
                talk_id TEXT PRIMARY KEY REFERENCES talks(id),
                data TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_talks_owner
                ON talks(owner_session_id);
            CREATE INDEX IF NOT EXISTS idx_talks_created
                ON talks(created_at DESC);
            """
        )
        await _db.commit()
        logger.info(f"Database initialized at {DB_PATH} (WAL mode, foreign keys ON)")
    except Exception as e:
        logger.error(f"Failed to initialize database at {DB_PATH}: {e}")
        raise


async def close_db() -> None:
    """Close the database connection.

    Should be called during FastAPI shutdown.
    """
    global _db
    if _db:
        await _db.close()
        _db = None
        logger.info(f"Database connection closed ({DB_PATH})")


def get_db() -> aiosqlite.Connection:
    """Get the active database connection.

    Raises:
        RuntimeError: If the database has not been initialized.
    """
    if _db is None:
        logger.error("Database not initialized — init_db() was not called")
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _db


# =========================================================================
# User Session Operations
# =========================================================================


async def create_user_session(session_id: str) -> None:
    """Create a new anonymous user session."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "INSERT INTO user_sessions (id, created_at, last_seen_at) VALUES (?, ?, ?)",
        (session_id, now, now),
    )
    await db.commit()


async def get_user_session(session_id: str) -> Optional[dict]:
    """Look up a user session by ID. Returns None if not found."""
    db = get_db()
    cursor = await db.execute(
        "SELECT id, created_at, last_seen_at FROM user_sessions WHERE id = ?",
        (session_id,),
    )
    row = await cursor.fetchone()
    if row is None:
        return None
    return {"id": row[0], "created_at": row[1], "last_seen_at": row[2]}


async def touch_user_session(session_id: str) -> None:
    """Update the last_seen_at timestamp for a user session."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        "UPDATE user_sessions SET last_seen_at = ? WHERE id = ?",
        (now, session_id),
    )
    await db.commit()


# =========================================================================
# Talk Persistence Operations
# =========================================================================


async def persist_talk(talk_id: str, owner_session_id: str, data_json: str) -> None:
    """Insert or update a talk in the database."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        """
        INSERT INTO talks (id, owner_session_id, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
        """,
        (talk_id, owner_session_id, data_json, now, now),
    )
    await db.commit()


async def load_talk(talk_id: str) -> Optional[str]:
    """Load a talk's JSON data from the database. Returns None if not found."""
    db = get_db()
    cursor = await db.execute("SELECT data FROM talks WHERE id = ?", (talk_id,))
    row = await cursor.fetchone()
    return row[0] if row else None


async def load_talks_for_owner(owner_session_id: str) -> list[str]:
    """Load all talk JSON blobs for a given owner, newest first."""
    db = get_db()
    cursor = await db.execute(
        "SELECT data FROM talks WHERE owner_session_id = ? ORDER BY created_at DESC",
        (owner_session_id,),
    )
    rows = await cursor.fetchall()
    return [row[0] for row in rows]


async def delete_talk_from_db(talk_id: str) -> bool:
    """Delete a talk from the database. Returns True if deleted."""
    db = get_db()
    cursor = await db.execute("DELETE FROM talks WHERE id = ?", (talk_id,))
    await db.commit()
    return cursor.rowcount > 0


async def get_talk_owner(talk_id: str) -> Optional[str]:
    """Get the owner_session_id for a talk. Returns None if not found."""
    db = get_db()
    cursor = await db.execute(
        "SELECT owner_session_id FROM talks WHERE id = ?", (talk_id,)
    )
    row = await cursor.fetchone()
    return row[0] if row else None


# =========================================================================
# Talk Summary Persistence Operations
# =========================================================================


async def persist_talk_summary(talk_id: str, data_json: str) -> None:
    """Insert or update a talk summary in the database."""
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    await db.execute(
        """
        INSERT INTO talk_summaries (talk_id, data, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(talk_id) DO UPDATE SET data = excluded.data, created_at = excluded.created_at
        """,
        (talk_id, data_json, now),
    )
    await db.commit()


async def load_talk_summary(talk_id: str) -> Optional[str]:
    """Load a talk summary's JSON data. Returns None if not found."""
    db = get_db()
    cursor = await db.execute(
        "SELECT data FROM talk_summaries WHERE talk_id = ?", (talk_id,)
    )
    row = await cursor.fetchone()
    return row[0] if row else None
