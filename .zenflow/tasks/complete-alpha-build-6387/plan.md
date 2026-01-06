# Diadi Alpha Build - Implementation Plan

## Configuration
- **Artifacts Path**: `.zenflow/tasks/complete-alpha-build-6387`
- **Requirements**: [requirements.md](./requirements.md)
- **Technical Spec**: [spec.md](./spec.md)

---

## Task Assessment

**Difficulty**: Hard
- Complex full-stack application (Next.js frontend + FastAPI backend extensions)
- Real-time WebSocket communication for live session events
- Multi-phase implementation with many interconnected components
- Integration with existing MeetingBaas/Pipecat infrastructure

---

## Workflow Steps

### [x] Step: Technical Specification

Technical specification has been created based on the comprehensive requirements from the Diadi documentation.

**Artifacts created:**
- `spec.md` - Full technical specification
- `requirements.md` - Consolidated requirements document

---

## Phase 1: Backend Foundation

### [x] Step: 1.1 Session Data Models
<!-- chat-id: b8253907-5461-41cc-aff4-4f698540ab30 -->

Add Session Pydantic models to `app/models.py`.

**Tasks:**
- Add `SessionStatus` enum (draft, pending_consent, ready, in_progress, paused, ended, archived)
- Add `Platform` enum (zoom, meet, teams, diadi)
- Add `FacilitatorPersona` enum (neutral_mediator, deep_empath, decision_catalyst)
- Add `Participant` model (id, name, role, consented)
- Add `FacilitatorConfig` model (persona, interrupt_authority, direct_inquiry, silence_detection)
- Add `Session` model with all fields from spec
- Add request/response models: `CreateSessionRequest`, `CreateSessionResponse`, `ConsentRequest`, `ConsentResponse`, `StartSessionRequest`, `StartSessionResponse`

**Reference:** spec.md Section 5.1 Backend Models

**Verification:**
```bash
ruff check app/models.py
ruff format app/models.py
```

**Completed:** All session data models added to `app/models.py`:
- Enums: `SessionStatus`, `Platform`, `FacilitatorPersona`
- Models: `Participant`, `FacilitatorConfig`, `Session`, `TalkBalanceMetrics`, `InterventionRecord`, `SessionSummary`
- Request/Response: `CreateSessionRequest`, `CreateSessionResponse`, `ConsentRequest`, `ConsentResponse`, `StartSessionRequest`, `StartSessionResponse`, `SessionEventPayload`

### [x] Step: 1.2 Session Store
<!-- chat-id: fdb5b17f-06cb-408d-8621-1b0b68719dbe -->

Create `core/session_store.py` for in-memory session storage.

**Tasks:**
- Create `SESSION_STORE: Dict[str, Session]` global dictionary
- Create `SESSION_EVENTS: Dict[str, list]` for WebSocket connections
- Add helper functions for session CRUD operations

**Reference:** spec.md Section 4.3 Session Store

**Verification:**
```bash
ruff check core/session_store.py
```

**Completed:** Created `core/session_store.py` with:
- `SESSION_STORE: Dict[str, Session]` - In-memory session storage
- `SESSION_EVENTS: Dict[str, List[WebSocket]]` - WebSocket connections per session
- Helper functions: `get_session()`, `get_session_by_invite_token()`, `create_session()`, `update_session()`, `delete_session()`, `list_sessions()`
- WebSocket management: `register_event_connection()`, `unregister_event_connection()`, `get_event_connections()`, `broadcast_session_event()`
- Verified with `ruff check` - All checks passed

### [x] Step: 1.3 Session Service Skeleton
<!-- chat-id: 6bceb4f8-1ace-407c-8ca2-0e2a8274f7a6 -->

Create `app/services/session_service.py` with basic structure.

**Tasks:**
- Create `SessionService` class
- Implement `create_session()` method (generate session_id, invite_token, store in SESSION_STORE)
- Implement `get_session()` method
- Implement `list_sessions()` method
- Add placeholder methods for: `record_consent()`, `start_session()`, `end_session()`, `pause_facilitation()`, `resume_facilitation()`

