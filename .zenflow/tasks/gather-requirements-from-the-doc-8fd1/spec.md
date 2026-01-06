# Diadi Frontend - Technical Specification

**Version:** 1.0
**Date:** 2026-01-05
**Status:** Draft
**Requirements Reference:** [requirements.md](./requirements.md)

---

## Table of Contents
1. [Technical Context](#1-technical-context)
2. [System Architecture](#2-system-architecture)
3. [Frontend Implementation](#3-frontend-implementation)
4. [Backend Extensions](#4-backend-extensions)
5. [Data Models](#5-data-models)
6. [API Contracts](#6-api-contracts)
7. [Real-Time Communication](#7-real-time-communication)
8. [Persona System Extensions](#8-persona-system-extensions)
9. [Delivery Phases](#9-delivery-phases)
10. [Verification Approach](#10-verification-approach)

---

## 1. Technical Context

### 1.1 Existing Stack

**Backend (Current)**
- **Framework:** FastAPI (async HTTP/WebSocket) on port 7014
- **Real-time AI:** Pipecat 0.0.98+ (audio pipeline with STT→LLM→TTS)
- **LLM:** OpenAI GPT-4 (gpt-4o)
- **Speech Services:** Deepgram/Gladia (STT), Cartesia (TTS)
- **Meeting Integration:** MeetingBaas REST API
- **Data Validation:** Pydantic models
- **Audio:** Protocol Buffers for frame serialization
- **Logging:** Loguru

**Current Backend Structure:**
```
├── app/
│   ├── main.py           # FastAPI app entry point
│   ├── models.py         # Pydantic request/response models
│   ├── routes.py         # HTTP endpoints (POST /bots, DELETE /bots/{id})
│   └── websockets.py     # WebSocket handlers
├── core/
│   ├── connection.py     # ConnectionRegistry, MEETING_DETAILS, PIPECAT_PROCESSES
│   ├── process.py        # Pipecat subprocess management
│   ├── router.py         # Audio message routing
│   └── converter.py      # Protobuf conversion
├── config/
│   ├── persona_utils.py  # PersonaManager class
│   ├── voice_utils.py    # VoiceUtils, CartesiaVoiceManager
│   └── personas/         # Persona definitions (40+ existing)
├── scripts/
│   ├── meetingbaas.py    # Pipecat audio pipeline
│   └── meetingbaas_api.py # MeetingBaas REST wrapper
└── protobufs/
    └── frames_pb2.py     # Protocol Buffer definitions
```

### 1.2 New Frontend Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 14 (App Router) | Server components, server actions |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Custom theme per UX specs |
| Components | shadcn/ui | Customized for Diadi design system |
| State (UI) | Zustand | Session UI state, intervention queue |
| State (Server) | TanStack Query | API caching, mutations, optimistic updates |
| Validation | Zod | Runtime validation, form schemas |
| WebSocket | Native WebSocket | Custom hook with reconnection |
| Testing | Vitest + Testing Library | Unit + integration tests |

### 1.3 Key Dependencies

**External Services:**
- MeetingBaas API (meeting bot orchestration)
- OpenAI API (LLM intelligence, persona extraction)
- Cartesia API (text-to-speech)
- Deepgram/Gladia API (speech-to-text)

**Reusable Backend Components:**
- `PersonaManager` - persona loading/resolution
- `VoiceUtils` - voice matching
- `start_pipecat_process()` - subprocess spawning
- `ConnectionRegistry` - WebSocket management
- `MessageRouter` - audio routing
- `ProtobufConverter` - audio serialization

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           DIADI SYSTEM                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐         ┌─────────────────────────────────────┐    │
│  │  Next.js 14     │         │      FastAPI Backend                │    │
│  │  (Frontend)     │         │      (Extended)                     │    │
│  │                 │         │                                     │    │
│  │  ┌───────────┐  │  HTTP   │  ┌─────────────┐ ┌───────────────┐ │    │
│  │  │ Hub       │◄─┼────────►│  │ Session     │ │ Bot           │ │    │
│  │  │ Sessions  │  │  REST   │  │ Endpoints   │ │ Endpoints     │ │    │
│  │  │ Wizard    │  │         │  │ (NEW)       │ │ (existing)    │ │    │
│  │  └───────────┘  │         │  └─────────────┘ └───────────────┘ │    │
│  │                 │         │         │                │          │    │
│  │  ┌───────────┐  │   WS    │  ┌──────┴────────────────┴───────┐ │    │
│  │  │ Live Room │◄─┼────────►│  │     SessionService (NEW)      │ │    │
│  │  │ Events    │  │         │  │  - Session state machine      │ │    │
│  │  │ Balance   │  │         │  │  - Consent tracking           │ │    │
│  │  └───────────┘  │         │  │  - Intervention logic         │ │    │
│  │                 │         │  │  - Balance tracking           │ │    │
│  └─────────────────┘         │  └───────────────────────────────┘ │    │
│                              │         │                          │    │
│                              │  ┌──────┴──────────────────────┐   │    │
│                              │  │ Pipecat Subprocess          │   │    │
│                              │  │ + Intervention Logic        │   │    │
│                              │  │ + Balance Tracking          │   │    │
│                              │  └─────────────────────────────┘   │    │
│                              │         │                          │    │
│                              └─────────┼──────────────────────────┘    │
│                                        │                               │
│                              ┌─────────▼──────────────────────┐        │
│                              │ External Meeting Platform      │        │
│                              │ (Zoom/Meet/Teams via          │        │
│                              │  MeetingBaas)                  │        │
│                              └────────────────────────────────┘        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

**Session Creation Flow:**
```
1. User fills Session Creation Wizard
2. POST /sessions → creates session (status: draft)
3. User invites partner → generates invite token
4. Partner visits /invite/[token]
5. Partner accepts → POST /sessions/{id}/consent
6. Both consented → session status: ready
7. Creator clicks "Launch" → POST /sessions/{id}/start
8. Backend spawns Pipecat, calls MeetingBaas
9. Both users connect to /sessions/{id}/events WebSocket
10. Real-time events flow: balance, interventions, time
11. Session ends → POST /sessions/{id}/end
12. GET /sessions/{id}/summary → display recap
```

### 2.3 Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Participant │    │ MeetingBaas │    │  Pipecat    │
│ A (Browser) │    │   Bot       │    │  Process    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       │   Speaks         │                  │
       ├─────────────────►│  Audio Stream    │
       │                  ├─────────────────►│
       │                  │                  │ STT
       │                  │                  ├──────┐
       │                  │                  │      │
       │                  │                  │◄─────┘
       │                  │                  │ LLM + Balance Check
       │                  │                  ├──────┐
       │                  │                  │      │
       │                  │                  │◄─────┘
       │                  │                  │
       │                  │  balance_update  │
       │◄─────────────────┼──────────────────┤ (via WS events)
       │                  │                  │
       │                  │  intervention?   │
       │◄─────────────────┼──────────────────┤ (if threshold met)
       │                  │                  │
       │                  │  Audio Response  │
       │                  │◄─────────────────┤ TTS (voice intervention)
       │    Hears AI      │                  │
       │◄─────────────────┤                  │
       │                  │                  │
```

---

## 3. Frontend Implementation

### 3.1 Directory Structure

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with providers
│   │   ├── page.tsx                      # Redirect to /hub
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                # Dashboard shell with navigation
│   │   │   ├── hub/
│   │   │   │   └── page.tsx              # Hub (home) page
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx              # Sessions list (redirects to hub)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # Session creation wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # Session detail (pre/post)
│   │   │   │       └── live/
│   │   │   │           └── page.tsx      # Live facilitation room
│   │   │   └── profile/
│   │   │       └── page.tsx              # User profile + integrations
│   │   └── invite/
│   │       └── [token]/
│   │           └── page.tsx              # Partner invitation page
│   │
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives (customized)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── toggle.tsx
│   │   │   └── ...
│   │   ├── navigation/
│   │   │   ├── mobile-nav.tsx            # Bottom bar (mobile)
│   │   │   ├── side-rail.tsx             # Side navigation (desktop)
│   │   │   └── nav-item.tsx
│   │   ├── hub/
│   │   │   ├── active-session-card.tsx
│   │   │   ├── recent-sessions-list.tsx
│   │   │   ├── artifact-grid.tsx
│   │   │   └── search-bar.tsx
│   │   ├── session/
│   │   │   ├── wizard/
│   │   │   │   ├── step-identity.tsx     # Step 0: Identity & Bond
│   │   │   │   ├── step-goal.tsx         # Step 1: Session Goal
│   │   │   │   ├── step-facilitator.tsx  # Step 2: Facilitator Calibration
│   │   │   │   ├── step-review.tsx       # Step 3: Review & Connect
│   │   │   │   ├── step-launch.tsx       # Step 4: Launch Hub
│   │   │   │   └── wizard-provider.tsx   # Wizard state context
│   │   │   ├── session-card.tsx
│   │   │   ├── persona-selector.tsx
│   │   │   ├── parameter-toggles.tsx
│   │   │   ├── waiting-room.tsx
│   │   │   └── consent-form.tsx
│   │   ├── live/
│   │   │   ├── talk-balance.tsx
│   │   │   ├── ai-status-indicator.tsx
│   │   │   ├── session-timer.tsx
│   │   │   ├── goal-snippet.tsx
│   │   │   ├── kill-switch.tsx
│   │   │   ├── facilitator-settings.tsx
│   │   │   └── sentiment-indicators.tsx
│   │   ├── intervention/
│   │   │   ├── intervention-overlay.tsx
│   │   │   ├── balance-prompt.tsx
│   │   │   ├── silence-prompt.tsx
│   │   │   ├── time-warning.tsx
│   │   │   ├── escalation-alert.tsx
│   │   │   ├── icebreaker-modal.tsx
│   │   │   └── goal-resync.tsx
│   │   ├── recap/
│   │   │   ├── synthesis-board.tsx
│   │   │   ├── transcript-view.tsx
│   │   │   ├── key-agreements.tsx
│   │   │   ├── action-items.tsx
│   │   │   └── rating-prompt.tsx
│   │   └── common/
│   │       ├── status-badge.tsx
│   │       ├── avatar.tsx
│   │       ├── loading-spinner.tsx
│   │       └── empty-state.tsx
│   │
│   ├── hooks/
│   │   ├── use-session.ts                # Session data fetching
│   │   ├── use-sessions.ts               # Sessions list
│   │   ├── use-session-events.ts         # WebSocket events
│   │   ├── use-session-mutations.ts      # Create, consent, start, end
│   │   ├── use-wizard-state.ts           # Wizard form state
│   │   └── use-media-permissions.ts      # Mic/camera access
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                 # Base API client (fetch wrapper)
│   │   │   ├── sessions.ts               # Session API functions
│   │   │   └── types.ts                  # API response types
│   │   ├── utils.ts                      # General utilities
│   │   └── constants.ts                  # App constants
│   │
│   ├── stores/
│   │   ├── session-store.ts              # Zustand: live session UI state
│   │   └── intervention-store.ts         # Zustand: intervention queue
│   │
│   └── types/
│       ├── session.ts                    # Session, Participant, etc.
│       ├── intervention.ts               # Intervention types
│       └── events.ts                     # WebSocket event types
│
├── public/
│   └── icons/                            # App icons
│
├── tailwind.config.ts                    # Custom Diadi theme
├── next.config.js
├── tsconfig.json
└── package.json
```

### 3.2 Design System Implementation

**Tailwind Theme Extension (`tailwind.config.ts`):**
```typescript
const config = {
  theme: {
    extend: {
      colors: {
        // Primary palette (from UX specs)
        background: '#F5F3EF',        // Warm cream
        foreground: '#2D2D2D',        // Dark charcoal
        primary: {
          DEFAULT: '#2D2D2D',         // Primary CTA
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#6B7B5C',         // Olive/sage green
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#8B8B8B',         // Text secondary
          foreground: '#2D2D2D',
        },
        status: {
          active: '#4CAF50',          // Green indicators
          warning: '#F59E0B',         // Amber warnings
        },
        sidebar: '#2D2D2D',           // Desktop nav
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'button': '9999px',           // Pill-shaped
      },
    },
  },
};
```

**Component Patterns:**
- Cards: `rounded-card shadow-sm bg-white`
- Primary buttons: `rounded-button bg-primary text-primary-foreground uppercase tracking-wide`
- Secondary buttons: `rounded-button bg-secondary text-secondary-foreground uppercase`
- Section headers: `text-xs uppercase tracking-widest text-muted`

### 3.3 Key Components

**TalkBalance Component:**
```typescript
interface TalkBalanceProps {
  participantA: { name: string; percentage: number };
  participantB: { name: string; percentage: number };
  status: 'balanced' | 'mild_imbalance' | 'severe_imbalance';
}

// Visual: Horizontal bicolor bar, real-time updates via WebSocket
// Updates every 1-2 seconds
// Color coding based on status
```

**AIStatusIndicator Component:**
```typescript
type AIStatus = 'listening' | 'preparing' | 'intervening' | 'paused';

// Visual: Circular indicator with animated states
// - listening: subtle pulse
// - preparing: loading spinner
// - intervening: active glow
// - paused: gray/dimmed
```

**InterventionOverlay Component:**
```typescript
interface InterventionProps {
  type: InterventionType;
  modality: 'visual' | 'voice';
  message: string;
  targetParticipant?: string;
  onDismiss: () => void;
}

// Renders appropriate intervention variant
// Stacks if multiple (queue in intervention-store)
// Auto-dismiss after timeout (visual only)
```

### 3.4 State Management

**Session Store (Zustand):**
```typescript
interface SessionUIState {
  // Connection
  isConnected: boolean;
  connectionError: string | null;

  // Live metrics
  balance: TalkBalanceMetrics | null;
  aiStatus: AIStatus;
  timeRemaining: number;

  // Facilitator settings (runtime adjustments)
  facilitatorPaused: boolean;
  sentimentDetection: boolean;
  tensionMonitoring: boolean;

  // Actions
  setBalance: (balance: TalkBalanceMetrics) => void;
  setAIStatus: (status: AIStatus) => void;
  toggleFacilitator: () => void;
  // ...
}
```

**Intervention Store (Zustand):**
```typescript
interface InterventionState {
  queue: Intervention[];
  current: Intervention | null;

  push: (intervention: Intervention) => void;
  dismiss: () => void;
  clear: () => void;
}
```

### 3.5 WebSocket Hook

```typescript
function useSessionEvents(sessionId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setBalance, setAIStatus } = useSessionStore();
  const { push } = useInterventionStore();

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/sessions/${sessionId}/events`);

    ws.onopen = () => setIsConnected(true);
    ws.onerror = () => setError('Connection failed');
    ws.onclose = () => {
      setIsConnected(false);
      // Reconnection with exponential backoff
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'balance_update':
          setBalance(data.data);
          break;
        case 'intervention':
          push(data.data);
          break;
        case 'session_state':
          // Handle state transitions
          break;
        // ... other event types
      }
    };

    return () => ws.close();
  }, [sessionId]);

  return { isConnected, error };
}
```

---

## 4. Backend Extensions

### 4.1 New Files

```
├── app/
│   ├── models.py              # Extended with Session models
│   ├── routes.py              # Extended with session routes
│   ├── websockets.py          # Extended with session events WS
│   └── services/
│       ├── session_service.py # NEW: Session business logic
│       └── summary_service.py # NEW: Post-session summary generation
├── core/
│   ├── session_store.py       # NEW: In-memory session storage
│   ├── balance_tracker.py     # NEW: Talk balance calculation
│   └── intervention_engine.py # NEW: Intervention decision logic
└── config/
    └── personas/
        ├── neutral_mediator/  # NEW persona
        ├── deep_empath/       # NEW persona
        └── decision_catalyst/ # NEW persona
```

### 4.2 Session Service

**`app/services/session_service.py`:**
```python
from typing import Optional, Dict, List
from datetime import datetime
import secrets
from core.session_store import SESSION_STORE
from app.models import Session, SessionStatus, Participant

class SessionService:
    """Manages session lifecycle and state transitions."""

    async def create_session(
        self,
        creator_id: str,
        goal: str,
        relationship_context: str,
        facilitator_persona: str,
        duration_minutes: int,
        platform: str,
        scheduled_at: Optional[str] = None,
    ) -> Session:
        """Create a new session in draft status."""
        session_id = secrets.token_urlsafe(16)
        invite_token = secrets.token_urlsafe(32)

        session = Session(
            id=session_id,
            goal=goal,
            relationship_context=relationship_context,
            platform=platform,
            duration_minutes=duration_minutes,
            scheduled_at=scheduled_at,
            status=SessionStatus.DRAFT,
            participants=[
                Participant(
                    id=creator_id,
                    name="",  # Filled later or from auth
                    role="creator",
                    consented=True,  # Creator implicitly consents
                )
            ],
            facilitator=FacilitatorConfig(
                persona=facilitator_persona,
                interrupt_authority=True,
                direct_inquiry=True,
                silence_detection=False,
            ),
            created_at=datetime.utcnow().isoformat(),
            invite_token=invite_token,
        )

        SESSION_STORE[session_id] = session
        return session

    async def record_consent(
        self,
        session_id: str,
        invite_token: str,
        invitee_name: str,
        consented: bool,
    ) -> Session:
        """Record partner consent and transition status if both consented."""
        session = SESSION_STORE.get(session_id)
        if not session:
            raise ValueError("Session not found")
        if session.invite_token != invite_token:
            raise ValueError("Invalid invite token")

        if consented:
            session.participants.append(
                Participant(
                    id=secrets.token_urlsafe(8),
                    name=invitee_name,
                    role="invitee",
                    consented=True,
                )
            )
            # Check if both consented
            if all(p.consented for p in session.participants):
                session.status = SessionStatus.READY
        else:
            # Decline is private - don't notify creator
            session.status = SessionStatus.ARCHIVED

        return session

    async def start_session(
        self,
        session_id: str,
        meeting_url: str,
    ) -> Dict:
        """Start the session: spawn Pipecat, call MeetingBaas."""
        session = SESSION_STORE.get(session_id)
        if not session:
            raise ValueError("Session not found")
        if session.status != SessionStatus.READY:
            raise ValueError("Session not ready to start")

        # Load persona
        persona_data = PersonaManager().get_persona(session.facilitator.persona)

        # Create MeetingBaas bot
        from scripts.meetingbaas_api import create_meeting_bot
        client_id = secrets.token_urlsafe(16)

        bot_id = create_meeting_bot(
            meeting_url=meeting_url,
            websocket_url=BASE_URL,
            bot_id=client_id,
            persona_name=session.facilitator.persona,
            api_key=MEETING_BAAS_API_KEY,
            bot_image=persona_data.get("image"),
            entry_message=persona_data.get("entry_message"),
        )

        # Start Pipecat process
        from core.process import start_pipecat_process
        process = start_pipecat_process(
            client_id=client_id,
            websocket_url=f"{INTERNAL_WS_URL}/pipecat/{client_id}",
            meeting_url=meeting_url,
            persona_data=persona_data,
            streaming_audio_frequency="16khz",
            enable_tools=False,  # Disable weather/time tools for Diadi
            api_key=MEETING_BAAS_API_KEY,
            meetingbaas_bot_id=bot_id,
        )

        # Update session
        session.status = SessionStatus.IN_PROGRESS
        session.bot_id = bot_id
        session.client_id = client_id
        session.meeting_url = meeting_url

        PIPECAT_PROCESSES[client_id] = process

        return {
            "status": session.status,
            "bot_id": bot_id,
            "client_id": client_id,
            "event_url": f"wss://{BASE_URL}/sessions/{session_id}/events",
        }

    async def end_session(self, session_id: str) -> Session:
        """End the session, cleanup resources, generate summary."""
        session = SESSION_STORE.get(session_id)
        if not session:
            raise ValueError("Session not found")

        # Cleanup Pipecat and MeetingBaas
        if session.client_id:
            from core.process import terminate_process_gracefully
            process = PIPECAT_PROCESSES.get(session.client_id)
            if process:
                terminate_process_gracefully(process)

            from scripts.meetingbaas_api import leave_meeting_bot
            leave_meeting_bot(session.bot_id, MEETING_BAAS_API_KEY)

        session.status = SessionStatus.ENDED

        # Trigger summary generation (async)
        await self._generate_summary(session_id)

        return session

    async def pause_facilitation(self, session_id: str) -> Session:
        """Pause AI facilitation (kill switch)."""
        session = SESSION_STORE.get(session_id)
        session.status = SessionStatus.PAUSED
        # Notify Pipecat to stop interventions
        await self._notify_pipecat(session.client_id, {"action": "pause"})
        return session

    async def resume_facilitation(self, session_id: str) -> Session:
        """Resume AI facilitation after pause."""
        session = SESSION_STORE.get(session_id)
        session.status = SessionStatus.IN_PROGRESS
        await self._notify_pipecat(session.client_id, {"action": "resume"})
        return session

    async def _generate_summary(self, session_id: str) -> bool:
        """Generate post-session summary using OpenAI.

        Args:
            session_id: The session identifier.

        Returns:
            True if summary was generated, False otherwise.
        """
        session = SESSION_STORE.get(session_id)
        if not session:
            return False

        # Placeholder summary - will be replaced with full OpenAI generation
        # in app/services/summary_service.py
        from app.models import SessionSummary, TalkBalanceMetrics

        summary = SessionSummary(
            session_id=session_id,
            duration_minutes=session.duration_minutes,
            consensus_summary="Session completed. Summary generation pending.",
            action_items=[],
            balance=TalkBalanceMetrics(
                participant_a={"id": "", "name": "", "percentage": 50},
                participant_b={"id": "", "name": "", "percentage": 50},
                status="balanced",
            ),
            intervention_count=0,
            key_agreements=[],
        )

        # Store summary (would use SESSION_SUMMARIES in full implementation)
        return True

    async def _notify_pipecat(self, client_id: Optional[str], message: dict) -> None:
        """Send a control message to Pipecat process.

        Args:
            client_id: The client ID for the Pipecat connection.
            message: The message to send.
        """
        if not client_id:
            return
        # Placeholder - would send message via WebSocket to Pipecat
        pass
```

### 4.3 Session Store

**`core/session_store.py`:**
```python
from typing import Dict
from app.models import Session

# In-memory session storage (Alpha)
# Future: Replace with database (Postgres, Redis)
SESSION_STORE: Dict[str, Session] = {}

# Session events for WebSocket broadcast
SESSION_EVENTS: Dict[str, list] = {}  # session_id -> list of connected WebSockets
```

### 4.4 Balance Tracker

**`core/balance_tracker.py`:**
```python
from dataclasses import dataclass
from typing import Dict, Optional
from datetime import datetime, timedelta

@dataclass
class SpeakerMetrics:
    total_speaking_time_ms: int = 0
    last_spoke_at: Optional[datetime] = None
    is_speaking: bool = False

class BalanceTracker:
    """Tracks talk balance between two participants."""

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.speakers: Dict[str, SpeakerMetrics] = {}
        self.session_start: datetime = datetime.utcnow()

        # Imbalance tracking for intervention triggers
        self.imbalance_start: Optional[datetime] = None
        self.severe_imbalance_start: Optional[datetime] = None

    def update_speaker(self, speaker_id: str, is_speaking: bool):
        """Update speaker state from diarization."""
        if speaker_id not in self.speakers:
            self.speakers[speaker_id] = SpeakerMetrics()

        metrics = self.speakers[speaker_id]
        now = datetime.utcnow()

        if is_speaking and not metrics.is_speaking:
            # Started speaking
            metrics.is_speaking = True
            metrics.last_spoke_at = now
        elif not is_speaking and metrics.is_speaking:
            # Stopped speaking
            if metrics.last_spoke_at:
                duration = (now - metrics.last_spoke_at).total_seconds() * 1000
                metrics.total_speaking_time_ms += int(duration)
            metrics.is_speaking = False

    def get_balance(self) -> Dict:
        """Calculate current talk balance percentages."""
        if len(self.speakers) < 2:
            return {"status": "waiting_for_speakers"}

        speakers = list(self.speakers.values())
        total = sum(s.total_speaking_time_ms for s in speakers)

        if total == 0:
            percentages = [50, 50]
        else:
            percentages = [
                int((s.total_speaking_time_ms / total) * 100)
                for s in speakers
            ]

        # Determine status
        diff = abs(percentages[0] - percentages[1])
        if diff <= 20:
            status = "balanced"
        elif diff <= 30:
            status = "mild_imbalance"
        else:
            status = "severe_imbalance"

        speaker_ids = list(self.speakers.keys())
        return {
            "participantA": {
                "id": speaker_ids[0],
                "percentage": percentages[0],
            },
            "participantB": {
                "id": speaker_ids[1],
                "percentage": percentages[1],
            },
            "status": status,
        }

    def check_intervention_trigger(self) -> Optional[str]:
        """Check if balance warrants intervention."""
        balance = self.get_balance()
        if balance.get("status") == "waiting_for_speakers":
            return None

        now = datetime.utcnow()
        status = balance["status"]

        if status == "severe_imbalance":
            if not self.severe_imbalance_start:
                self.severe_imbalance_start = now
            elif (now - self.severe_imbalance_start) > timedelta(minutes=5):
                return "severe_balance"  # Voice intervention
        else:
            self.severe_imbalance_start = None

        if status in ("mild_imbalance", "severe_imbalance"):
            if not self.imbalance_start:
                self.imbalance_start = now
            elif (now - self.imbalance_start) > timedelta(minutes=3):
                return "balance"  # Visual intervention
        else:
            self.imbalance_start = None

        return None
```

### 4.5 Intervention Engine

**`core/intervention_engine.py`:**
```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from enum import Enum

class InterventionType(Enum):
    BALANCE = "balance"
    SILENCE = "silence"
    GOAL_DRIFT = "goal_drift"
    TIME_WARNING = "time_warning"
    ESCALATION = "escalation"
    ICEBREAKER = "icebreaker"

class InterventionModality(Enum):
    VISUAL = "visual"
    VOICE = "voice"

@dataclass
class Intervention:
    type: InterventionType
    modality: InterventionModality
    message: str
    target_participant: Optional[str] = None
    created_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

class InterventionEngine:
    """Decides when and how to intervene."""

    # Configurable thresholds
    MIN_INTERVENTION_INTERVAL = timedelta(seconds=30)
    COOLDOWN_PERIOD = timedelta(minutes=2)
    SILENCE_THRESHOLD = timedelta(seconds=15)
    FIRST_MINUTES_QUIET = timedelta(minutes=3)

    def __init__(self, session_id: str, session_start: datetime):
        self.session_id = session_id
        self.session_start = session_start
        self.last_intervention: Optional[datetime] = None
        self.intervention_count = 0

        # Blockers
        self.is_mid_sentence = False
        self.emotional_disclosure = False
        self.repair_in_progress = False

    def can_intervene(self) -> bool:
        """Check if intervention is allowed now."""
        now = datetime.utcnow()

        # First 3 minutes: no interventions
        if (now - self.session_start) < self.FIRST_MINUTES_QUIET:
            return False

        # Cooldown since last intervention
        if self.last_intervention:
            if (now - self.last_intervention) < self.MIN_INTERVENTION_INTERVAL:
                return False

        # Blockers
        if self.is_mid_sentence:
            return False
        if self.emotional_disclosure:
            return False
        if self.repair_in_progress:
            return False

        return True

    def evaluate(
        self,
        balance_status: str,
        silence_duration: timedelta,
        tension_score: float,
        time_remaining: timedelta,
        is_on_goal: bool,
    ) -> Optional[Intervention]:
        """Evaluate conditions and return intervention if needed."""
        if not self.can_intervene():
            return None

        # Priority order: Escalation > Balance > Time > Silence > Goal

        # Escalation (tension score > 0.7 for 30s)
        if tension_score > 0.7:
            return self._create_intervention(
                InterventionType.ESCALATION,
                InterventionModality.VOICE,
                "I sense some tension rising. Would a 2-minute break help?"
            )

        # Severe balance (>70/30 for 5 min)
        if balance_status == "severe_imbalance":
            return self._create_intervention(
                InterventionType.BALANCE,
                InterventionModality.VOICE,
                "I notice the conversation has been a bit one-sided. Would you like to share your thoughts?",
            )

        # Time warning (<5 min remaining)
        if time_remaining < timedelta(minutes=5):
            return self._create_intervention(
                InterventionType.TIME_WARNING,
                InterventionModality.VISUAL,
                f"You have about {int(time_remaining.total_seconds() // 60)} minutes left.",
            )

        # Silence (>15 seconds)
        if silence_duration > self.SILENCE_THRESHOLD:
            return self._create_intervention(
                InterventionType.SILENCE,
                InterventionModality.VISUAL,
                "Taking a moment...",
            )

        # Mild balance (>65/35 for 3 min)
        if balance_status == "mild_imbalance":
            return self._create_intervention(
                InterventionType.BALANCE,
                InterventionModality.VISUAL,
                "{name} hasn't shared their perspective yet",
            )

        # Goal drift (off-goal >2 min)
        if not is_on_goal:
            return self._create_intervention(
                InterventionType.GOAL_DRIFT,
                InterventionModality.VISUAL,
                "Shall we return to the topic?",
            )

        return None

    def _create_intervention(
        self,
        type: InterventionType,
        modality: InterventionModality,
        message: str,
    ) -> Intervention:
        """Create and record intervention."""
        intervention = Intervention(
            type=type,
            modality=modality,
            message=message,
        )
        self.last_intervention = datetime.utcnow()
        self.intervention_count += 1
        return intervention
```

---

## 5. Data Models

### 5.1 Backend Models (Pydantic)

**`app/models.py` additions:**
```python
from enum import Enum
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from datetime import datetime

class SessionStatus(str, Enum):
    DRAFT = "draft"
    PENDING_CONSENT = "pending_consent"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    ENDED = "ended"
    ARCHIVED = "archived"

class Platform(str, Enum):
    ZOOM = "zoom"
    MEET = "meet"
    TEAMS = "teams"
    DIADI = "diadi"  # Future: native video

class FacilitatorPersona(str, Enum):
    NEUTRAL_MEDIATOR = "neutral_mediator"
    DEEP_EMPATH = "deep_empath"
    DECISION_CATALYST = "decision_catalyst"

class Participant(BaseModel):
    id: str
    name: str
    role: str  # "creator" | "invitee"
    consented: bool = False

class FacilitatorConfig(BaseModel):
    persona: FacilitatorPersona = FacilitatorPersona.NEUTRAL_MEDIATOR
    interrupt_authority: bool = True
    direct_inquiry: bool = True
    silence_detection: bool = False

class Session(BaseModel):
    id: str
    title: Optional[str] = None
    goal: str = Field(..., max_length=200)
    relationship_context: str
    platform: Platform
    meeting_url: Optional[str] = None
    duration_minutes: int = 30
    scheduled_at: Optional[str] = None
    status: SessionStatus = SessionStatus.DRAFT
    participants: List[Participant] = []
    facilitator: FacilitatorConfig
    created_at: str
    invite_token: str
    bot_id: Optional[str] = None
    client_id: Optional[str] = None

class TalkBalanceMetrics(BaseModel):
    participant_a: Dict[str, Any]  # {id, name, percentage}
    participant_b: Dict[str, Any]
    status: str  # "balanced" | "mild_imbalance" | "severe_imbalance"

class InterventionRecord(BaseModel):
    id: str
    type: str
    modality: str
    message: str
    target_participant: Optional[str] = None
    created_at: str

class SessionSummary(BaseModel):
    session_id: str
    duration_minutes: int
    consensus_summary: str
    action_items: List[str]
    balance: TalkBalanceMetrics
    intervention_count: int
    key_agreements: List[Dict[str, str]] = []

# Request/Response Models

class CreateSessionRequest(BaseModel):
    goal: str = Field(..., max_length=200)
    relationship_context: str
    facilitator: FacilitatorConfig = FacilitatorConfig()
    duration_minutes: int = 30
    scheduled_at: Optional[str] = None
    platform: Platform = Platform.MEET
    partner_name: str

class CreateSessionResponse(BaseModel):
    session_id: str
    status: SessionStatus
    invite_link: str
    invite_token: str

class ConsentRequest(BaseModel):
    invite_token: str
    invitee_name: str
    consented: bool

class ConsentResponse(BaseModel):
    status: SessionStatus
    participants: List[Participant]

class StartSessionRequest(BaseModel):
    meeting_url: str

class StartSessionResponse(BaseModel):
    status: SessionStatus
    bot_id: str
    client_id: str
    event_url: str

class SessionEventPayload(BaseModel):
    type: str  # "balance_update" | "intervention" | "session_state" | etc.
    data: Dict
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
```

### 5.2 Frontend Types (TypeScript)

**`types/session.ts`:**
```typescript
export type SessionStatus =
  | 'draft'
  | 'pending_consent'
  | 'ready'
  | 'in_progress'
  | 'paused'
  | 'ended'
  | 'archived';

export type Platform = 'zoom' | 'meet' | 'teams' | 'diadi';

export type FacilitatorPersona =
  | 'neutral_mediator'
  | 'deep_empath'
  | 'decision_catalyst';

export interface Participant {
  id: string;
  name: string;
  role: 'creator' | 'invitee';
  consented: boolean;
}

export interface FacilitatorConfig {
  persona: FacilitatorPersona;
  interruptAuthority: boolean;
  directInquiry: boolean;
  silenceDetection: boolean;
}

export interface Session {
  id: string;
  title?: string;
  goal: string;
  relationshipContext: string;
  platform: Platform;
  meetingUrl?: string;
  durationMinutes: number;
  scheduledAt?: string;
  status: SessionStatus;
  participants: Participant[];
  facilitator: FacilitatorConfig;
  createdAt: string;
  inviteToken: string;
  botId?: string;
  clientId?: string;
}

export interface TalkBalanceMetrics {
  participantA: { id: string; name: string; percentage: number };
  participantB: { id: string; name: string; percentage: number };
  status: 'balanced' | 'mild_imbalance' | 'severe_imbalance';
}

export interface SessionSummary {
  sessionId: string;
  durationMinutes: number;
  consensusSummary: string;
  actionItems: string[];
  balance: TalkBalanceMetrics;
  interventionCount: number;
  keyAgreements: Array<{ title: string; description: string }>;
}
```

**`types/intervention.ts`:**
```typescript
export type InterventionType =
  | 'balance'
  | 'silence'
  | 'goal_drift'
  | 'time_warning'
  | 'escalation'
  | 'icebreaker';

export type InterventionModality = 'visual' | 'voice';

export interface Intervention {
  id: string;
  type: InterventionType;
  modality: InterventionModality;
  message: string;
  targetParticipant?: string;
  createdAt: string;
}
```

**`types/events.ts`:**
```typescript
export type SessionEventType =
  | 'session_state'
  | 'balance_update'
  | 'intervention'
  | 'escalation'
  | 'time_remaining'
  | 'goal_drift'
  | 'participant_status';

export interface SessionEvent<T = unknown> {
  type: SessionEventType;
  data: T;
  timestamp: string;
}

export interface BalanceUpdateEvent {
  type: 'balance_update';
  data: TalkBalanceMetrics;
}

export interface InterventionEvent {
  type: 'intervention';
  data: Intervention;
}

export interface TimeRemainingEvent {
  type: 'time_remaining';
  data: { minutes: number; seconds: number };
}

export interface SessionStateEvent {
  type: 'session_state';
  data: { status: SessionStatus; reason?: string };
}
```

---

## 6. API Contracts

### 6.1 Session Endpoints

**POST /sessions**
```yaml
Request:
  Content-Type: application/json
  Headers:
    x-meeting-baas-api-key: string (required)
  Body:
    goal: string (required, max 200 chars)
    relationshipContext: string (required)
    partnerName: string (required)
    facilitator:
      persona: "neutral_mediator" | "deep_empath" | "decision_catalyst"
      interruptAuthority: boolean (default: true)
      directInquiry: boolean (default: true)
      silenceDetection: boolean (default: false)
    durationMinutes: integer (default: 30)
    scheduledAt: ISO8601 string | null
    platform: "zoom" | "meet" | "teams"

Response (201 Created):
  sessionId: string
  status: "draft"
  inviteLink: string (full URL)
  inviteToken: string
```

**GET /sessions**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (required)
  Query:
    status: SessionStatus (optional, filter)
    limit: integer (default: 20)
    offset: integer (default: 0)

Response (200 OK):
  sessions: Session[]
  total: integer
  hasMore: boolean
```

**GET /sessions/{id}**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (required)
  Path:
    id: string (required)

Response (200 OK):
  Session object

Response (404 Not Found):
  message: "Session not found"
```

**POST /sessions/{id}/consent**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (optional - invitee may not have)
  Path:
    id: string (required)
  Body:
    inviteToken: string (required)
    inviteeName: string (required)
    consented: boolean (required)

Response (200 OK):
  status: SessionStatus
  participants: Participant[]

Response (400 Bad Request):
  message: "Invalid invite token"

Response (404 Not Found):
  message: "Session not found"
```

**POST /sessions/{id}/start**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (required)
  Path:
    id: string (required)
  Body:
    meetingUrl: string (required, valid meeting URL)

Response (200 OK):
  status: "in_progress"
  botId: string
  clientId: string
  eventUrl: string (WebSocket URL)

Response (400 Bad Request):
  message: "Session not ready to start" | "Invalid meeting URL"

Response (404 Not Found):
  message: "Session not found"
```

**POST /sessions/{id}/end**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (required)
  Path:
    id: string (required)

Response (200 OK):
  status: "ended"
  summaryAvailable: boolean

Response (404 Not Found):
  message: "Session not found"
```

**POST /sessions/{id}/pause**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (required)
  Path:
    id: string (required)

Response (200 OK):
  status: "paused"

Response (400 Bad Request):
  message: "Session not in progress"
```

**POST /sessions/{id}/resume**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (required)
  Path:
    id: string (required)

Response (200 OK):
  status: "in_progress"

Response (400 Bad Request):
  message: "Session not paused"
```

**GET /sessions/{id}/summary**
```yaml
Request:
  Headers:
    x-meeting-baas-api-key: string (required)
  Path:
    id: string (required)

Response (200 OK):
  SessionSummary object

Response (404 Not Found):
  message: "Session not found" | "Summary not available"
```

### 6.2 WebSocket: Session Events

**Endpoint:** `WS /sessions/{session_id}/events`

**Connection:**
```
ws://localhost:7014/sessions/{session_id}/events
Headers:
  x-meeting-baas-api-key: string (optional for invitee)
```

**Server → Client Messages:**

```json
// Balance Update (every 1-2 seconds)
{
  "type": "balance_update",
  "data": {
    "participantA": { "id": "p1", "name": "Maya", "percentage": 55 },
    "participantB": { "id": "p2", "name": "David", "percentage": 45 },
    "status": "balanced"
  },
  "timestamp": "2026-01-05T12:34:56Z"
}

// Intervention
{
  "type": "intervention",
  "data": {
    "id": "int_123",
    "type": "balance",
    "modality": "visual",
    "message": "David hasn't shared their perspective yet",
    "targetParticipant": "p2"
  },
  "timestamp": "2026-01-05T12:34:56Z"
}

// Time Remaining (every minute + at 5 min warning)
{
  "type": "time_remaining",
  "data": { "minutes": 5, "seconds": 0 },
  "timestamp": "2026-01-05T12:34:56Z"
}

// Session State Change
{
  "type": "session_state",
  "data": { "status": "paused", "reason": "kill_switch_activated" },
  "timestamp": "2026-01-05T12:34:56Z"
}

// Participant Status
{
  "type": "participant_status",
  "data": {
    "participantId": "p2",
    "status": "speaking" | "listening" | "disconnected"
  },
  "timestamp": "2026-01-05T12:34:56Z"
}

// Goal Drift Warning
{
  "type": "goal_drift",
  "data": { "detected": true, "duration_seconds": 120 },
  "timestamp": "2026-01-05T12:34:56Z"
}
```

**Client → Server Messages:**
```json
// Ping (keepalive)
{ "type": "ping" }

// Update facilitator settings
{
  "type": "update_settings",
  "data": {
    "sentimentDetection": true,
    "tensionMonitoring": true,
    "facilitatedPrompts": false
  }
}

// Acknowledge intervention
{
  "type": "intervention_ack",
  "data": { "interventionId": "int_123", "action": "dismissed" | "followed" }
}
```

---

## 7. Real-Time Communication

### 7.1 WebSocket Handler Extension

**`app/websockets.py` addition:**

Note: The existing codebase uses `websocket_router = APIRouter()` pattern. Add to existing router:

```python
from fastapi import WebSocket, WebSocketDisconnect
from core.session_store import SESSION_STORE, SESSION_EVENTS
from core.balance_tracker import BalanceTracker
from core.intervention_engine import InterventionEngine
from datetime import datetime
import asyncio
import json

# Add to existing websocket_router (already defined in app/websockets.py)

@websocket_router.websocket("/sessions/{session_id}/events")
async def session_events_websocket(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time session events."""
    await websocket.accept()

    session = SESSION_STORE.get(session_id)
    if not session:
        await websocket.close(code=4004, reason="Session not found")
        return

    # Register connection
    if session_id not in SESSION_EVENTS:
        SESSION_EVENTS[session_id] = []
    SESSION_EVENTS[session_id].append(websocket)

    try:
        # Send initial state
        await websocket.send_json({
            "type": "session_state",
            "data": {"status": session.status},
            "timestamp": datetime.utcnow().isoformat(),
        })

        # Listen for client messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "ping":
                await websocket.send_json({"type": "pong"})

            elif message["type"] == "update_settings":
                # Update facilitator settings
                settings = message["data"]
                # Forward to Pipecat process
                await update_pipecat_settings(session.client_id, settings)

            elif message["type"] == "intervention_ack":
                # Log intervention acknowledgment
                pass

    except WebSocketDisconnect:
        SESSION_EVENTS[session_id].remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}")
        SESSION_EVENTS[session_id].remove(websocket)

async def broadcast_session_event(session_id: str, event: dict):
    """Broadcast event to all connected clients for a session."""
    connections = SESSION_EVENTS.get(session_id, [])
    for ws in connections:
        try:
            await ws.send_json(event)
        except Exception:
            pass  # Connection closed, will be cleaned up
```

### 7.2 Balance Event Emitter

**Integration with Pipecat:**

The Pipecat subprocess (`scripts/meetingbaas.py`) needs to emit balance updates. This requires:

1. **Speaker diarization** from audio stream
2. **Balance calculation** using `BalanceTracker`
3. **Event emission** via WebSocket to main server

```python
# In scripts/meetingbaas.py

class BalanceTrackingProcessor(FrameProcessor):
    """Tracks speaker balance and emits events."""

    def __init__(self, session_id: str, event_callback):
        self.balance_tracker = BalanceTracker(session_id)
        self.event_callback = event_callback
        self.last_emit = datetime.utcnow()
        self.emit_interval = timedelta(seconds=1.5)
        self.unknown_speaker_count = 0  # Counter for unknown speakers

    async def process_frame(self, frame, direction):
        if isinstance(frame, TranscriptionFrame):
            # Update speaker tracking with fallback for missing speaker_id
            speaker_id = getattr(frame, 'speaker_id', None)
            if not speaker_id:
                # Fallback: assign temporary speaker ID when diarization unavailable
                self.unknown_speaker_count += 1
                speaker_id = f"unknown_speaker_{self.unknown_speaker_count % 2}"
            self.balance_tracker.update_speaker(speaker_id, is_speaking=True)

            # Emit balance update periodically
            now = datetime.utcnow()
            if (now - self.last_emit) > self.emit_interval:
                balance = self.balance_tracker.get_balance()
                await self.event_callback({
                    "type": "balance_update",
                    "data": balance,
                    "timestamp": now.isoformat(),
                })
                self.last_emit = now

        await self.push_frame(frame, direction)
```

### 7.3 Frontend WebSocket Hook

**`hooks/use-session-events.ts`:**
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { useInterventionStore } from '@/stores/intervention-store';
import type { SessionEvent } from '@/types/events';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

export function useSessionEvents(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempt = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setBalance, setAIStatus, setTimeRemaining } = useSessionStore();
  const { push: pushIntervention } = useInterventionStore();

  const connect = useCallback(() => {
    if (!sessionId) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/sessions/${sessionId}/events`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      reconnectAttempt.current = 0;
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt reconnection with cleanup
      const delay = RECONNECT_DELAYS[
        Math.min(reconnectAttempt.current, RECONNECT_DELAYS.length - 1)
      ];
      reconnectAttempt.current++;
      // Store timeout ref for cleanup on unmount
      reconnectTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setError('Connection error');
    };

    ws.onmessage = (event) => {
      const data: SessionEvent = JSON.parse(event.data);

      switch (data.type) {
        case 'balance_update':
          setBalance(data.data);
          break;
        case 'intervention':
          pushIntervention(data.data);
          break;
        case 'time_remaining':
          setTimeRemaining(data.data.minutes * 60 + data.data.seconds);
          break;
        case 'session_state':
          // Handle state transitions (paused, ended, etc.)
          break;
        default:
          console.log('Unknown event type:', data.type);
      }
    };
  }, [sessionId, setBalance, pushIntervention, setTimeRemaining]);

  useEffect(() => {
    connect();
    return () => {
      // Clean up WebSocket connection
      wsRef.current?.close();
      // Clean up any pending reconnection timeout to prevent memory leaks
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return { isConnected, error, sendMessage };
}
```

---

## 8. Persona System Extensions

### 8.1 New Personas

Three new personas need to be created in `config/personas/`:

**neutral_mediator/README.md:**
```markdown
# Neutral Mediator

You are a calm, balanced facilitator focused on fair dialogue. You help both participants feel heard without taking sides. Your role is to gently guide the conversation, ensure balanced speaking time, and help the pair stay on topic.

## Core Behaviors
- Never favor one participant over the other
- Use reflective listening techniques
- Summarize points neutrally
- Intervene only when necessary
- Keep interventions brief and non-judgmental

## Intervention Style
- Visual prompts first, voice only for escalation
- Phrases: "I notice...", "Would it help to...", "Let's return to..."
- Never use accusatory language

## Metadata
- image: TBD (generated at runtime via Replicate SDXL)
- entry_message: "Hello, I'm here to help facilitate your conversation. Take your time, and know that I'm here to support you both."
- cartesia_voice_id: TBD (matched at runtime via VoiceUtils based on gender/characteristics)
- gender: neutral
- relevant_links: []
```

**deep_empath/README.md:**
```markdown
# Deep Empath

You are a warm, emotionally attuned facilitator. You prioritize emotional safety and validation. You help participants feel understood before moving to resolution.

## Core Behaviors
- Acknowledge emotions explicitly
- Validate feelings before facts
- Create space for vulnerability
- Gently slow down heated moments
- Celebrate moments of connection

## Intervention Style
- Softer, more supportive tone
- Phrases: "I hear the emotion in that...", "It sounds like this matters deeply...", "Thank you for sharing that..."
- Focus on feelings over facts

## Metadata
- image: TBD (generated at runtime via Replicate SDXL)
- entry_message: "Welcome. I'm here to hold space for both of you. This is a safe place to share what's on your heart."
- cartesia_voice_id: TBD (matched at runtime via VoiceUtils based on gender/characteristics)
- gender: female
- relevant_links: []
```

**decision_catalyst/README.md:**
```markdown
# Decision Catalyst

You are a focused, action-oriented facilitator. You help participants move from discussion to decision. You keep conversations productive and drive toward concrete outcomes.

## Core Behaviors
- Summarize positions concisely
- Identify areas of agreement
- Push gently toward decisions
- Track action items
- Keep momentum

## Intervention Style
- More direct, structured
- Phrases: "So the key decision is...", "I'm hearing agreement on...", "What would it take to..."
- Focus on outcomes and next steps

## Metadata
- image: TBD (generated at runtime via Replicate SDXL)
- entry_message: "Let's make this conversation count. I'll help you stay focused and reach decisions you both feel good about."
- cartesia_voice_id: TBD (matched at runtime via VoiceUtils based on gender/characteristics)
- gender: male
- relevant_links: []
```

### 8.2 Persona Loading

The existing `PersonaManager` class in `config/persona_utils.py` handles persona loading. No changes needed to the loading mechanism.

---

## 9. Delivery Phases

### Phase 1: Foundation
**Goal:** Project setup and basic infrastructure

**Backend Tasks:**
1. Add Session Pydantic models to `app/models.py`
2. Create `core/session_store.py` with in-memory storage
3. Create `app/services/session_service.py` skeleton
4. Add session CRUD routes to `app/routes.py`:
   - POST /sessions
   - GET /sessions
   - GET /sessions/{id}
5. Extend `/bots` response to include `client_id`
6. Create three new Diadi personas

**Frontend Tasks:**
1. Initialize Next.js 14 project in `web/`
2. Configure Tailwind with Diadi theme
3. Install and configure shadcn/ui
4. Create API client (`lib/api/client.ts`)
5. Define TypeScript types (`types/`)
6. Implement basic navigation (mobile + desktop)
7. Create Hub page with empty states

**Verification:**
- `ruff check .` passes
- `ruff format .` applied
- Manual test: POST /sessions returns session object
- Manual test: Hub page renders

---

### Phase 2: Session Creation
**Goal:** Complete session creation wizard

**Backend Tasks:**
1. Add invite token generation (secure random)
2. Store invite token with session
3. Implement invite link generation

**Frontend Tasks:**
1. Create wizard state context (`wizard-provider.tsx`)
2. Build Step 0: Identity & Bond
3. Build Step 1: Session Goal
4. Build Step 2: Facilitator Calibration
5. Build Step 3: Review & Connect
6. Build Step 4: Launch Hub
7. Implement form validation with Zod
8. Create SessionCard component
9. Update Hub to show created sessions

**Verification:**
- Complete wizard flow creates session via API
- Session appears in Hub
- Invite link is generated

---

### Phase 3: Invitation & Consent
**Goal:** Partner invitation and dual consent

**Backend Tasks:**
1. Add POST /sessions/{id}/consent endpoint
2. Implement consent tracking per participant
3. Implement session status transitions (draft → pending_consent → ready)

**Frontend Tasks:**
1. Build `/invite/[token]` page
2. Create ConsentForm with AI explanation
3. Build waiting room component
4. Show partner status (waiting, joining, joined)
5. Display consent state to both participants

**Verification:**
- Partner can accept via invite link
- Session transitions to "ready" when both consent
- Waiting room shows partner status

---

### Phase 4: Live Session
**Goal:** Real-time session with balance tracking

**Backend Tasks:**
1. Add POST /sessions/{id}/start endpoint
2. Implement start logic (spawn Pipecat, call MeetingBaas)
3. Add WebSocket endpoint `/sessions/{id}/events`
4. Implement balance tracking in Pipecat
5. Emit `balance_update` events

**Frontend Tasks:**
1. Build Live Facilitation Room page
2. Implement `useSessionEvents` WebSocket hook
3. Create TalkBalance component
4. Create AIStatusIndicator component
5. Create SessionTimer component
6. Create GoalSnippet component

**Verification:**
- Session starts and bot joins meeting
- Balance updates appear in real-time
- Timer counts down correctly

---

### Phase 5: Interventions
**Goal:** AI intervention system

**Backend Tasks:**
1. Create `core/intervention_engine.py`
2. Integrate intervention logic into Pipecat
3. Emit `intervention` events
4. Implement intervention blockers

**Frontend Tasks:**
1. Create InterventionOverlay component
2. Build BalancePrompt variant
3. Build SilencePrompt variant
4. Build TimeWarning variant
5. Build EscalationAlert variant (P1)
6. Implement intervention queue in Zustand

**Verification:**
- Visual intervention appears when balance >65/35 for 3 min
- Time warning at 5 min remaining
- Interventions respect cooldown period

---

### Phase 6: Kill Switch & Controls
**Goal:** Pause/resume facilitation

**Backend Tasks:**
1. Add POST /sessions/{id}/pause endpoint
2. Add POST /sessions/{id}/resume endpoint
3. Notify Pipecat to stop/resume interventions

**Frontend Tasks:**
1. Create KillSwitch component
2. Build pause confirmation modal
3. Show paused state in UI
4. Implement resume flow

**Verification:**
- Kill switch immediately pauses AI
- Both participants see paused state
- Resume requires explicit action

---

### Phase 7: Post-Session
**Goal:** Summary and recap

**Backend Tasks:**
1. Add POST /sessions/{id}/end endpoint
2. Create `app/services/summary_service.py`
3. Generate summary via OpenAI
4. Add GET /sessions/{id}/summary endpoint

**Frontend Tasks:**
1. Build SessionSummary component
2. Create SynthesisBoard view
3. Create KeyAgreements component
4. Create ActionItems component
5. Create RatingPrompt component

**Verification:**
- Summary generated within 30 seconds
- Summary displays correctly
- Rating can be submitted

---

### Phase 8: Polish & Testing
**Goal:** Production readiness

**Tasks:**
1. Mobile responsive testing (360x640, 1280x720)
2. Accessibility audit (contrast, keyboard nav, screen reader)
3. Performance optimization (bundle size, lazy loading)
4. Error boundary implementation
5. Fallback UI states (WebSocket disconnect, API errors)
6. End-to-end testing
7. Documentation updates

**Verification:**
- All pages pass Lighthouse accessibility
- Bundle size <500KB initial
- E2E tests pass for critical flows

---

## 10. Verification Approach

### 10.1 Linting & Formatting

**Backend:**
```bash
# Check code style
ruff check .

# Format code
ruff format .

# Type checking (if mypy configured)
mypy app/ core/
```

**Frontend:**
```bash
# Lint
npm run lint

# Type check
npm run type-check

# Format
npm run format
```

### 10.2 Unit Tests

**Backend (`pytest`):**
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov=core

# Run specific test file
pytest tests/test_session_service.py
```

**Frontend (`vitest`):**
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### 10.3 Integration Tests

**API Integration:**
```bash
# Test session flow
pytest tests/integration/test_session_flow.py

# Test WebSocket events
pytest tests/integration/test_session_events.py
```

**Frontend Integration:**
```bash
# Component tests with Testing Library
npm run test:integration
```

### 10.4 Manual Testing Checklist

**Session Creation:**
- [ ] Create session with all fields
- [ ] Verify invite link works
- [ ] Verify session appears in Hub

**Consent Flow:**
- [ ] Partner receives invite link
- [ ] Partner sees correct goal and schedule
- [ ] Accept updates session status
- [ ] Decline is private

**Live Session:**
- [ ] Bot joins meeting
- [ ] Balance updates in real-time
- [ ] Timer counts correctly
- [ ] Kill switch pauses immediately

**Interventions:**
- [ ] Balance prompt at threshold
- [ ] Time warning at 5 min
- [ ] Cooldown respected
- [ ] Blockers prevent intervention

**Post-Session:**
- [ ] Summary generated
- [ ] Key agreements displayed
- [ ] Rating submits

### 10.5 Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial page load | <2s | Lighthouse Performance |
| WebSocket latency | <1s | Network tab timing |
| API response time | <500ms | Backend timing logs |
| Bundle size (initial) | <500KB | `npm run analyze` |

---

## Appendix A: Environment Variables

**New Variables Required:**
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:7014
NEXT_PUBLIC_WS_URL=ws://localhost:7014

# Backend (existing - required for Diadi sessions)
MEETING_BAAS_API_KEY=      # Required: MeetingBaas API authentication
OPENAI_API_KEY=            # Required: OpenAI/GPT-4 for LLM and summary generation
CARTESIA_API_KEY=          # Required: Text-to-speech
DEEPGRAM_API_KEY=          # Required: Speech-to-text (or GLADIA_API_KEY)
BASE_URL=                  # Recommended: WebSocket base URL for production

# Backend (optional)
REPLICATE_KEY=             # Optional: AI image generation for personas
UTFS_KEY=                  # Optional: UploadThing image hosting
APP_ID=                    # Optional: UploadThing app ID
NGROK_AUTHTOKEN=           # Optional: Local development tunneling
```

## Appendix B: API Error Codes

| Code | Status | Message |
|------|--------|---------|
| SESSION_NOT_FOUND | 404 | Session not found |
| INVALID_INVITE_TOKEN | 400 | Invalid invite token |
| SESSION_NOT_READY | 400 | Session not ready to start |
| INVALID_MEETING_URL | 400 | Invalid meeting URL |
| SESSION_NOT_IN_PROGRESS | 400 | Session not in progress |
| SESSION_NOT_PAUSED | 400 | Session not paused |
| SUMMARY_NOT_AVAILABLE | 404 | Summary not available yet |

## Appendix C: WebSocket Close Codes

| Code | Reason |
|------|--------|
| 4004 | Session not found |
| 4001 | Unauthorized |
| 4003 | Session ended |

---

*This technical specification is based on requirements.md and the existing codebase architecture.*
