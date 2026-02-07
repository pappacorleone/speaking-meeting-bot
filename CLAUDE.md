# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Speaking Meeting Bot is an AI-powered meeting agent system that enables voice-interactive bots to join Google Meet, Microsoft Teams, and Zoom meetings. The system combines:
- **Pipecat** - AI framework for real-time voice conversations
- **MeetingBaas** - Meeting platform integration API
- **OpenAI GPT-4** - Language model for bot intelligence
- **Cartesia** - Text-to-speech synthesis
- **Deepgram/Gladia** - Speech-to-text transcription
- **FastAPI** - REST API and WebSocket server

The project also includes a **Diadi** session system for facilitated conversations with consent workflows, session lifecycle management, and AI-generated summaries.

The **web/** folder contains a Next.js frontend for the Diadi session management UI.

## Quick Start for AI Agents

When asked to "start the codebase", "run the codebase", or similar, start BOTH servers:

```bash
# Backend (FastAPI) - from project root
./.venv/Scripts/python.exe -m uvicorn app:app --reload --host 0.0.0.0 --port 7014

# Frontend (Next.js) - from web/ folder
cd web && npm run dev
```

**URLs after startup:**
- Backend API: http://localhost:7014
- Backend Docs: http://localhost:7014/docs
- Frontend UI: http://localhost:3000

## Common Commands

```bash
# Install dependencies
poetry install

# Compile Protocol Buffers (required after proto changes)
poetry run python -m grpc_tools.protoc --proto_path=./protobufs --python_out=./protobufs frames.proto

# Run the server (standard mode)
poetry run uvicorn app:app --reload --host 0.0.0.0 --port 7014

# Run in local dev mode with ngrok auto-configuration
poetry run python app/main.py --local-dev --port 7014

# Format code
ruff format .

# Lint code
ruff check .

# Run tests
pytest tests/ -v

# Run a single test file
pytest tests/test_session_integration.py -v

# Quick local dev setup (Windows PowerShell)
.\scripts\dev_up.ps1    # Starts ngrok, updates BASE_URL, launches server

# Frontend (Next.js) - run from web/ folder
cd web
npm install            # Install frontend dependencies
npm run dev            # Start dev server (http://localhost:3000)
npm run build          # Build for production
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking (tsc --noEmit)
```

## Architecture

### Backend

```
FastAPI Server (app/main.py:7014)
├── HTTP Routes (app/routes.py)
│   ├── POST /bots - Create bot and join meeting
│   ├── DELETE /bots/{bot_id} - Remove bot from meeting
│   ├── POST /personas/generate-image - Generate AI avatar
│   └── Session Routes (Diadi)
│       ├── POST /sessions - Create facilitated session
│       ├── GET /sessions - List sessions
│       ├── POST /sessions/{id}/consent - Record partner consent
│       ├── POST /sessions/{id}/start - Start session
│       ├── POST /sessions/{id}/pause - Pause (kill switch)
│       ├── POST /sessions/{id}/resume - Resume session
│       ├── POST /sessions/{id}/end - End session
│       └── GET /sessions/{id}/summary - Get AI summary
├── WebSocket Routes (app/websockets.py)
│   ├── /ws/{client_id} - MeetingBaas audio streaming
│   ├── /pipecat/{client_id} - Pipecat service connection
│   └── /sessions/{id}/events - Real-time session events (SSE-style)
├── Services (app/services/)
│   ├── session_service.py - Session lifecycle management
│   └── summary_service.py - AI summary generation
└── Core Components (core/)
    ├── connection.py - ConnectionRegistry, MEETING_DETAILS, PIPECAT_PROCESSES
    ├── process.py - Pipecat subprocess management
    ├── router.py - Audio message routing
    ├── session_store.py - In-memory session storage + timer/tracker management
    ├── intervention_engine.py - AI intervention logic
    └── balance_tracker.py - Conversation balance tracking
```

### Frontend (web/)

Next.js 14 app with App Router, TypeScript (strict), Tailwind CSS, and shadcn/ui components.

```
web/src/
├── app/
│   ├── (dashboard)/           # Dashboard layout group
│   │   ├── hub/page.tsx       # Main hub with active/recent sessions
│   │   ├── sessions/new/      # Session creation wizard
│   │   └── sessions/[id]/     # Session detail & live room
│   │       ├── page.tsx       # Session detail/recap page
│   │       └── live/page.tsx  # Live facilitation room
│   └── invite/[token]/        # Partner consent/invite page
├── components/
│   ├── live/                  # Talk balance, timer, AI status, goal snippet
│   ├── intervention/          # Balance prompt, escalation alert, goal resync
│   ├── session/               # Session cards, forms, wizard steps
│   ├── hub/                   # Dashboard hub components
│   ├── recap/                 # Post-session summary components
│   ├── error/                 # Error boundaries, WS disconnect fallbacks
│   └── ui/                    # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── stores/                    # Zustand state management
│   ├── session-store.ts       # Session state (status, timer, balance, AI status)
│   └── intervention-store.ts  # Intervention queue and history
├── hooks/
│   └── use-session-events.ts  # WebSocket hook for real-time session events
├── lib/
│   └── api/                   # Backend API client functions
└── types/
    ├── session.ts             # Frontend session types (camelCase)
    ├── events.ts              # WebSocket event types with type guards
    └── intervention.ts        # Intervention types
```

**Key frontend patterns:**
- **snake_case ↔ camelCase**: Backend uses snake_case, frontend uses camelCase. Transformation happens in `live/page.tsx:transformSession()` and API response types live in `lib/api/types.ts` (snake_case) vs `types/session.ts` (camelCase).
- **State management**: Zustand stores for session state and interventions, React Query for API data fetching.
- **Real-time events**: `use-session-events` hook connects to `/sessions/{id}/events` WebSocket, dispatches typed events to Zustand stores.
- **Strict TypeScript**: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` are all enabled.
- **Path alias**: `@/*` maps to `./src/*` for all imports.

### Audio Pipeline Flow
1. Client calls `POST /bots` with meeting URL and persona
2. Server resolves persona, generates WebSocket URL, calls MeetingBaas API
3. Pipecat subprocess spawned (`scripts/meetingbaas.py`)
4. MeetingBaas bot joins meeting, connects to `/ws/{client_id}`
5. Pipecat connects to `/pipecat/{client_id}`
6. Audio streams: Meeting → STT (Deepgram) → LLM (OpenAI) → TTS (Cartesia) → Meeting

### Key Data Stores (In-Memory)
- `MEETING_DETAILS` - Bot metadata indexed by client_id
- `PIPECAT_PROCESSES` - Subprocess tracking for cleanup
- `SESSION_STORE` - Diadi session state (core/session_store.py)
- `SESSION_EVENTS` - WebSocket connections for real-time event broadcast per session
- `SESSION_TIMER_STATE` / `SESSION_TIMER_TASKS` - Per-session timer state and async tasks
- `SESSION_INTERVENTION_ENGINES` / `SESSION_BALANCE_TRACKERS` - Runtime engines per session

### Diadi Session Lifecycle
States: `draft` → `pending_consent` → `ready` → `in_progress` ↔ `paused` → `ending` → `ended` (or `archived` if declined)

1. Create session with partner info, goal, and facilitator persona
2. System generates invite link with token
3. Partner accepts/declines via consent endpoint
4. Both parties consent → status changes to "ready"
5. Session starts → bot joins meeting, timer/balance tracker/intervention engine start
6. Pause/Resume available during session (kill switch)
7. End session → captures metrics → cleanup (bot leave, WS close, process kill) → generates summary

### Intervention Engine Policy
The intervention engine (`core/intervention_engine.py`) follows a minimal intervention philosophy:
- No interventions in first 3 minutes
- No more than 1 intervention every 2 minutes
- Visual-first delivery, voice only for severe cases
- Priority order: Escalation > Severe Balance > Time Warning > Silence > Mild Balance > Goal Drift

## Persona System

Personas are stored in `config/personas/{persona_name}/`:
```
persona_name/
├── README.md          # Main definition with metadata (image, voice_id, entry_message)
└── *.md              # Additional knowledge/behavior files
```

Persona loading is handled by `config/persona_utils.py` via `PersonaManager` class. The README.md contains YAML-like metadata section with `image`, `entry_message`, `cartesia_voice_id`, `gender`, `relevant_links`.

### Diadi Facilitator Personas
- `neutral_mediator` - Balanced facilitator, never takes sides
- `deep_empath` - Emotionally-focused facilitator
- `decision_catalyst` - Goal-oriented, decision-focused facilitator

## Code Style

**Python (Backend):**
- **Formatter**: Ruff (line length 88 per pyproject.toml)
- **Style Guide**: Google Python Style Guide
- **Type hints**: Required for public APIs
- **Docstrings**: Google-style format
- **Indentation**: 4 spaces (no tabs)
- **Imports**: Grouped (future, stdlib, third-party, local), sorted lexicographically

**TypeScript (Frontend):**
- **Framework**: Next.js 14 with App Router
- **Strict mode**: TypeScript strict with `noUncheckedIndexedAccess`
- **Styling**: Tailwind CSS with `cn()` utility (clsx + tailwind-merge)
- **Components**: shadcn/ui (Radix UI primitives)
- **Forms**: react-hook-form + zod validation

## Environment Variables

Required:
- `MEETING_BAAS_API_KEY` - MeetingBaas API key
- `OPENAI_API_KEY` - OpenAI API key for LLM
- `CARTESIA_API_KEY` - Cartesia TTS API key
- `DEEPGRAM_API_KEY` or `GLADIA_API_KEY` - STT service

Optional:
- `BASE_URL` - WebSocket base URL (critical for production)
- `REPLICATE_KEY` - AI image generation
- `UTFS_KEY` / `APP_ID` - UploadThing image hosting
- `NGROK_AUTHTOKEN` - Local development tunneling

Frontend (in `web/.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL (defaults to http://localhost:7014)
- `NEXT_PUBLIC_MEETING_BAAS_API_KEY` - API key for frontend requests

## WebSocket URL Resolution Priority

1. User-provided URL in request
2. `BASE_URL` environment variable (recommended for production)
3. ngrok URL detection in local dev mode
4. Auto-detection from request headers (fallback)

## API Authentication

All protected endpoints require header: `x-meeting-baas-api-key`

## Troubleshooting

### Common Issues

**Poetry not found on Windows:**
Use the virtual environment directly:
```powershell
.\.venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 7014
```

**ModuleNotFoundError: No module named 'config':**
Fixed in `core/process.py` by setting PYTHONPATH for the subprocess. Verify that `process.py` sets `env["PYTHONPATH"] = project_root` and the subprocess runs with `cwd=project_root`.

**ImportError: cannot import name 'TaskManager' from 'pipecat.utils.asyncio':**
Occurs with pipecat version 0.0.98 which doesn't have TaskManager. Fixed in `scripts/meetingbaas.py` by wrapping the import in try/except.

**Protobuf version mismatch (gencode vs runtime):**
Regenerate protobuf files:
```bash
.\.venv\Scripts\python.exe -m grpc_tools.protoc --proto_path=./protobufs --python_out=./protobufs frames.proto
```

**Old bots keep reconnecting after server restart:**
MEETING_DETAILS is in-memory and cleared on restart. Old MeetingBaas bots will fail with "No meeting details found". Remove them via the MeetingBaas dashboard or wait for them to timeout.

### Debugging Pipecat Subprocess

Pipecat subprocess logs appear with `[Pipecat STDOUT]` and `[Pipecat STDERR]` prefixes in the server output. If you don't see these:
1. Ensure `-u` flag is passed to Python for unbuffered output (in `core/process.py`)
2. Check that PYTHONPATH is set correctly
3. Run the script directly to see immediate errors:
   ```powershell
   $env:PYTHONPATH="C:\Users\kmond\meeting bot\speaking-meeting-bot"
   .\.venv\Scripts\python.exe scripts/meetingbaas.py --help
   ```

### Version Compatibility

**Required:** Python 3.11+ (specified in pyproject.toml)

Tested with:
- pipecat-ai 0.0.98 (note: some newer features require manual compatibility fixes)
- deepgram-sdk 4.7.0
- protobuf 5.x (runtime)
