# Diadi Frontend Product Requirements Document

Version: 2.0
Date: 2026-01-05
Status: Draft for Implementation
Owners: Product, Design, Engineering

Sources:
- docs/DYADIC_ALPHA_MASTER_STRATEGY.md
- docs/Diadi screens/*

## Table of Contents
1. Executive Summary
2. Strategy Alignment and Constraints
3. Target Users and Jobs
4. Scope and Phasing
5. Experience Architecture
6. Screen Inventory and Coherence Decisions
7. Functional Requirements (Alpha)
8. Data Model and State
9. Analytics and Quality Metrics
10. Non-Functional Requirements
11. Implementation Guide Using Existing Codebase
12. Open Questions and Risks

## 1. Executive Summary
Diadi is the AI that helps two people have the conversations they are avoiding. The product serves the relationship, not either individual, and intervenes rarely with clear, symmetric visibility.

Alpha scope:
- Two-person voice sessions
- Visual feedback and minimal interventions
- Meeting platform integration (Zoom, Meet, Teams) via MeetingBaas
- Session-only memory by default
- Web app that works on desktop and mobile

Success metrics (alpha):
- >= 80 percent of pairs rate the session 4/5 or higher
- < 3 interventions per 30 minutes
- Talk balance within 40/60 to 60/40 for at least 60 percent of the session
- Consent completion rate >= 85 percent of invited partners

## 2. Strategy Alignment and Constraints
Values (priority order): Safe, Respectful, Healthy, Culturally Aware, Constructive.

Constraints:
- Serve the relationship, not either individual
- No private coaching to one party
- No hidden AI presence, no unilateral reports
- Session-only data by default
- Minimal intervention, visual first, voice only when necessary
- Never present as therapy or crisis support

## 3. Target Users and Jobs
Primary personas (alpha):
- Couples in conflict: resolve recurring arguments without escalation
- Parent and adult child: move beyond surface-level check-ins
- Co-founders: resolve high-stakes decisions without damaging trust
- Close professional partners: improve balance and clarity

Jobs to be done:
- Set a shared goal for a difficult conversation
- Keep turn-taking fair and visible
- De-escalate tension when it rises
- Capture agreements and action items

## 4. Scope and Phasing

### 4.1 Alpha (P0)
- Hub with active sessions and history
- Session creation wizard
- Partner invitation and dual consent
- External platform support (Zoom/Meet/Teams)
- Waiting room and readiness checks
- Live facilitation room with talk balance, timer, AI status
- Visual interventions (balance, silence, time remaining, goal drift)
- Kill switch or pause facilitation
- Post-session summary and rating

### 4.2 Alpha Stretch (P1)
- Facilitator parameter tuning
- Escalation detection and grounding exercises
- Full transcript with AI annotations
- Artifact uploads and sharing (limited)
- Export summary (PDF)

### 4.3 Beta (P2)
- Deep prep studio (simulate dialogue, draft opening)
- Partner profiles and journey history
- Dyad health score
- Cross-session memory (opt-in)
- Native Diadi video chat
- Watch complications
- Translation

### 4.4 Out of Scope for Alpha
- Group calls (3+ participants)
- Therapy replacement or diagnosis
- One-sided performance coaching
- Persistent relationship CRM by default

## 5. Experience Architecture

### 5.1 Surfaces
- Diadi web app: session setup, live facilitation room, post-session recap
- Meeting platform: Zoom/Meet/Teams call where the facilitator bot joins
- Mobile responsive views for all primary flows

### 5.2 Navigation
Mobile bottom nav:
- Home (Hub)
- Partners (beta)
- New Session (primary CTA)
- Profile

Desktop side rail:
- Home
- Partners (beta)
- History
- Artifacts (beta)
- Settings

### 5.3 Primary User Journeys
A. Create session and invite partner
B. Accept invite and consent
C. Launch and wait for partner
D. Active session with facilitation
E. Post-session recap and rating

High level flow:
[Hub] -> [New Session] -> [Invite] -> [Consent] -> [Launch] -> [Live Session] -> [Summary]

## 6. Screen Inventory and Coherence Decisions

### 6.1 Screen Inventory by Folder
- docs/Diadi screens/hub (2)
- docs/Diadi screens/navigation (4)
- docs/Diadi screens/partner invitation (6)
- docs/Diadi screens/session creation (15)
- docs/Diadi screens/active session (diadi) (11)
- docs/Diadi screens/active session (zoom_meet) (6)
- docs/Diadi screens/interventions (21)
- docs/Diadi screens/session detail/pre-session (6)
- docs/Diadi screens/session detail/during-session (1)
- docs/Diadi screens/session detail/post-session (9)
- docs/Diadi screens/partner profiles (5)
- docs/Diadi screens/user profile (2)
- docs/Diadi screens/complications (7)

### 6.2 Coherence Decisions
- Product name is Diadi. Use "Talk" as a section label only (e.g., Hub header), not as the brand.
- "Facilitator" is the system role. "Neutral Mediator", "Deep Empath", and "Decision Catalyst" are persona labels.
- External meeting platform is the alpha default. "Diadi Video Chat" is marked "Coming soon" until a native video provider is implemented.
- Add a meeting link input when External Platform is selected. The current backend requires meeting_url for /bots.
- Deep Prep screens are beta. In alpha, show a disabled or hidden entry point.
- Dyad health, AI recommendations, and journey insights are beta. Hide or show as placeholders.

## 7. Functional Requirements (Alpha)

### 7.1 Hub
Requirements:
- Show active sessions with status (ready, in progress, completed)
- Primary CTA to start a new session
- Show recent sessions list with date and partner
- Show lightweight artifact area only if artifacts exist

Acceptance criteria:
- Empty states for no sessions, no artifacts
- Search field supports sessions and partners (no advanced filtering in alpha)

### 7.2 Session Creation Wizard
Steps:
1. Identity and bond
2. Session goal
3. Facilitator selection
4. Review and connect
5. Launch hub

Acceptance criteria:
- Step 1 captures partner name and relationship context
- Step 2 captures goal text (max 200 chars), schedule (now or later), and duration
- Step 3 selects facilitator persona (default: Neutral Mediator)
- Step 4 shows a summary of inputs and creates the invitation
- Step 5 provides invite link, platform selection, and meeting link input

### 7.3 Invitation and Consent
Acceptance criteria:
- Invitee sees goal, time, duration, and AI consent explanation
- Invitee can accept or decline privately
- Session cannot start until both consented
- Consent state visible to both participants

### 7.4 Launch and Waiting
Acceptance criteria:
- Show readiness status (mic, camera, agent ready)
- Show partner status (waiting, joining, joined)
- Allow copying invite link
- If external platform is selected, show meeting link and "Open meeting" button

### 7.5 Active Session UI
Surfaces:
- Live facilitation room in Diadi app
- External meeting running separately (Zoom/Meet/Teams)

Acceptance criteria:
- Always-visible AI status indicator (Listening, Preparing, Intervening, Paused)
- Talk balance indicator updates every 1-2 seconds
- Session timer and time remaining
- Goal snippet visible in the live room
- Kill switch or pause facilitation available at all times

### 7.6 Interventions and Safety
Intervention policy:
- Visual-first, voice only for severe cases
- No more than 1 intervention every 2 minutes

Triggers (defaults):
- Balance: > 65/35 for 3 minutes -> visual prompt
- Balance: > 70/30 for 5 minutes -> optional voice prompt (if enabled)
- Silence: > 15 seconds -> visual prompt
- Goal drift: off-goal > 2 minutes -> visual prompt
- Time remaining: < 5 minutes -> visual prompt

Grounding and escalation (P1):
- High tension -> offer 1 to 2 minute pause
- Both participants must accept to pause
- Crisis support screen only if severe pattern match is detected

Kill switch:
- Immediate effect with no confirmation
- Both participants notified
- Re-enable only with explicit consent from both parties

### 7.7 Post-Session Recap
Acceptance criteria:
- Summary generated within 30 seconds of session end
- Summary includes goal, consensus, key points, action items, and balance
- Rating prompt for AI presence (1-5)
- Transcript view only if backend supports transcription (P1)

### 7.8 Profile and Integrations (Minimal)
Acceptance criteria:
- Basic account details and subscription status
- Integrations section shows MeetingBaas status (active or not configured)

## 8. Data Model and State

### 8.1 Core Entities (TypeScript)
```ts
type SessionStatus =
  | "draft"
  | "pending_consent"
  | "ready"
  | "in_progress"
  | "paused"
  | "ended"
  | "archived";

type Platform = "zoom" | "meet" | "teams" | "diadi";

type FacilitatorPersona = "neutral_mediator" | "deep_empath" | "decision_catalyst";

type InterventionType = "balance" | "silence" | "goal_drift" | "time_warning" | "escalation";

type InterventionModality = "visual" | "voice";

interface Participant {
  id: string;
  name: string;
  role: "creator" | "invitee";
  consented: boolean;
}

interface FacilitatorConfig {
  persona: FacilitatorPersona;
  interruptAuthority: boolean;
  directInquiry: boolean;
  silenceDetection: boolean;
}

interface Session {
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
}

interface TalkBalanceMetrics {
  participantA: number; // percent
  participantB: number; // percent
  status: "balanced" | "mild_imbalance" | "severe_imbalance";
}

interface Intervention {
  id: string;
  type: InterventionType;
  modality: InterventionModality;
  message: string;
  targetParticipant?: string;
  createdAt: string;
}

interface SessionSummary {
  sessionId: string;
  durationMinutes: number;
  consensusSummary: string;
  actionItems: string[];
  balance: TalkBalanceMetrics;
  interventionCount: number;
}
```

### 8.2 Session State Machine
- draft -> pending_consent -> ready -> in_progress -> ended
- in_progress -> paused -> in_progress
- ended -> archived

## 9. Analytics and Quality Metrics
Key events:
- session_created
- invitation_sent
- consent_accepted / consent_declined
- session_started
- intervention_triggered
- kill_switch_used
- session_ended
- summary_viewed
- rating_submitted

Quality metrics:
- Consent completion rate
- Session completion rate
- Interventions per 30 minutes
- Balance time within 40/60 to 60/40
- User rating distribution
- Kill switch rate (safety proxy)

## 10. Non-Functional Requirements
Performance:
- Initial page load <= 2 seconds on broadband
- Real-time updates <= 1 second latency
- All primary flows usable on 360x640 and 1280x720

Accessibility:
- Contrast ratio >= 4.5:1 for text
- Keyboard navigable forms and dialogs
- Screen reader labels for controls and status indicators

Privacy and Security:
- Session-only data by default, no recording unless explicitly enabled
- Clear consent language before any facilitation begins
- Audit logging for consent and kill switch events

Reliability:
- Graceful degradation if real-time metrics fail
- Fallback UI states when WebSocket is disconnected

## 11. Implementation Guide Using Existing Codebase

### 11.1 Current Backend Capabilities (This Repo)
| Endpoint | Purpose | Notes |
| --- | --- | --- |
| POST /bots | Create a MeetingBaas bot | Requires x-meeting-baas-api-key header and meeting_url |
| DELETE /bots/{bot_id} | Remove bot | Ends MeetingBaas bot session |
| POST /personas/generate-image | Generate persona image | Uses Replicate |
| POST /webhook | MeetingBaas callbacks | Currently logs events |
| WebSocket /ws/{client_id}/output | Audio stream from meeting | Used by MeetingBaas |
| WebSocket /ws/{client_id}/input | Audio stream to meeting | Used by MeetingBaas |
| WebSocket /pipecat/{client_id} | Pipecat connection | Internal use |

Important constraints:
- /bots returns only MeetingBaas bot_id. The internal client_id is not returned.
- There is no session, partner, or consent storage in the backend today.
- Real-time UI events (balance, interventions) are not emitted to a frontend.

### 11.2 Backend Additions Required for the UX
Minimum additions for alpha UI:
- Session persistence (in-memory for alpha, database for production)
- Consent and invitation tracking
- Session lifecycle endpoints
- Real-time event stream for UI metrics and interventions

Recommended new endpoints:
- POST /sessions
- GET /sessions/{session_id}
- POST /sessions/{session_id}/consent
- POST /sessions/{session_id}/start
- POST /sessions/{session_id}/end
- GET /sessions/{session_id}/summary
- GET /sessions/{session_id}/transcript (optional)

Backend adjustments:
- Extend /bots response to include client_id and websocket_url
- Store mapping of session_id -> bot_id, client_id
- Emit UI events from Pipecat (balance updates, interventions, time remaining)

### 11.3 Real-Time Event Stream
Add a WebSocket or SSE endpoint, for example:
- WebSocket /sessions/{session_id}/events

Suggested event types:
- session_state
- balance_update
- intervention
- escalation
- time_remaining
- goal_drift

### 11.4 Frontend Architecture
Recommended structure (new folder to avoid conflict with backend app/):
- web/
  - src/
    - pages/
    - components/
    - features/sessions/
    - features/invitations/
    - features/live/
    - api/
    - state/

Recommended stack (flexible):
- TypeScript + React (Vite or Next.js)
- API layer with typed client
- WebSocket hook for live events

### 11.5 Flow-to-API Mapping
Create session:
1. User completes wizard in UI.
2. POST /sessions stores goal, relationship context, facilitator config.
3. Backend returns session_id and invite link.

Consent:
1. Invitee opens link and accepts.
2. POST /sessions/{id}/consent updates consent state.

Start session:
1. UI collects meeting_url when External Platform is selected.
2. POST /sessions/{id}/start calls /bots with meeting_url and persona.
3. Backend returns bot_id and client_id.
4. UI opens meeting_url in a new tab and shows Live Facilitation Room.

Live session:
1. UI connects to /sessions/{id}/events.
2. UI renders balance, AI status, interventions.

End session:
1. POST /sessions/{id}/end calls DELETE /bots/{bot_id}.
2. Backend generates summary and stores it.

Post-session:
- GET /sessions/{id}/summary and /transcript for recap views.

### 11.6 Alpha Build Plan Using Current Code
If backend changes are not ready, use a demo path:
- UI asks for meeting_url directly and calls POST /bots.
- Use local mock data for consent, summary, and interventions.
- Add a toggle to simulate balance updates for UI testing.
- Replace mocks with live events as backend support lands.

## 12. Open Questions and Risks
- How will user authentication be handled (email magic link, SSO, or internal only)?
- Will Diadi ship with a native video provider or remain external only for alpha?
- What is the first meeting platform to support (Zoom vs Meet vs Teams)?
- What data is retained by default for summaries and transcripts?
- How will we validate that interventions are not intrusive in early pilots?
