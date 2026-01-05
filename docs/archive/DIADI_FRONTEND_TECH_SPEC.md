# Diadi Frontend Technical Specification

Version: 1.0
Date: 2026-01-05
Status: Draft for Implementation
Owners: Product, Design, Engineering

Sources:
- docs/PRD_DIADI_FRONTEND_V2.md
- docs/DIADI_FRONTEND_PRD_CONSOLIDATED.md
- docs/DYADIC_ALPHA_MASTER_STRATEGY.md
- docs/Diadi screens/*

## 1. Goals and Scope (Alpha P0)
Goal: Deliver a responsive web app that supports two-person facilitated voice sessions with minimal, visible AI interventions.

In scope (Alpha):
- Hub with active sessions and history
- Session creation wizard (lean 5-step flow)
- Partner invitation and dual consent
- External platform integration (Zoom, Meet, Teams) via MeetingBaas
- Waiting room and readiness checks
- Live facilitation room with talk balance, timer, AI status, interventions
- Kill switch or pause facilitation
- Post-session summary and rating
- Minimal profile and integrations

Out of scope (Alpha):
- Group calls (3+ participants)
- Therapy replacement or diagnosis
- One-sided coaching
- Persistent relationship CRM by default
- Native Diadi video chat (Beta)
- Deep Prep studio (Beta)

## 2. Reconciled Decisions
These resolve differences between the PRDs and are binding for this spec:
- Stack: Next.js 14 + React + TypeScript is the default. Teams may adapt, but this spec assumes Next.js.
- Wizard flow: 5-step lean flow for Alpha. Strategic Intent and Emotional Pulse are P1 optional steps.
- Platform: External meeting platforms are Alpha default. Native Diadi video is Beta.
- Event stream: Use /sessions/{session_id}/events. Internal alias /ws/{client_id}/feedback is acceptable.
- Deep Prep and dyad health: Beta only. Hide or show as disabled placeholders in Alpha.

## 3. Frontend Architecture

### 3.1 Repo Layout
The repo is currently backend-only (FastAPI). Add a dedicated frontend in a new top-level folder:
```
web/
  src/
    app/
      (dashboard)/
        hub/
        sessions/
          new/
          [id]/
        profile/
      invite/
        [token]/
    components/
    hooks/
    lib/
      api/
      events/
    stores/
    types/
```

### 3.2 Stack
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS + component primitives (shadcn/ui or equivalent)
- Zustand for session UI state (wizard, live UI)
- TanStack Query for server state and caching
- Zod for runtime validation of API payloads

### 3.3 Environment Configuration
Client and server env vars:
- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_WS_BASE_URL
- NEXT_PUBLIC_ENABLE_MOCKS (true for demo path)
- DIADI_API_KEY (server-only, used by Next.js route handlers to call backend)

Note: The backend currently requires the `x-meeting-baas-api-key` header for all requests. Do not expose this key in the browser. Use Next.js route handlers as a proxy, or update backend auth. This is a dependency.

### 3.4 Navigation and Routes
Routes map to the Alpha journeys:
- /hub: Hub with active and recent sessions
- /sessions/new: Wizard
- /invite/[token]: Invite acceptance and consent
- /sessions/[id]: Session detail view with state-based panels (waiting, live, summary)
- /profile: Profile and integrations

## 4. Data Model and State

### 4.1 Shared Types (from PRD)
Use the PRD TypeScript types as the base contract:
- SessionStatus, Platform, FacilitatorPersona
- Participant, FacilitatorConfig, Session
- TalkBalanceMetrics, Intervention, SessionSummary

### 4.2 Frontend View Models (additional)
```
type SessionListItem = {
  id: string;
  title: string;
  status: SessionStatus;
  partnerName: string;
  scheduledAt?: string;
  lastUpdatedAt: string;
};

type InvitePayload = {
  sessionId: string;
  inviteToken: string;
  inviteLink: string;
  expiresAt?: string;
};

type LiveRoomState = {
  sessionId: string;
  status: SessionStatus;
  aiStatus: "listening" | "preparing" | "intervening" | "paused";
  balance: TalkBalanceMetrics;
  timeRemainingSeconds: number;
  currentIntervention?: Intervention;
};
```

## 5. API Contract (Frontend Consumption)

### 5.1 Required Endpoints (new backend work)
These endpoints are required for full Alpha UX:

- POST /sessions
  - body: { goal, relationshipContext, facilitator, durationMinutes, scheduledAt?, platform? }
  - response: { sessionId, status, inviteLink, inviteToken }

- GET /sessions
  - response: SessionListItem[]

- GET /sessions/{session_id}
  - response: Session

- POST /sessions/{session_id}/consent
  - body: { participantId?, inviteToken, consented: boolean }
  - response: { status, participants }

- POST /sessions/{session_id}/start
  - body: { meetingUrl }
  - response: { status, botId, clientId, eventUrl }

- POST /sessions/{session_id}/end
  - response: { status }

- GET /sessions/{session_id}/summary
  - response: SessionSummary

- GET /sessions/{session_id}/transcript (P1)

### 5.2 Existing Endpoints (current backend)
- POST /bots (requires meeting_url)
- DELETE /bots/{bot_id}
- POST /personas/generate-image

### 5.3 API Proxy Pattern (recommended)
Create Next.js route handlers under /api/* that:
- inject `x-meeting-baas-api-key`
- forward requests to the FastAPI backend
- allow browser clients to use cookie or token auth later

### 5.4 Mock Path (alpha demo)
If backend additions are not ready:
- Use POST /bots directly for meeting start
- Use mock session data (local storage or in-memory)
- Provide a dev toggle to simulate balance, interventions, and time updates

## 6. Real-Time Event Stream

### 6.1 Endpoint
Primary: WebSocket /sessions/{session_id}/events
Alias: WebSocket /ws/{client_id}/feedback (server-side mapping)

### 6.2 Event Types
- session_state
- balance_update
- intervention
- escalation
- time_remaining
- goal_drift
- participant_status

### 6.3 Frontend Behavior
- Connect on entering live room
- Reconnect with backoff on disconnect
- Show fallback state if no events for > 10 seconds
- Throttle balance UI updates to 1-2 seconds

## 7. Screen-Level Implementation Notes (Alpha)

### 7.1 Hub
Data:
- GET /sessions
Behavior:
- CTA to /sessions/new
- Empty state for no sessions
- Search field (sessions and partners)

### 7.2 Session Creation Wizard
Steps (Alpha):
1. Identity and bond
2. Session goal
3. Facilitator selection
4. Review and connect
5. Launch hub

Data:
- POST /sessions on step 4 or 5
- return invite link and session id
Behavior:
- max 200 chars for goal
- default persona: neutral_mediator

### 7.3 Invitation and Consent
Data:
- GET /sessions/{id}
- POST /sessions/{id}/consent
Behavior:
- invitee can accept or decline
- consent state visible to both participants
- session cannot start until both consented

### 7.4 Launch and Waiting
Data:
- POST /sessions/{id}/start
Behavior:
- readiness checks (mic, camera, agent ready)
- show meeting link and Open meeting button
- show partner status (waiting, joining, joined)

### 7.5 Live Facilitation Room
Data:
- WebSocket /sessions/{id}/events
Behavior:
- AI status indicator (listening, preparing, intervening, paused)
- live talk balance, timer, goal snippet
- visual interventions (balance, silence, time remaining, goal drift)
- kill switch with immediate effect (no confirmation)

### 7.6 Post-Session Recap
Data:
- GET /sessions/{id}/summary
Behavior:
- summary within 30 seconds of end
- rating prompt for AI presence (1-5)

### 7.7 Profile and Integrations
Data:
- GET /profile (tbd)
Behavior:
- basic account details
- MeetingBaas integration status

## 8. Analytics and Quality Metrics
Emit events:
- session_created
- invitation_sent
- consent_accepted / consent_declined
- session_started
- intervention_triggered
- kill_switch_used
- session_ended
- summary_viewed
- rating_submitted

## 9. Non-Functional Requirements
- Initial load <= 2 seconds on broadband
- Real-time updates <= 1 second latency
- Mobile support down to 360x640
- Contrast ratio >= 4.5:1
- Keyboard navigable forms and dialogs
- Fallback UI states when event stream is disconnected

## 10. Implementation Plan and Dependencies

### Phase 0: Foundation and Mocks
Deliverables:
- Next.js app scaffold in `web/`
- Routing skeleton and basic layout
- API client and mock adapter
- Event simulator for live room
Dependencies:
- Design references (docs/Diadi screens/*)
- Confirmation of brand tokens (typography, color)

### Phase 1: Core Session Flow
Deliverables:
- Hub listing with search and empty states
- Session creation wizard (5 steps)
- Invite acceptance and consent UI
Dependencies:
- POST /sessions
- GET /sessions
- GET /sessions/{id}
- POST /sessions/{id}/consent

### Phase 2: Launch and Waiting Room
Deliverables:
- Readiness checks UI
- Meeting link handling and Open meeting CTA
Dependencies:
- POST /sessions/{id}/start
- Backend must call /bots and return botId, clientId, eventUrl

### Phase 3: Live Session
Deliverables:
- Live facilitation room
- Talk balance, AI status, interventions
- Kill switch
Dependencies:
- WebSocket /sessions/{id}/events with balance_update and intervention
- Backend event generation (Pipecat integration)

### Phase 4: Post-Session Recap
Deliverables:
- Summary view and rating
Dependencies:
- POST /sessions/{id}/end
- GET /sessions/{id}/summary

### Phase 5: Alpha Stretch (P1)
Deliverables:
- Strategic Intent and Emotional Pulse steps
- Transcript view
- Grounding pause flow
Dependencies:
- GET /sessions/{id}/transcript
- escalation events

## 11. Risks and Open Questions
- Auth: how will users authenticate and how is `x-meeting-baas-api-key` handled?
- Platform priority: Zoom vs Meet vs Teams for first release
- Data retention policy for summaries and transcripts
- Analytics provider (Segment, Amplitude, or custom)
- Event stream ownership and payload finalization