**Reference:** spec.md Section 4.2 Session Service

**Verification:**
```bash
ruff check app/services/session_service.py
```

**Completed:** Created `app/services/session_service.py` with:
- `SessionService` class with full session lifecycle management
- `create_session()` - generates session_id, invite_token, stores in SESSION_STORE
- `get_session()` and `get_session_by_invite_token()` - retrieval methods
- `list_sessions()` - list all sessions with optional status filter
- `record_consent()` - handle partner consent and status transitions
- `start_session()` - placeholder for session start (Phase 5)
- `end_session()` - placeholder for session end (Phase 8)
- `pause_facilitation()` and `resume_facilitation()` - kill switch support
- `_generate_summary()` and `_notify_pipecat()` - internal helper placeholders
- Global `session_service` instance for easy import
- Verified with `ruff check` and `ruff format` - All checks passed

### [ ] Step: 1.4 Session CRUD Routes

Add session management routes to `app/routes.py`.

**Tasks:**
- Add `POST /sessions` endpoint (create session)
- Add `GET /sessions` endpoint (list sessions with optional status filter)
- Add `GET /sessions/{id}` endpoint (get single session)
- Add proper error handling (404 for not found, 400 for validation errors)

**Reference:** spec.md Section 6.1 Session Endpoints

**Verification:**
```bash
ruff check app/routes.py
```

### [ ] Step: 1.5 Extend /bots Response

Modify existing `/bots` endpoint to return `client_id`.

**Tasks:**
- Update `JoinResponse` model to include `client_id` field
- Update `/bots` route to return the generated `bot_client_id`

**Reference:** spec.md Section 6.1

**Verification:**
```bash
ruff check app/routes.py
```

### [ ] Step: 1.6 Create Diadi Personas

Create three new personas in `config/personas/`.

**Tasks:**
- Create `config/personas/neutral_mediator/README.md`
- Create `config/personas/deep_empath/README.md`
- Create `config/personas/decision_catalyst/README.md`
- Each with: name, prompt, entry_message, metadata (gender, voice placeholder)

**Reference:** spec.md Section 8.1 New Personas

**Verification:**
- Verify personas load via PersonaManager

---

## Phase 2: Frontend Foundation

### [ ] Step: 2.1 Initialize Next.js Project

Set up Next.js 14 project in `web/` directory.

