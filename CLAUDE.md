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

The project also includes a **Diadi** talk system for facilitated conversations with consent workflows, talk lifecycle management, and AI-generated summaries. "Talks" are the Diadi concept for facilitated conversations (previously called "sessions"). The word "session" is now reserved for user/browser sessions.

Anonymous user sessions are tracked via `diadi_session` httpOnly cookies backed by SQLite (`core/database.py`). Each browser gets a unique session ID, and talks are linked to sessions via `owner_session_id`.

The **web/** folder contains a Next.js frontend for the Diadi talk management UI.

## Quick Start for AI Agents

When asked to "start the codebase", "run the codebase", or similar, start ALL THREE services:

```bash
# 1. Cloudflare tunnel (exposes backend for MeetingBaas bot callbacks)
cloudflared tunnel --url http://localhost:7014

# 2. Update BASE_URL in .env with the tunnel URL from step 1

# 3. Backend (FastAPI) - from project root
./.venv/Scripts/python.exe -m uvicorn app:app --reload --host 0.0.0.0 --port 7014

# 4. Frontend (Next.js) - from web/ folder
cd web && npm run dev
```

**URLs after startup:**
- Backend API: http://localhost:7014
- Backend Docs: http://localhost:7014/docs
- Frontend UI: http://localhost:3000 (or 3001/3002 if port is taken)
- Tunnel: https://<random>.trycloudflare.com → localhost:7014

**Why the tunnel matters:** MeetingBaas bots connect back to your server via WebSocket using `BASE_URL`. Without a live tunnel, bots join the meeting but can't stream audio — they sit silent. If the bot joins but doesn't speak, check that `BASE_URL` in `.env` points to a live tunnel.

## Common Commands

```bash
# Install dependencies
poetry install

# Compile Protocol Buffers (required after proto changes)
poetry run python -m grpc_tools.protoc --proto_path=./protobufs --python_out=./protobufs frames.proto

# Run the server (standard mode)
poetry run uvicorn app:app --reload --host 0.0.0.0 --port 7014

# Expose backend via Cloudflare tunnel (preferred for local dev)
cloudflared tunnel --url http://localhost:7014
# Then update BASE_URL in .env with the printed tunnel URL

# Run in local dev mode with ngrok auto-configuration (fallback)
poetry run python app/main.py --local-dev --port 7014

# Format code
ruff format .

# Lint code
ruff check .

# Run tests
pytest tests/ -v

# Run a single test file
pytest tests/test_talk_integration.py -v

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

### Middleware Stack

Middleware uses `add_middleware()` in LIFO order — last added = outermost = runs first:
```
Request → CORSMiddleware → AnonymousSessionMiddleware → ApiKeyMiddleware → Route
```
- **CORSMiddleware** (outermost): Handles preflight OPTIONS, sets CORS headers. Requires explicit origins (not `"*"`) because `credentials: 'include'` sends cookies.
- **AnonymousSessionMiddleware** (`app/middleware.py`): Sets/reads `diadi_session` cookie, creates DB session for new visitors. Skips OPTIONS, WebSocket upgrades, and `/health` paths.
- **ApiKeyMiddleware** (`app/main.py`): Requires `x-meeting-baas-api-key` header for `/bots/*` and `/personas/*` routes. Skips `/talks/*` (cookie-auth) and OPTIONS.

All three must pass OPTIONS through untouched — otherwise CORS preflight fails.

### Backend

```
FastAPI Server (app/main.py:7014)
├── HTTP Routes (app/routes.py)
│   ├── POST /bots - Create bot and join meeting
│   ├── DELETE /bots/{bot_id} - Remove bot from meeting
│   ├── POST /personas/generate-image - Generate AI avatar
│   └── Talk Routes (Diadi)
│       ├── POST /talks - Create facilitated talk
│       ├── GET /talks - List talks (filtered by user session)
│       ├── POST /talks/{id}/consent - Record partner consent
│       ├── POST /talks/{id}/start - Start talk
│       ├── POST /talks/{id}/pause - Pause (kill switch)
│       ├── POST /talks/{id}/resume - Resume talk
│       ├── POST /talks/{id}/end - End talk
│       └── GET /talks/{id}/summary - Get AI summary
├── WebSocket Routes (app/websockets.py)
│   ├── /ws/{client_id} - MeetingBaas audio streaming
│   ├── /pipecat/{client_id} - Pipecat service connection
│   └── /talks/{id}/events - Real-time talk events (SSE-style)
├── Middleware (app/middleware.py)
│   └── AnonymousSessionMiddleware - Cookie-based user sessions
├── Services (app/services/)
│   ├── talk_service.py - Talk lifecycle management
│   └── summary_service.py - AI summary generation
└── Core Components (core/)
    ├── connection.py - ConnectionRegistry, MEETING_DETAILS, PIPECAT_PROCESSES
    ├── process.py - Pipecat subprocess management
    ├── router.py - Audio message routing
    ├── database.py - SQLite persistence (aiosqlite)
    ├── talk_store.py - Hybrid in-memory + SQLite talk storage
    ├── intervention_engine.py - AI intervention logic
    └── balance_tracker.py - Conversation balance tracking
```

### Frontend (web/)

Next.js 14 app with App Router, TypeScript (strict), Tailwind CSS, and shadcn/ui components.

```
web/src/
├── app/
│   ├── (dashboard)/           # Dashboard layout group
│   │   ├── hub/page.tsx       # Main hub with active/recent talks
│   │   ├── talks/new/         # Talk creation wizard
│   │   └── talks/[id]/        # Talk detail & live room
│   │       ├── page.tsx       # Talk detail/recap page
│   │       └── live/page.tsx  # Live facilitation room
│   └── invite/[token]/        # Partner consent/invite page
├── components/
│   ├── live/                  # Talk balance, timer, AI status, goal snippet
│   ├── intervention/          # Balance prompt, escalation alert, goal resync
│   ├── talk/                  # Talk cards, forms, wizard steps
│   ├── hub/                   # Dashboard hub components
│   ├── recap/                 # Post-talk summary components
│   ├── error/                 # Error boundaries, WS disconnect fallbacks
│   └── ui/                    # shadcn/ui primitives (Button, Card, Dialog, etc.)
├── stores/                    # Zustand state management
│   ├── talk-store.ts          # Talk state (status, timer, balance, AI status)
│   └── intervention-store.ts  # Intervention queue and history
├── hooks/
│   └── use-talk-events.ts     # WebSocket hook for real-time talk events
├── lib/
│   └── api/                   # Backend API client functions (credentials: 'include')
└── types/
    ├── talk.ts                # Frontend talk types (camelCase)
    ├── events.ts              # WebSocket event types with type guards
    └── intervention.ts        # Intervention types
```

**Key frontend patterns:**
- **snake_case ↔ camelCase**: Backend uses snake_case, frontend uses camelCase. Transformation happens in `live/page.tsx:transformTalk()` and API response types live in `lib/api/types.ts` (snake_case) vs `types/talk.ts` (camelCase).
- **State management**: Zustand stores for talk state and interventions, React Query for API data fetching.
- **Real-time events**: `use-talk-events` hook connects to `/talks/{id}/events` WebSocket, dispatches typed events to Zustand stores.
- **Anonymous sessions**: Browser cookie (`diadi_session`) identifies users. `apiFetch()` sends `credentials: 'include'` so the cookie is sent with every API request.
- **Strict TypeScript**: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` are all enabled.
- **Path alias**: `@/*` maps to `./src/*` for all imports.

### Audio Pipeline Flow
1. Client calls `POST /bots` with meeting URL and persona
2. Server resolves persona, generates WebSocket URL, calls MeetingBaas API
3. Pipecat subprocess spawned (`scripts/meetingbaas.py`)
4. MeetingBaas bot joins meeting, connects to `/ws/{client_id}`
5. Pipecat connects to `/pipecat/{client_id}`
6. Audio streams: Meeting → STT (Deepgram) → LLM (OpenAI) → TTS (Cartesia) → Meeting

### Key Data Stores

**In-Memory (runtime only):**
- `MEETING_DETAILS` - Bot metadata indexed by client_id
- `PIPECAT_PROCESSES` - Subprocess tracking for cleanup
- `TALK_STORE` - Active talk state (core/talk_store.py)
- `TALK_EVENTS` - WebSocket connections for real-time event broadcast per talk
- `TALK_TIMER_STATE` / `TALK_TIMER_TASKS` - Per-talk timer state and async tasks
- `TALK_INTERVENTION_ENGINES` / `TALK_BALANCE_TRACKERS` - Runtime engines per talk

**SQLite (persistent, via core/database.py):**
- `user_sessions` table - Anonymous browser sessions (cookie → session ID)
- `talks` table - Talk data (JSON blob), linked to owner session via `owner_session_id`
- `talk_summaries` table - AI-generated talk summaries

Hybrid storage: `create_talk()` / `update_talk()` write to both in-memory and SQLite. `get_talk()` checks in-memory first, falls back to SQLite. `list_talks()` reads from SQLite filtered by owner.

### Diadi Talk Lifecycle
States: `draft` → `pending_consent` → `ready` → `in_progress` ↔ `paused` → `ending` → `ended` (or `archived` if declined)

1. Create talk with partner info, goal, and facilitator persona
2. System generates invite link with token
3. Partner accepts/declines via consent endpoint
4. Both parties consent → status changes to "ready"
5. Talk starts → bot joins meeting, timer/balance tracker/intervention engine start
6. Pause/Resume available during talk (kill switch)
7. End talk → captures metrics → cleanup (bot leave, WS close, process kill) → generates summary

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
- `BASE_URL` - WebSocket base URL for MeetingBaas bot callbacks (set to Cloudflare tunnel URL for local dev, production domain for deploy). **Bot will join but not speak if this is stale.**
- `DIADI_DB_PATH` - SQLite database path (default: `diadi.db`)
- `ALLOWED_ORIGINS` - Comma-separated CORS origins (default: localhost:3000, localhost:7014, Cloud Run frontend)
- `REPLICATE_KEY` - AI image generation
- `UTFS_KEY` / `APP_ID` - UploadThing image hosting
- `NGROK_AUTHTOKEN` - Local development tunneling (fallback; prefer Cloudflare tunnel)

Frontend (in `web/.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL (defaults to http://localhost:7014)
- `NEXT_PUBLIC_WS_URL` - WebSocket URL for real-time talk events (defaults to ws://localhost:7014)
- `NEXT_PUBLIC_MEETING_BAAS_API_KEY` - API key for frontend requests

Note: `NEXT_PUBLIC_*` vars are baked in at build time for Docker/production builds. They must be passed as Docker build args (see `web/Dockerfile`).

## WebSocket URL Resolution Priority

1. User-provided URL in request
2. `BASE_URL` environment variable (set this to your Cloudflare tunnel URL for local dev, or your production domain)
3. ngrok URL detection in `--local-dev` mode (fallback)
4. Auto-detection from request headers (last resort)

**Local dev:** Use `cloudflared tunnel --url http://localhost:7014` (preferred) or ngrok. Update `BASE_URL` in `.env` with the tunnel URL. Cloudflare quick tunnels are free, no account required, and generate a new URL each run.

## API Authentication

- **Bot/Persona routes** (`/bots/*`, `/personas/*`): Require header `x-meeting-baas-api-key`
- **Talk routes** (`/talks/*`): Authenticated by anonymous `diadi_session` cookie (no API key required). The cookie is set automatically by `AnonymousSessionMiddleware`.
- **CORS**: Explicit origins required (not `"*"`) because `credentials: 'include'` is used. Configure via `ALLOWED_ORIGINS` env var.

## GCP Deployment (Cloud Run)

- **Project**: `diadi-486721`, region `us-central1`
- **Backend URL**: `https://meeting-bot-backend-800153001723.us-central1.run.app`
- **Frontend URL**: `https://meeting-bot-frontend-800153001723.us-central1.run.app`
- **Deploy script**: `scripts/deploy_gcp.sh` (supports `--backend-only` and `--frontend-only`)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy-gcp.yml`) triggers on push to `gcp-deployment` branch

```bash
# Manual deploy
./scripts/deploy_gcp.sh                # Both services
./scripts/deploy_gcp.sh --backend-only  # Backend only
./scripts/deploy_gcp.sh --frontend-only # Frontend only

# View logs
gcloud run services logs read meeting-bot-backend --region us-central1
```

**Backend Cloud Run config**: 1 instance always-on, 2Gi RAM, 2 CPU, 3600s timeout, session affinity. Secrets from GCP Secret Manager: `MEETING_BAAS_API_KEY`, `OPENAI_API_KEY`, `CARTESIA_API_KEY`, `DEEPGRAM_API_KEY`. `BASE_URL` is auto-set to the Cloud Run service URL after deploy.

**Frontend Cloud Run config**: 0-3 instances, 512Mi RAM, standalone Next.js. `NEXT_PUBLIC_*` env vars are passed as Docker build args at build time.

### Docker Build Notes

**Backend** (`Dockerfile`): Python 3.11-slim, installs ffmpeg (required for audio), compiles protobufs during build, sets `PYTHONPATH="/app"`.

**Frontend** (`web/Dockerfile`): Multi-stage build (deps → builder → runner). Requires `output: "standalone"` in `next.config.mjs`. Uses `mkdir -p public` before build (missing `public/` dir breaks standalone). Runs as non-root user. `NEXT_PUBLIC_*` vars must be set as build args.

### Cloud Build Gotchas (Windows)

- `nul` file (Windows reserved device name) breaks Linux Docker/Kaniko builds — must be listed in `.gcloudignore`
- Cloud Build uses `.gcloudignore` (NOT `.dockerignore`) for upload filtering
- Cloud Run reserves `PORT` env var — don't set it manually via `--set-env-vars` (backend Dockerfile already sets it)
- Cloud Run service account needs `roles/secretmanager.secretAccessor` for Secret Manager access

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

**Bot joins meeting but doesn't speak:**
`BASE_URL` in `.env` points to a dead/stale tunnel. Logs will show `[AUDIO ROUTING] No client connection found for <id>`. Fix: start a new Cloudflare tunnel (`cloudflared tunnel --url http://localhost:7014`), update `BASE_URL` in `.env`, restart backend.

**Zombie processes holding ports (Windows):**
On Windows, Python and Node processes can survive after the parent is killed, holding ports 7014/3000-3002. Symptoms: server appears to start but serves old code, or "address already in use" errors.
```powershell
# Find what's on a port
netstat -ano | findstr ":7014"
# Kill by PID
taskkill /F /PID <pid>
```
Check before starting servers if another project might share ports (3000, 3001, 3002 are common).

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
