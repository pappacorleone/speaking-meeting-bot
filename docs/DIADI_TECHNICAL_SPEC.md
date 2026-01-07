# Diadi Technical Specification

**Version:** 1.0
**Date:** 2026-01-06
**Status:** Consolidated

## Document Purpose

This technical specification defines **HOW** to implement Diadi. It is the authoritative source for:
- System architecture and component design
- Frontend directory structure and components
- Backend API contracts and data models
- Integration with existing MeetingBaas/Pipecat infrastructure
- Implementation phases and task breakdown
- Environment configuration
- Persona file specifications

**Audience:** Engineers, technical leads
**Related:** [DIADI_STRATEGY.md](DIADI_STRATEGY.md) (why), [DIADI_PRD.md](DIADI_PRD.md) (what)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Frontend Implementation Plan](#3-frontend-implementation-plan)
4. [Backend API Additions](#4-backend-api-additions)
5. [Integration with Existing Codebase](#5-integration-with-existing-codebase)
6. [Implementation Phases](#6-implementation-phases)
7. [TypeScript Types (Frontend)](#7-typescript-types-frontend)
8. [API Client (Frontend)](#8-api-client-frontend)
9. [Environment Variables](#9-environment-variables)
10. [Key Decisions (Confirmed)](#10-key-decisions-confirmed)
11. [New Diadi Personas](#11-new-diadi-personas)
12. [Risk Mitigation](#12-risk-mitigation)
13. [File Modifications Summary](#13-file-modifications-summary)
14. [Success Criteria](#14-success-criteria)

---

## 1. Executive Summary

This technical specification defines the implementation plan for the Diadi frontend—a web application enabling AI-facilitated two-person conversations. The spec maps requirements to the existing `speaking-meeting-bot` codebase.

**Key Deliverables:**
- Next.js 14 frontend in new `web/` directory
- Backend API extensions for session management
- Real-time event streaming for live facilitation
- Integration with existing MeetingBaas bot infrastructure

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Diadi Web App                            │
│  (Next.js 14 + React + TypeScript + Tailwind + shadcn/ui)       │
│  Directory: web/                                                │
├─────────────────────────────────────────────────────────────────┤
│  Pages/Routes:                                                  │
│  - /hub (dashboard)                                             │
│  - /sessions/new (wizard)                                       │
│  - /sessions/[id] (detail/live)                                 │
│  - /invite/[token] (consent flow)                               │
│  - /profile                                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (existing)                    │
│  Directory: app/                                                │
├─────────────────────────────────────────────────────────────────┤
│  Existing Endpoints:                                            │
│  - POST /bots (MeetingBaas integration)                         │
│  - DELETE /bots/{bot_id}                                        │
│  - POST /webhook (MeetingBaas callbacks)                        │
│  - WS /ws/{client_id}/input|output (audio streams)              │
│  - WS /pipecat/{client_id} (internal)                           │
├─────────────────────────────────────────────────────────────────┤
│  NEW Endpoints Required:                                        │
│  - POST /sessions                                               │
│  - GET /sessions/{id}                                           │
│  - POST /sessions/{id}/consent                                  │
│  - POST /sessions/{id}/start                                    │
│  - POST /sessions/{id}/end                                      │
│  - GET /sessions/{id}/summary                                   │
│  - WS /sessions/{id}/events (real-time)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────┐         ┌──────────────────────┐
│   MeetingBaas    │         │   Pipecat Subprocess │
│   (External)     │         │   (STT→LLM→TTS)      │
└──────────────────┘         └──────────────────────┘
```

---

## 3. Frontend Implementation Plan

### 3.1 Directory Structure

```
web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (dashboard)/              # Authenticated layout group
│   │   │   ├── hub/
│   │   │   │   └── page.tsx          # Main dashboard
│   │   │   ├── sessions/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Session creation wizard
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Session detail (pre/during/post)
│   │   │   │       └── live/
│   │   │   │           └── page.tsx  # Live facilitation room
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Dashboard layout with nav
│   │   ├── invite/
│   │   │   └── [token]/
│   │   │       └── page.tsx          # Partner consent flow
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Landing/redirect
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── hub/
│   │   │   ├── SessionCard.tsx
│   │   │   ├── SessionList.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── session/
│   │   │   ├── wizard/
│   │   │   │   ├── StepIdentity.tsx
│   │   │   │   ├── StepGoal.tsx
│   │   │   │   ├── StepFacilitator.tsx
│   │   │   │   ├── StepReview.tsx
│   │   │   │   └── StepLaunch.tsx
│   │   │   ├── WaitingRoom.tsx
│   │   │   ├── LiveRoom.tsx
│   │   │   ├── TalkBalance.tsx
│   │   │   ├── AIStatusIndicator.tsx
│   │   │   ├── SessionTimer.tsx
│   │   │   ├── KillSwitch.tsx
│   │   │   └── Summary.tsx
│   │   ├── intervention/
│   │   │   ├── InterventionCard.tsx
│   │   │   ├── BalancePrompt.tsx
│   │   │   ├── SilencePrompt.tsx
│   │   │   └── TimeWarning.tsx
│   │   ├── consent/
│   │   │   ├── ConsentForm.tsx
│   │   │   └── ConsentStatus.tsx
│   │   └── navigation/
│   │       ├── BottomNav.tsx         # Mobile
│   │       └── SideRail.tsx          # Desktop
│   ├── hooks/
│   │   ├── useSession.ts
│   │   ├── useSessionEvents.ts       # WebSocket hook
│   │   ├── useTalkBalance.ts
│   │   └── useIntervention.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts             # API client
│   │   │   ├── sessions.ts           # Session API calls
│   │   │   └── bots.ts               # Bot API calls
│   │   └── utils.ts
│   ├── stores/
│   │   ├── sessionStore.ts           # Zustand store
│   │   └── uiStore.ts
│   └── types/
│       ├── session.ts                # Session, Participant, etc.
│       ├── intervention.ts
│       └── events.ts
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .env.local
```

### 3.2 Core Pages and Components

#### Page: Hub (`/hub`)
- **Components:** SessionList, SessionCard, EmptyState, NewSessionCTA
- **Data:** GET /sessions (list active + recent)
- **Features:**
  - Active sessions with status badges
  - Recent sessions with date/partner
  - Search (sessions + partners)
  - Primary CTA → /sessions/new

#### Page: Session Wizard (`/sessions/new`)
- **Components:** Wizard steps (5 steps)
- **State:** Multi-step form with Zustand
- **Steps:**
  1. **Identity & Bond:** Partner name, relationship context
  2. **Goal:** Goal text (max 200), schedule (now/later), duration (15/30/45/60 min)
  3. **Facilitator:** Persona selection (Neutral Mediator, Deep Empath, Decision Catalyst)
  4. **Review:** Summary of inputs, create invitation
  5. **Launch Hub:** Invite link, platform selection (Zoom/Meet/Teams), meeting URL input

#### Page: Session Detail (`/sessions/[id]`)
- **States:** Pre-session, During-session, Post-session
- **Pre-session:** Waiting room, partner status, readiness checks
- **During-session:** Redirect to /sessions/[id]/live
- **Post-session:** Summary, action items, rating prompt

#### Page: Live Facilitation Room (`/sessions/[id]/live`)
- **Components:** LiveRoom, TalkBalance, AIStatusIndicator, SessionTimer, KillSwitch, InterventionCard
- **Real-time:** WebSocket to `/sessions/{id}/events`
- **Features:**
  - AI status (Listening, Preparing, Intervening, Paused)
  - Talk balance bar (updates every 1-2s)
  - Timer with time remaining
  - Goal snippet
  - Kill switch (immediate, no confirmation)
  - Visual intervention cards

#### Page: Invite/Consent (`/invite/[token]`)
- **Components:** ConsentForm, ConsentStatus
- **Data:** Session goal, time, duration, AI explanation
- **Actions:** Accept/Decline consent
- **Redirect:** To waiting room on accept

### 3.3 Real-Time Event Handling

```typescript
// hooks/useSessionEvents.ts
import { useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/sessionStore';

type SessionEventType =
  | 'session_state'
  | 'balance_update'
  | 'intervention'
  | 'escalation'
  | 'time_remaining'
  | 'goal_drift'
  | 'participant_status';

interface SessionEvent {
  type: SessionEventType;
  timestamp: string;
  data: unknown;
}

export function useSessionEvents(sessionId: string) {
  const { updateBalance, addIntervention, setAIStatus } = useSessionStore();

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/sessions/${sessionId}/events`);

    ws.onmessage = (event) => {
      const parsed: SessionEvent = JSON.parse(event.data);

      switch (parsed.type) {
        case 'balance_update':
          updateBalance(parsed.data);
          break;
        case 'intervention':
          addIntervention(parsed.data);
          break;
        case 'session_state':
          setAIStatus(parsed.data.status);
          break;
        // ... other event handlers
      }
    };

    return () => ws.close();
  }, [sessionId]);
}
```

---

## 4. Backend API Additions

### 4.1 New Endpoints Required

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/sessions` | POST | Create session | SessionCreate | Session |
| `/sessions` | GET | List sessions | Query params | Session[] |
| `/sessions/{id}` | GET | Get session | - | Session |
| `/sessions/{id}/consent` | POST | Record consent | ConsentRequest | Consent |
| `/sessions/{id}/start` | POST | Start session | StartRequest | StartResponse |
| `/sessions/{id}/end` | POST | End session | - | Session |
| `/sessions/{id}/summary` | GET | Get summary | - | SessionSummary |
| `/sessions/{id}/events` | WS | Event stream | - | SessionEvent[] |

### 4.2 Data Models (Backend)

```python
# app/models/session.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

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
    DIADI = "diadi"

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
    silence_detection: bool = True

class SessionCreate(BaseModel):
    title: str
    goal: str
    relationship_context: str
    platform: Platform
    meeting_url: Optional[str] = None
    duration_minutes: int = 30
    scheduled_at: Optional[datetime] = None
    facilitator: FacilitatorConfig = FacilitatorConfig()
    partner_name: str

class Session(BaseModel):
    id: str
    title: str
    goal: str
    relationship_context: str
    platform: Platform
    meeting_url: Optional[str] = None
    duration_minutes: int
    scheduled_at: Optional[datetime] = None
    status: SessionStatus
    participants: List[Participant]
    facilitator: FacilitatorConfig
    created_at: datetime
    invite_token: str
    bot_id: Optional[str] = None
    client_id: Optional[str] = None

class ConsentRequest(BaseModel):
    participant_id: str
    accepted: bool

class StartRequest(BaseModel):
    meeting_url: str  # Required for external platforms

class SessionSummary(BaseModel):
    session_id: str
    duration_minutes: int
    consensus_summary: str
    action_items: List[str]
    balance: dict  # {participantA: %, participantB: %, status: str}
    intervention_count: int
```

### 4.3 Session Storage (Alpha: In-Memory)

```python
# app/services/session_service.py
from typing import Dict, Optional
from datetime import datetime
import uuid
import secrets

# In-memory storage (Alpha)
SESSIONS: Dict[str, Session] = {}
INVITE_TOKENS: Dict[str, str] = {}  # token -> session_id

class SessionService:
    def create_session(self, data: SessionCreate, creator_id: str) -> Session:
        session_id = str(uuid.uuid4())
        invite_token = secrets.token_urlsafe(32)

        session = Session(
            id=session_id,
            title=data.title,
            goal=data.goal,
            relationship_context=data.relationship_context,
            platform=data.platform,
            meeting_url=data.meeting_url,
            duration_minutes=data.duration_minutes,
            scheduled_at=data.scheduled_at,
            status=SessionStatus.DRAFT,
            participants=[
                Participant(id=creator_id, name="Creator", role="creator", consented=True),
                Participant(id=str(uuid.uuid4()), name=data.partner_name, role="invitee", consented=False),
            ],
            facilitator=data.facilitator,
            created_at=datetime.utcnow(),
            invite_token=invite_token,
        )

        SESSIONS[session_id] = session
        INVITE_TOKENS[invite_token] = session_id
        return session

    def record_consent(self, session_id: str, participant_id: str, accepted: bool) -> Session:
        session = SESSIONS.get(session_id)
        if not session:
            raise ValueError("Session not found")

        for p in session.participants:
            if p.id == participant_id:
                p.consented = accepted
                break

        # Update status if both consented
        if all(p.consented for p in session.participants):
            session.status = SessionStatus.READY

        return session

    def start_session(self, session_id: str, meeting_url: str) -> Session:
        session = SESSIONS.get(session_id)
        if not session:
            raise ValueError("Session not found")
        if session.status != SessionStatus.READY:
            raise ValueError("Session not ready to start")

        session.meeting_url = meeting_url
        session.status = SessionStatus.IN_PROGRESS
        return session
```

### 4.4 Event Broadcasting

```python
# app/services/event_service.py
from fastapi import WebSocket
from typing import Dict, Set
import json

# Active event connections per session
SESSION_EVENT_CONNECTIONS: Dict[str, Set[WebSocket]] = {}

class EventService:
    async def broadcast(self, session_id: str, event_type: str, data: dict):
        """Broadcast event to all connected clients for a session."""
        connections = SESSION_EVENT_CONNECTIONS.get(session_id, set())
        message = json.dumps({
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "data": data,
        })

        for ws in connections.copy():
            try:
                await ws.send_text(message)
            except:
                connections.discard(ws)

    async def register(self, session_id: str, websocket: WebSocket):
        if session_id not in SESSION_EVENT_CONNECTIONS:
            SESSION_EVENT_CONNECTIONS[session_id] = set()
        SESSION_EVENT_CONNECTIONS[session_id].add(websocket)

    async def unregister(self, session_id: str, websocket: WebSocket):
        if session_id in SESSION_EVENT_CONNECTIONS:
            SESSION_EVENT_CONNECTIONS[session_id].discard(websocket)
```

---

## 5. Integration with Existing Codebase

### 5.1 Mapping Sessions to Bots

When a session starts:
1. Frontend calls `POST /sessions/{id}/start` with `meeting_url`
2. Backend calls existing `POST /bots` internally
3. Backend stores `bot_id` and `client_id` in session record
4. Backend starts emitting events from Pipecat to `/sessions/{id}/events`

```python
# In session routes
async def start_session(session_id: str, request: StartRequest):
    session = session_service.get(session_id)

    # Map facilitator persona to existing persona system
    persona_mapping = {
        "neutral_mediator": "level10_meeting_facilitator",
        "deep_empath": "buddhist_monk",  # Example mapping
        "decision_catalyst": "debate_champion",  # Example mapping
    }

    # Call existing /bots endpoint logic
    bot_request = BotRequest(
        meeting_url=request.meeting_url,
        personas=[persona_mapping[session.facilitator.persona]],
        bot_name=f"Diadi - {session.title}",
    )

    # Use existing bot creation logic
    result = await create_bot(bot_request, api_key)

    # Update session with bot info
    session.bot_id = result.bot_id
    session.client_id = result.client_id  # Need to expose this
    session.status = SessionStatus.IN_PROGRESS

    return session
```

### 5.2 Exposing client_id from /bots

Current `/bots` only returns `bot_id`. Need to also return `client_id` for session mapping:

```python
# app/routes.py - Modify JoinResponse
class JoinResponse(BaseModel):
    bot_id: str
    client_id: str  # ADD THIS
```

### 5.3 Emitting Events from Pipecat

Add event emission hooks in `scripts/meetingbaas.py`:

```python
# In Pipecat pipeline, add event emission
async def emit_event(event_type: str, data: dict):
    """Send event to parent process via stdout protocol."""
    event = {"__event__": event_type, "data": data}
    print(f"__EVENT__{json.dumps(event)}__EVENT__")

# Hook into pipeline for talk balance
class TalkBalanceTracker:
    def __init__(self):
        self.participant_a_time = 0
        self.participant_b_time = 0

    async def on_vad_speech(self, speaker: str, duration: float):
        if speaker == "participant_a":
            self.participant_a_time += duration
        else:
            self.participant_b_time += duration

        total = self.participant_a_time + self.participant_b_time
        if total > 0:
            await emit_event("balance_update", {
                "participantA": round(self.participant_a_time / total * 100),
                "participantB": round(self.participant_b_time / total * 100),
                "status": self._get_status(),
            })
```

---

## 6. Implementation Phases

### Phase 1: Foundation
**Dependencies:** None

**Backend:**
- [ ] Add session data models (`app/models/session.py`)
- [ ] Implement SessionService with in-memory storage
- [ ] Add session CRUD endpoints (`app/routes/sessions.py`)
- [ ] Modify `/bots` to return `client_id`
- [ ] Create new Diadi personas in `config/personas/`:
  - [ ] `neutral_mediator/README.md` - Balanced, non-judgmental facilitation
  - [ ] `deep_empath/README.md` - Emotionally attuned, validation-focused
  - [ ] `decision_catalyst/README.md` - Action-oriented, decision-driving

**Frontend:**
- [ ] Initialize Next.js 14 project in `web/`
- [ ] Set up Tailwind + shadcn/ui
- [ ] Create API client and types
- [ ] Implement basic navigation (mobile bottom nav, desktop side rail)
- [ ] Create Hub page with empty states

### Phase 2: Session Creation
**Dependencies:** Phase 1

**Backend:**
- [ ] Add invite token generation and lookup
- [ ] Implement consent endpoints

**Frontend:**
- [ ] Build 5-step session creation wizard
- [ ] Implement StepIdentity, StepGoal, StepFacilitator, StepReview, StepLaunch
- [ ] Create SessionCard and SessionList components
- [ ] Add form validation and state management (Zustand)

### Phase 3: Invitation & Consent
**Dependencies:** Phase 2

**Backend:**
- [ ] Add consent tracking per participant
- [ ] Implement session status transitions

**Frontend:**
- [ ] Build invite page (`/invite/[token]`)
- [ ] Create ConsentForm with AI explanation
- [ ] Show consent status to both participants
- [ ] Implement waiting room with partner status

### Phase 4: Live Session
**Dependencies:** Phase 3

**Backend:**
- [ ] Add `/sessions/{id}/events` WebSocket endpoint
- [ ] Integrate with existing Pipecat process
- [ ] Emit balance_update, intervention, time_remaining events
- [ ] Connect session start to existing `/bots` endpoint
- [ ] **Real Talk Balance Implementation:**
  - [ ] Investigate MeetingBaas speaker diarization API
  - [ ] Add speaker identification to `scripts/meetingbaas.py` Pipecat pipeline
  - [ ] Track per-speaker audio duration in TalkBalanceTracker class
  - [ ] Emit real balance_update events every 1-2 seconds

**Frontend:**
- [ ] Build Live Facilitation Room
- [ ] Implement useSessionEvents WebSocket hook
- [ ] Create TalkBalance component with real-time updates
- [ ] Build AIStatusIndicator (Listening, Preparing, Intervening, Paused)
- [ ] Add SessionTimer with time remaining
- [ ] Implement KillSwitch with immediate effect

### Phase 5: Interventions
**Dependencies:** Phase 4

**Backend:**
- [ ] Add intervention logic in Pipecat
- [ ] Emit intervention events with type and message
- [ ] Implement intervention guardrails (cooldown, blockers)

**Frontend:**
- [ ] Build InterventionCard component
- [ ] Create BalancePrompt, SilencePrompt, TimeWarning variants
- [ ] Add intervention action buttons (Prompt, Skip)
- [ ] Show intervention history

### Phase 6: Post-Session
**Dependencies:** Phase 5

**Backend:**
- [ ] Add summary generation endpoint
- [ ] Store session summary on end
- [ ] Implement rating storage

**Frontend:**
- [ ] Build Summary component
- [ ] Show consensus, action items, balance stats
- [ ] Add rating prompt (1-5 stars)
- [ ] Create session history view

### Phase 7: Polish & Testing
**Dependencies:** All previous phases

- [ ] Mobile responsive testing (360x640, 1280x720)
- [ ] Accessibility audit (contrast, keyboard nav, screen reader)
- [ ] Performance optimization (< 2s load)
- [ ] Error states and fallbacks
- [ ] End-to-end testing

---

## 7. TypeScript Types (Frontend)

```typescript
// types/session.ts
export type SessionStatus =
  | "draft"
  | "pending_consent"
  | "ready"
  | "in_progress"
  | "paused"
  | "ended"
  | "archived";

export type Platform = "zoom" | "meet" | "teams" | "diadi";

export type FacilitatorPersona = "neutral_mediator" | "deep_empath" | "decision_catalyst";

export interface Participant {
  id: string;
  name: string;
  role: "creator" | "invitee";
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
  title: string;
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
}

// types/events.ts
export type EventType =
  | "session_state"
  | "balance_update"
  | "intervention"
  | "escalation"
  | "time_remaining"
  | "goal_drift"
  | "participant_status";

export interface BalanceUpdate {
  participantA: { id: string; name: string; percentage: number };
  participantB: { id: string; name: string; percentage: number };
  status: "balanced" | "mild_imbalance" | "severe_imbalance";
}

export interface Intervention {
  id: string;
  type: "balance" | "silence" | "goal_drift" | "time_warning" | "escalation";
  modality: "visual" | "voice";
  message: string;
  actions?: { id: string; label: string }[];
}

export interface SessionEvent<T = unknown> {
  type: EventType;
  timestamp: string;
  data: T;
}
```

---

## 8. API Client (Frontend)

```typescript
// lib/api/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7014";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// lib/api/sessions.ts
import { Session, SessionCreate, ConsentRequest, SessionSummary } from "@/types/session";
import { apiRequest } from "./client";

export const sessionsApi = {
  create: (data: SessionCreate) =>
    apiRequest<Session>("/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (id: string) => apiRequest<Session>(`/sessions/${id}`),

  list: () => apiRequest<Session[]>("/sessions"),

  consent: (id: string, data: ConsentRequest) =>
    apiRequest<Session>(`/sessions/${id}/consent`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  start: (id: string, meetingUrl: string) =>
    apiRequest<Session>(`/sessions/${id}/start`, {
      method: "POST",
      body: JSON.stringify({ meeting_url: meetingUrl }),
    }),

  end: (id: string) =>
    apiRequest<Session>(`/sessions/${id}/end`, { method: "POST" }),

  getSummary: (id: string) =>
    apiRequest<SessionSummary>(`/sessions/${id}/summary`),
};
```

---

## 9. Environment Variables

### Backend (.env additions)
```
# Session management (future: database)
SESSION_SECRET=your-secret-key

# Frontend CORS origin
FRONTEND_URL=http://localhost:3000
```

### Frontend (web/.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:7014
NEXT_PUBLIC_WS_URL=ws://localhost:7014
```

---

## 10. Key Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Authentication** | No auth (demo mode) | Skip auth for Alpha. Sessions anonymous with local storage. Fastest to implement. |
| **Primary Platform** | Google Meet | No app install required. Works in browser. Easiest for quick testing. |
| **Talk Balance** | Real implementation | Integrate MeetingBaas speaker diarization or add to Pipecat pipeline. Not mock data. |
| **Personas** | Create new Diadi personas | Create dedicated `neutral_mediator`, `deep_empath`, `decision_catalyst` personas from scratch. |
| **Database** | In-memory for Alpha | PostgreSQL for production (post-Alpha). |

---

## 11. New Diadi Personas

Create three new personas in `config/personas/`:

### 11.1 Neutral Mediator (`config/personas/neutral_mediator/README.md`)
```markdown
# Neutral Mediator

You are Diadi's Neutral Mediator—a calm, balanced facilitator who helps two people have difficult conversations. You never take sides. Your role is to ensure both participants feel heard and to guide the conversation toward mutual understanding.

## Characteristics
- Impartial and non-judgmental
- Calm, measured tone
- Reflects back what each person says
- Asks clarifying questions
- Gently redirects when conversation goes off-track

## Voice
Warm but professional. Measured pace. Gender-neutral tone.

## Metadata
- image: [to be generated]
- entry_message: "Hello, I'm here to help facilitate your conversation today. My role is to ensure you both feel heard. Shall we begin?"
- cartesia_voice_id: [to be matched]
- gender: NON_BINARY
```

### 11.2 Deep Empath (`config/personas/deep_empath/README.md`)
```markdown
# Deep Empath

You are Diadi's Deep Empath—a compassionate facilitator who creates emotional safety. You help participants express feelings they may struggle to articulate. You validate emotions before moving to solutions.

## Characteristics
- Deeply attuned to emotional undertones
- Validates feelings explicitly
- Creates space for vulnerability
- Uses reflective listening
- Gentle pace, never rushed

## Voice
Soft, warm, nurturing. Slightly slower pace. Reassuring tone.

## Metadata
- image: [to be generated]
- entry_message: "Welcome. I'm here to create a safe space for your conversation. Take your time—there's no rush."
- cartesia_voice_id: [to be matched]
- gender: FEMALE
```

### 11.3 Decision Catalyst (`config/personas/decision_catalyst/README.md`)
```markdown
# Decision Catalyst

You are Diadi's Decision Catalyst—a focused facilitator who helps pairs move from discussion to action. You identify decision points, clarify options, and help participants commit to next steps.

## Characteristics
- Action-oriented
- Asks clarifying questions to surface options
- Summarizes progress frequently
- Identifies decision points explicitly
- Encourages commitment to next steps

## Voice
Confident, clear, energetic but not pushy. Moderate pace.

## Metadata
- image: [to be generated]
- entry_message: "Let's make progress today. What's the key decision you need to make together?"
- cartesia_voice_id: [to be matched]
- gender: MALE
```

---

## 12. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Speaker diarization complexity | Start with MeetingBaas webhook data; add Pipecat-level tracking if needed |
| WebSocket reliability | Add reconnection logic with exponential backoff; show fallback UI |
| Meeting URL validation | Add regex validation for Google Meet URLs (primary platform) |
| Consent compliance | Log all consent actions with timestamps for audit trail |
| Session state sync | Single source of truth in backend; frontend subscribes to events |
| Google Meet bot join failures | Implement retry logic; clear error messaging to user |

---

## 13. File Modifications Summary

### Existing Files to Modify
- [app/routes.py](../app/routes.py) - Add session routes, modify JoinResponse
- [app/models.py](../app/models.py) - Add session models
- [scripts/meetingbaas.py](../scripts/meetingbaas.py) - Add event emission hooks, talk balance tracking

### New Files to Create
**Backend:**
- `app/routes/sessions.py` - Session endpoints
- `app/services/session_service.py` - Session business logic
- `app/services/event_service.py` - Event broadcasting
- `app/models/session.py` - Session data models

**New Personas:**
- `config/personas/neutral_mediator/README.md` - Balanced facilitation persona
- `config/personas/deep_empath/README.md` - Emotionally attuned persona
- `config/personas/decision_catalyst/README.md` - Action-oriented persona

**Frontend (new `web/` directory):**
- Full Next.js 14 application as outlined in section 3.1

---

## 14. Success Criteria

Per PRD requirements:
- [ ] >= 80% of pairs rate session 4/5 or higher
- [ ] < 3 interventions per 30 minutes
- [ ] Talk balance within 40/60-60/40 for >= 60% of session
- [ ] Consent completion rate >= 85%

Technical criteria:
- [ ] Initial page load <= 2 seconds
- [ ] Real-time updates <= 1 second latency
- [ ] Mobile responsive (360x640 and 1280x720)
- [ ] Contrast ratio >= 4.5:1
- [ ] Keyboard navigable forms