**Tasks:**
- Run `npx create-next-app@14 web --typescript --tailwind --eslint --app --src-dir`
- Configure `tsconfig.json` with strict mode
- Add `.gitignore` entries for `node_modules/`, `.next/`, etc.
- Install dependencies: `zustand`, `@tanstack/react-query`, `zod`
- Configure TanStack Query provider in `app/layout.tsx`
- Create `.env.local` with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`

**Verification:**
```bash
cd web && npm run build
```

### [ ] Step: 2.2 Configure Tailwind Theme

Set up Diadi design system in Tailwind.

**Tasks:**
- Update `tailwind.config.ts` with Diadi color palette
- Add custom border-radius tokens
- Configure font families
- Add status colors

**Reference:** spec.md Section 3.2 Design System Implementation

### [ ] Step: 2.3 Install and Configure shadcn/ui

Set up component library.

**Tasks:**
- Run `npx shadcn-ui@latest init`
- Install base components: button, card, input, dialog, toggle, form
- Customize components for Diadi style

**Verification:**
```bash
cd web && npm run build
```

### [ ] Step: 2.4 Create API Client

Set up API client in `lib/api/`.

**Tasks:**
- Create `lib/api/client.ts` with base fetch wrapper
- Create `lib/api/sessions.ts` with session API functions
- Create `lib/api/types.ts` with API response types

**Reference:** spec.md Section 6.1 API Contracts

**Verification:**
```bash
cd web && npm run type-check
```

### [ ] Step: 2.5 Define TypeScript Types

Create type definitions in `types/`.

**Tasks:**
- Create `types/session.ts`
- Create `types/intervention.ts`
- Create `types/events.ts`

**Reference:** spec.md Section 5.2 Frontend Types

**Verification:**
```bash
cd web && npm run type-check
```

### [ ] Step: 2.6 Implement Navigation Components

Build responsive navigation.

**Tasks:**
- Create `components/navigation/mobile-nav.tsx`
- Create `components/navigation/side-rail.tsx`
- Create `components/navigation/nav-item.tsx`
- Implement responsive behavior

**Reference:** requirements.md Section 6.2 Navigation Design

### [ ] Step: 2.7 Create Hub Page

Build main hub/dashboard page.

**Tasks:**
- Create `app/(dashboard)/hub/page.tsx`
- Create `components/hub/active-session-card.tsx`
- Create `components/hub/recent-sessions-list.tsx`
- Create `components/hub/search-bar.tsx`
- Create `components/common/empty-state.tsx`

**Reference:** requirements.md Section 6.3 Hub Screen Design

---

## Phase 3: Session Creation

### [ ] Step: 3.1 Wizard State Management

Create wizard form state context.

**Tasks:**
- Create `components/session/wizard/wizard-provider.tsx` with React Context
- Define wizard state: currentStep, formData for each step
- Add navigation functions: nextStep, prevStep, setStepData

**Verification:**
```bash
cd web && npm run type-check
```

### [ ] Step: 3.2 Step 0 - Identity & Bond

Build first wizard step.

**Tasks:**
- Create `components/session/wizard/step-identity.tsx`
- Add form fields: Partner's Name, Relationship Context
- Add Zod validation schema

**Reference:** requirements.md Section 6.4 Step 0

### [ ] Step: 3.3 Step 1 - Session Goal

Build goal step.

**Tasks:**
- Create `components/session/wizard/step-goal.tsx`
- Add form fields: Goal text, Schedule, Duration dropdown
- Add character counter for goal

**Reference:** requirements.md Section 6.4

### [ ] Step: 3.4 Step 2 - Facilitator Calibration

Build facilitator selection step.

**Tasks:**
- Create `components/session/wizard/step-facilitator.tsx`
- Create `components/session/persona-selector.tsx`
- Create `components/session/parameter-toggles.tsx`

**Reference:** requirements.md Section 6.4 Step 2

### [ ] Step: 3.5 Step 3 - Review & Connect

Build review step.

**Tasks:**
- Create `components/session/wizard/step-review.tsx`
- Display summary of all entered data
- Show edit links to return to previous steps

### [ ] Step: 3.6 Step 4 - Launch Hub

Build final launch step.

**Tasks:**
- Create `components/session/wizard/step-launch.tsx`
- Generate and display invite link
- Add platform selection dropdown
- Add meeting URL input field

### [ ] Step: 3.7 Session Creation Page

Assemble wizard into page.

**Tasks:**
- Create `app/(dashboard)/sessions/new/page.tsx`
- Integrate WizardProvider
- Wire up API call on completion (POST /sessions)
- Redirect to session detail page on success

**Reference:** spec.md Section 6.1 POST /sessions

---

## Phase 4: Invitation & Consent

### [ ] Step: 4.1 Invite Token & Consent Backend

Add invite token lookup and consent routes to backend.

**Tasks:**
- Add `GET /sessions/invite/{invite_token}` endpoint
- Implement `get_session_by_token()` in SessionService
- Add `POST /sessions/{id}/consent` endpoint
- Implement `record_consent()` in SessionService
- Update session status on dual consent

**Reference:** spec.md Section 6.1 Session Endpoints

**Verification:**
```bash
ruff check app/routes.py app/services/session_service.py
```

### [ ] Step: 4.2 Invite Page

Build partner invitation page.

**Tasks:**
- Create `app/invite/[token]/page.tsx`
- Fetch session data using invite token
- Display: Goal, Schedule, Duration, AI consent explanation
- Create `components/session/consent-form.tsx`

**Reference:** requirements.md Section 6.5 Partner Invitation Design

### [ ] Step: 4.3 Consent Form Component

Build consent UI.

**Tasks:**
- Display consent information
- Add Accept button
- Add "Decline Privately" link

**Reference:** requirements.md Section 7.3 Consent Information

### [ ] Step: 4.4 Waiting Room Component

Build waiting room UI.

**Tasks:**
- Create `components/session/waiting-room.tsx`
- Display readiness status
- Show partner status
- Add copy invite link button

**Reference:** requirements.md Section 6.6 Waiting Room Design

---

## Phase 5: Live Session Infrastructure

### [ ] Step: 5.1 Session Start Backend

Implement session start logic.

**Tasks:**
- Add `POST /sessions/{id}/start` endpoint
- Implement `start_session()` in SessionService
- Call `create_meeting_bot()` and `start_pipecat_process()`
- Update session status to in_progress

**Reference:** spec.md Section 4.2 start_session()

### [ ] Step: 5.2 Session Events WebSocket

Add WebSocket endpoint for session events.

**Tasks:**
- Add `WS /sessions/{session_id}/events` endpoint
- Register connection in SESSION_EVENTS
- Send initial session state on connect
- Implement `broadcast_session_event()` helper

**Reference:** spec.md Section 7.1 WebSocket Handler Extension

### [ ] Step: 5.3 Balance Tracker Module

Create balance tracking logic.

**Tasks:**
- Create `core/balance_tracker.py`
- Implement `SpeakerMetrics` dataclass
- Implement `BalanceTracker` class

**Reference:** spec.md Section 4.4 Balance Tracker

### [ ] Step: 5.4 Frontend WebSocket Hook

Create WebSocket hook for session events.

**Tasks:**
- Create `hooks/use-session-events.ts`
- Implement connection with reconnection logic
- Handle event types: balance_update, intervention, time_remaining, session_state

**Reference:** spec.md Section 7.3 Frontend WebSocket Hook

### [ ] Step: 5.5 Session UI Store

Create Zustand store for live session state.

**Tasks:**
- Create `stores/session-store.ts`
- Add state and actions

**Reference:** spec.md Section 3.4 State Management

---

## Phase 6: Live Session UI

### [ ] Step: 6.1 Talk Balance Component

Build real-time balance indicator.

**Tasks:**
- Create `components/live/talk-balance.tsx`
- Display horizontal bicolor bar
- Show participant names and percentages

**Reference:** requirements.md Section 6.7 Active Session Design

### [ ] Step: 6.2 AI Status Indicator

Build AI status display.

**Tasks:**
- Create `components/live/ai-status-indicator.tsx`
- Show status: Listening, Preparing, Intervening, Paused
- Add animated states

**Reference:** spec.md Section 3.3 AIStatusIndicator Component

### [ ] Step: 6.3 Session Timer

Build countdown timer.

**Tasks:**
- Create `components/live/session-timer.tsx`
- Display elapsed time and time remaining

### [ ] Step: 6.4 Live Facilitation Room Page

Assemble live session page.

**Tasks:**
- Create `app/(dashboard)/sessions/[id]/live/page.tsx`
- Integrate WebSocket hook
- Layout: TalkBalance, Timer, AIStatus, GoalSnippet

**Reference:** requirements.md Section 6.7 Active Session Design

---

## Phase 7: Intervention System

### [ ] Step: 7.1 Intervention Engine

Create backend intervention logic.

**Tasks:**
- Create `core/intervention_engine.py`
- Implement intervention types and blockers
- Configure thresholds from requirements

**Reference:** spec.md Section 4.5 Intervention Engine

### [ ] Step: 7.2 Intervention Store

Create frontend intervention queue.

**Tasks:**
- Create `stores/intervention-store.ts`
- Add state: queue, current intervention

### [ ] Step: 7.3 Intervention Overlay Component

Build intervention display.

**Tasks:**
- Create `components/intervention/intervention-overlay.tsx`
- Render based on intervention type

**Reference:** requirements.md Section 6.8 Intervention UI Design

### [ ] Step: 7.4 Intervention Variants

Build specific intervention UIs.

**Tasks:**
- Create balance, silence, time, escalation prompts
- Create icebreaker modal

**Reference:** requirements.md Section 7.6 Intervention Templates

---

## Phase 8: Kill Switch & Session End

### [ ] Step: 8.1 Pause/Resume Backend

Add pause/resume endpoints.

**Tasks:**
- Add `POST /sessions/{id}/pause` endpoint
- Add `POST /sessions/{id}/resume` endpoint

**Reference:** spec.md Section 6.1 Pause/Resume endpoints

### [ ] Step: 8.2 Kill Switch Component

Build pause facilitation UI.

**Tasks:**
- Create `components/live/kill-switch.tsx`
- Immediate effect button (no confirmation)

**Reference:** requirements.md Section 7.7 Kill Switch Requirements

### [ ] Step: 8.3 Session End Backend

Implement session end logic.

**Tasks:**
- Add `POST /sessions/{id}/end` endpoint
- Terminate Pipecat process
- Call `leave_meeting_bot()`

**Reference:** spec.md Section 4.2 end_session()

---

## Phase 9: Post-Session

### [ ] Step: 9.1 Summary Generation Service

Create summary generation logic.

**Tasks:**
- Create `app/services/summary_service.py`
- Implement `generate_summary()` using OpenAI

**Reference:** spec.md Section 4.2 _generate_summary()

### [ ] Step: 9.2 Summary Endpoint

Add summary retrieval endpoint.

**Tasks:**
- Add `GET /sessions/{id}/summary` endpoint

**Reference:** spec.md Section 6.1 GET /sessions/{id}/summary

### [ ] Step: 9.3 Post-Session Recap UI

Build recap components.

**Tasks:**
- Create synthesis board, key agreements, action items components
- Create rating prompt

**Reference:** requirements.md Section 6.9 Post-Session Recap Design

### [ ] Step: 9.4 Session Detail Page

Build unified session detail page.

**Tasks:**
- Update `app/(dashboard)/sessions/[id]/page.tsx`
- Show pre-session, live redirect, or post-session view based on status

---

## Phase 10: Polish & Testing

### [ ] Step: 10.1 Responsive Testing

Verify mobile/desktop layouts.

**Tasks:**
- Test all pages at 360x640 (mobile) and 1280x720 (desktop)
- Fix any layout issues

### [ ] Step: 10.2 Accessibility Audit

Ensure accessibility compliance.

**Tasks:**
- Run Lighthouse accessibility audit
- Fix contrast issues
- Add keyboard navigation

**Reference:** requirements.md Section 11.2 Accessibility

### [ ] Step: 10.3 Error Handling

Implement error states.

**Tasks:**
- Add error boundaries
- Create fallback UI for WebSocket disconnect
- Handle API errors gracefully

**Reference:** spec.md Section 11.4 Reliability

### [ ] Step: 10.4 Performance Optimization

Optimize bundle and load times.

**Tasks:**
- Run bundle analysis
- Add code splitting
- Lazy load session detail pages

**Reference:** requirements.md Section 11.1 Performance

### [ ] Step: 10.5 Integration Testing

Test complete flows.

**Tasks:**
- Test session creation → invite → consent → start → end → summary flow
- Test kill switch functionality
- Test WebSocket reconnection

---

## Test Results

*Record test results here as implementation progresses*

### Backend
- [ ] `ruff check .` - PENDING
- [ ] `ruff format .` - PENDING
- [ ] Session CRUD endpoints tested - PENDING
- [ ] WebSocket events tested - PENDING

### Frontend
- [ ] `npm run lint` - PENDING
- [ ] `npm run type-check` - PENDING
- [ ] `npm run build` - PENDING
- [ ] Lighthouse accessibility - PENDING
- [ ] Bundle size check - PENDING
