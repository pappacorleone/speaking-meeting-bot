# Full SDD workflow

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Workflow Steps

### [x] Step: Requirements
<!-- chat-id: eb417253-b54f-41ba-a960-4738ee94a47e -->

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `{@artifacts_path}/requirements.md`.

### [x] Step: Technical Specification
<!-- chat-id: fc2ad9b7-c379-4f61-9c4f-8bee7feceabf -->

Create a technical specification based on the PRD in `{@artifacts_path}/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `{@artifacts_path}/spec.md` with:
- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

### [x] Step: Planning

Create a detailed implementation plan based on `{@artifacts_path}/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

---

## Implementation Plan

### Phase 1: Backend Foundation

#### [x] Step 1.1: Session Data Models
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

#### [x] Step 1.2: Session Store
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

#### [x] Step 1.3: Session Service Skeleton
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

#### [x] Step 1.4: Session CRUD Routes
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
# Manual test: curl -X POST http://localhost:7014/sessions -H "Content-Type: application/json" -d '{"goal": "Test", "relationshipContext": "Test", "partnerName": "Partner"}'
```

#### [ ] Step 1.5: Extend /bots Response
Modify existing `/bots` endpoint to return `client_id`.

**Tasks:**
- Update `JoinResponse` model to include `client_id` field
- Update `/bots` route to return the generated `bot_client_id`

**Reference:** spec.md Section 6.1

**Verification:**
```bash
ruff check app/routes.py
```

#### [ ] Step 1.6: Create Diadi Personas
Create three new personas in `config/personas/`.

**Tasks:**
- Create `config/personas/neutral_mediator/README.md`
- Create `config/personas/deep_empath/README.md`
- Create `config/personas/decision_catalyst/README.md`
- Each with: name, prompt, entry_message, metadata (gender, voice placeholder)

**Reference:** spec.md Section 8.1 New Personas

**Verification:**
- Verify personas load via PersonaManager
- Check `python -c "from config.persona_utils import PersonaManager; pm = PersonaManager(); print(pm.get_persona('neutral_mediator'))"`

---

### Phase 2: Frontend Foundation

#### [ ] Step 2.1: Initialize Next.js Project
Set up Next.js 14 project in `web/` directory.

**Tasks:**
- Run `npx create-next-app@14 web --typescript --tailwind --eslint --app --src-dir`
- Configure `tsconfig.json` with strict mode
- Add `.gitignore` entries for `node_modules/`, `.next/`, etc.
- Install dependencies: `zustand`, `@tanstack/react-query`, `zod`

**Verification:**
```bash
cd web && npm run build
```

#### [ ] Step 2.2: Configure Tailwind Theme
Set up Diadi design system in Tailwind.

**Tasks:**
- Update `tailwind.config.ts` with Diadi color palette (background: #F5F3EF, primary: #2D2D2D, secondary: #6B7B5C, etc.)
- Add custom border-radius tokens (card: 16px, button: 9999px)
- Configure font families (serif, sans)
- Add status colors (active: #4CAF50, warning: #F59E0B)

**Reference:** spec.md Section 3.2 Design System Implementation

**Verification:**
- Visual inspection of test page with theme colors

#### [ ] Step 2.3: Install and Configure shadcn/ui
Set up component library.

**Tasks:**
- Run `npx shadcn-ui@latest init`
- Install base components: button, card, input, dialog, toggle, form
- Customize components for Diadi style (pill buttons, rounded cards)

**Verification:**
```bash
cd web && npm run build
```

#### [ ] Step 2.4: Create API Client
Set up API client in `lib/api/`.

**Tasks:**
- Create `lib/api/client.ts` with base fetch wrapper
- Create `lib/api/sessions.ts` with session API functions
- Create `lib/api/types.ts` with API response types
- Handle error responses consistently

**Reference:** spec.md Section 6.1 API Contracts

**Verification:**
```bash
cd web && npm run type-check
```

#### [ ] Step 2.5: Define TypeScript Types
Create type definitions in `types/`.

**Tasks:**
- Create `types/session.ts` (Session, Participant, FacilitatorConfig, etc.)
- Create `types/intervention.ts` (InterventionType, Intervention)
- Create `types/events.ts` (SessionEvent, BalanceUpdateEvent, etc.)

**Reference:** spec.md Section 5.2 Frontend Types

**Verification:**
```bash
cd web && npm run type-check
```

#### [ ] Step 2.6: Implement Navigation Components
Build responsive navigation.

**Tasks:**
- Create `components/navigation/mobile-nav.tsx` (bottom bar with Home, New Session, People)
- Create `components/navigation/side-rail.tsx` (desktop sidebar, collapsed/expanded)
- Create `components/navigation/nav-item.tsx` (shared nav item component)
- Implement responsive behavior (mobile <768px, desktop >=768px)

**Reference:** requirements.md Section 6.2 Navigation Design

**Verification:**
- Visual inspection at 360px and 1280px widths

#### [ ] Step 2.7: Create Hub Page
Build main hub/dashboard page.

**Tasks:**
- Create `app/(dashboard)/hub/page.tsx`
- Create `components/hub/active-session-card.tsx`
- Create `components/hub/recent-sessions-list.tsx`
- Create `components/hub/search-bar.tsx`
- Create `components/common/empty-state.tsx`
- Implement empty states for no sessions

**Reference:** requirements.md Section 6.3 Hub Screen Design

**Verification:**
- Visual inspection matching mockups in `docs/Diadi screens/hub/`
- Empty state displays when no sessions

---

### Phase 3: Session Creation

#### [ ] Step 3.1: Wizard State Management
Create wizard form state context.

**Tasks:**
- Create `components/session/wizard/wizard-provider.tsx` with React Context
- Define wizard state: currentStep, formData for each step
- Add navigation functions: nextStep, prevStep, setStepData
- Persist state across step navigation

**Verification:**
```bash
cd web && npm run type-check
```

#### [ ] Step 3.2: Step 0 - Identity & Bond
Build first wizard step.

**Tasks:**
- Create `components/session/wizard/step-identity.tsx`
- Add form fields: Partner's Name (text), Relationship Context (textarea)
- Add Zod validation schema
- Style per mockup (step indicator, headline, CTA button)

**Reference:** requirements.md Section 6.4 Step 0

**Verification:**
- Form validation works
- Visual match to mockup

#### [ ] Step 3.3: Step 1 - Session Goal
Build goal step.

**Tasks:**
- Create `components/session/wizard/step-goal.tsx`
- Add form fields: Goal text (max 200 chars), Schedule (now/later), Duration dropdown
- Add character counter for goal
- Add date/time picker for scheduled sessions

**Reference:** requirements.md Section 6.4

**Verification:**
- Character limit enforced
- Schedule picker works

#### [ ] Step 3.4: Step 2 - Facilitator Calibration
Build facilitator selection step.

**Tasks:**
- Create `components/session/wizard/step-facilitator.tsx`
- Create `components/session/persona-selector.tsx` (radio cards for 3 personas)
- Create `components/session/parameter-toggles.tsx` (interrupt authority, direct inquiry, silence detection)
- Style persona cards with icons and selection states

**Reference:** requirements.md Section 6.4 Step 2

**Verification:**
- Persona selection updates state
- Toggle switches work
- Visual match to mockup

#### [ ] Step 3.5: Step 3 - Review & Connect
Build review step.

**Tasks:**
- Create `components/session/wizard/step-review.tsx`
- Display summary of all entered data
- Show edit links to return to previous steps
- Preview invitation text

**Verification:**
- All data from previous steps displayed correctly

#### [ ] Step 3.6: Step 4 - Launch Hub
Build final launch step.

**Tasks:**
- Create `components/session/wizard/step-launch.tsx`
- Generate and display invite link (copy button)
- Add platform selection dropdown (Zoom, Meet, Teams)
- Add meeting URL input field
- Add "Launch Session" CTA

**Verification:**
- Invite link can be copied
- Platform selection works

#### [ ] Step 3.7: Session Creation Page
Assemble wizard into page.

**Tasks:**
- Create `app/(dashboard)/sessions/new/page.tsx`
- Integrate WizardProvider
- Wire up API call on completion (POST /sessions)
- Redirect to session detail page on success

**Reference:** spec.md Section 6.1 POST /sessions

**Verification:**
- Complete wizard flow creates session via API
- Session appears in Hub

---

### Phase 4: Invitation & Consent

#### [ ] Step 4.1: Consent Backend Endpoints
Add consent routes to backend.

**Tasks:**
- Add `POST /sessions/{id}/consent` endpoint
- Implement `record_consent()` in SessionService
- Update session status on dual consent (pending_consent → ready)
- Handle decline privately (archive session without notifying creator)

**Reference:** spec.md Section 6.1 POST /sessions/{id}/consent

**Verification:**
```bash
ruff check app/routes.py app/services/session_service.py
# Manual test consent flow
```

#### [ ] Step 4.2: Invite Page
Build partner invitation page.

**Tasks:**
- Create `app/invite/[token]/page.tsx`
- Fetch session data using invite token
- Display: Goal, Schedule, Duration, AI consent explanation
- Create `components/session/consent-form.tsx`

**Reference:** requirements.md Section 6.5 Partner Invitation Design

**Verification:**
- Page loads with valid token
- Shows 404 for invalid token
- Visual match to mockup

#### [ ] Step 4.3: Consent Form Component
Build consent UI.

**Tasks:**
- Display consent information ("An AI will observe...", "BOTH of you see the same info", etc.)
- Add Accept button (calls POST /sessions/{id}/consent with consented: true)
- Add "Decline Privately" link (calls with consented: false)
- Add invitee name input

**Reference:** requirements.md Section 7.3 Consent Information

**Verification:**
- Accept updates session status
- Decline is private (no notification)

#### [ ] Step 4.4: Waiting Room Component
Build waiting room UI.

**Tasks:**
- Create `components/session/waiting-room.tsx`
- Display readiness status (Mic, Agent, Partner)
- Show partner status (waiting, joining, joined)
- Add copy invite link button
- Add "Open Meeting" button for external platforms

**Reference:** requirements.md Section 6.6 Waiting Room Design

**Verification:**
- Status indicators update correctly
- Transitions to live room when both ready

---

### Phase 5: Live Session Infrastructure

#### [ ] Step 5.1: Session Start Backend
Implement session start logic.

**Tasks:**
- Add `POST /sessions/{id}/start` endpoint
- Implement `start_session()` in SessionService:
  - Load persona via PersonaManager
  - Call `create_meeting_bot()` from meetingbaas_api
  - Call `start_pipecat_process()` from core/process.py
  - Update session status to in_progress
  - Return bot_id, client_id, event_url

**Reference:** spec.md Section 4.2 start_session()

**Verification:**
```bash
ruff check app/routes.py app/services/session_service.py
# Manual test: Start session and verify bot joins
```

#### [ ] Step 5.2: Session Events WebSocket
Add WebSocket endpoint for session events.

**Tasks:**
- Add `WS /sessions/{session_id}/events` endpoint in `app/websockets.py`
- Register connection in SESSION_EVENTS
- Send initial session state on connect
- Handle client messages (ping, update_settings, intervention_ack)
- Implement `broadcast_session_event()` helper function

**Reference:** spec.md Section 7.1 WebSocket Handler Extension

**Verification:**
- WebSocket connects successfully
- Receives initial state message

#### [ ] Step 5.3: Balance Tracker Module
Create balance tracking logic.

**Tasks:**
- Create `core/balance_tracker.py`
- Implement `SpeakerMetrics` dataclass
- Implement `BalanceTracker` class with:
  - `update_speaker()` method
  - `get_balance()` method (returns percentages and status)
  - `check_intervention_trigger()` method

**Reference:** spec.md Section 4.4 Balance Tracker

**Verification:**
```bash
ruff check core/balance_tracker.py
# Unit test balance calculations
```

#### [ ] Step 5.4: Frontend WebSocket Hook
Create WebSocket hook for session events.

**Tasks:**
- Create `hooks/use-session-events.ts`
- Implement connection with reconnection logic (exponential backoff)
- Handle event types: balance_update, intervention, time_remaining, session_state
- Update Zustand stores on events

**Reference:** spec.md Section 7.3 Frontend WebSocket Hook

**Verification:**
```bash
cd web && npm run type-check
```

#### [ ] Step 5.5: Session UI Store
Create Zustand store for live session state.

**Tasks:**
- Create `stores/session-store.ts`
- Add state: isConnected, balance, aiStatus, timeRemaining, facilitatorPaused, etc.
- Add actions: setBalance, setAIStatus, setTimeRemaining, toggleFacilitator

**Reference:** spec.md Section 3.4 State Management

**Verification:**
```bash
cd web && npm run type-check
```

---

### Phase 6: Live Session UI

#### [ ] Step 6.1: Talk Balance Component
Build real-time balance indicator.

**Tasks:**
- Create `components/live/talk-balance.tsx`
- Display horizontal bicolor bar
- Show participant names and percentages
- Color code based on status (balanced: green, mild: yellow, severe: red)
- Update in real-time from WebSocket events

**Reference:** requirements.md Section 6.7 Active Session Design

**Verification:**
- Updates every 1-2 seconds
- Colors change based on balance status

#### [ ] Step 6.2: AI Status Indicator
Build AI status display.

**Tasks:**
- Create `components/live/ai-status-indicator.tsx`
- Show status: Listening, Preparing, Intervening, Paused
- Add animated states (pulse for listening, spinner for preparing)
- Update from session store

**Reference:** spec.md Section 3.3 AIStatusIndicator Component

**Verification:**
- All states display correctly
- Animations smooth

#### [ ] Step 6.3: Session Timer
Build countdown timer.

**Tasks:**
- Create `components/live/session-timer.tsx`
- Display elapsed time and time remaining
- Update from time_remaining WebSocket events
- Highlight when <5 minutes remaining

**Verification:**
- Timer counts correctly
- Warning state at 5 minutes

#### [ ] Step 6.4: Live Facilitation Room Page
Assemble live session page.

**Tasks:**
- Create `app/(dashboard)/sessions/[id]/live/page.tsx`
- Integrate WebSocket hook
- Layout: TalkBalance (top), Timer, AIStatus, GoalSnippet
- Add controls bar at bottom

**Reference:** requirements.md Section 6.7 Active Session Design

**Verification:**
- All components render
- Real-time updates work

---

### Phase 7: Intervention System

#### [ ] Step 7.1: Intervention Engine
Create backend intervention logic.

**Tasks:**
- Create `core/intervention_engine.py`
- Implement `InterventionType` and `InterventionModality` enums
- Implement `Intervention` dataclass
- Implement `InterventionEngine` class with:
  - `can_intervene()` method (check blockers)
  - `evaluate()` method (check thresholds, return intervention if needed)
- Configure thresholds from requirements

**Reference:** spec.md Section 4.5 Intervention Engine

**Verification:**
```bash
ruff check core/intervention_engine.py
# Unit test intervention triggers
```

#### [ ] Step 7.2: Intervention Store
Create frontend intervention queue.

**Tasks:**
- Create `stores/intervention-store.ts`
- Add state: queue, current intervention
- Add actions: push, dismiss, clear
- Handle queue (show one at a time)

**Verification:**
```bash
cd web && npm run type-check
```

#### [ ] Step 7.3: Intervention Overlay Component
Build intervention display.

**Tasks:**
- Create `components/intervention/intervention-overlay.tsx`
- Render based on intervention type
- Add dismiss button/timeout for visual interventions
- Style per mockups

**Reference:** requirements.md Section 6.8 Intervention UI Design

**Verification:**
- Displays correctly for each type

#### [ ] Step 7.4: Intervention Variants
Build specific intervention UIs.

**Tasks:**
- Create `components/intervention/balance-prompt.tsx`
- Create `components/intervention/silence-prompt.tsx`
- Create `components/intervention/time-warning.tsx`
- Create `components/intervention/escalation-alert.tsx` (P1)
- Create `components/intervention/icebreaker-modal.tsx`

**Reference:** requirements.md Section 7.6 Intervention Templates

**Verification:**
- Each variant matches mockup design

---

### Phase 8: Kill Switch & Session End

#### [ ] Step 8.1: Pause/Resume Backend
Add pause/resume endpoints.

**Tasks:**
- Add `POST /sessions/{id}/pause` endpoint
- Add `POST /sessions/{id}/resume` endpoint
- Implement `pause_facilitation()` and `resume_facilitation()` in SessionService
- Notify Pipecat process to stop/resume interventions

**Reference:** spec.md Section 6.1 Pause/Resume endpoints

**Verification:**
```bash
ruff check app/routes.py app/services/session_service.py
```

#### [ ] Step 8.2: Kill Switch Component
Build pause facilitation UI.

**Tasks:**
- Create `components/live/kill-switch.tsx`
- Immediate effect button (no confirmation per requirements)
- Show confirmation modal for re-enable
- Notify both participants of pause state

**Reference:** requirements.md Section 7.7 Kill Switch Requirements

**Verification:**
- Pause is immediate
- Both users see paused state

#### [ ] Step 8.3: Session End Backend
Implement session end logic.

**Tasks:**
- Add `POST /sessions/{id}/end` endpoint
- Implement `end_session()` in SessionService:
  - Terminate Pipecat process
  - Call `leave_meeting_bot()`
  - Update session status to ended
  - Trigger summary generation (async)

**Reference:** spec.md Section 4.2 end_session()

**Verification:**
- Bot leaves meeting
- Session status updates

---

### Phase 9: Post-Session

#### [ ] Step 9.1: Summary Generation Service
Create summary generation logic.

**Tasks:**
- Create `app/services/summary_service.py`
- Implement `generate_summary()` using OpenAI
- Extract: consensus summary, key agreements, action items
- Store summary with session

**Reference:** spec.md Section 4.2 _generate_summary()

**Verification:**
```bash
ruff check app/services/summary_service.py
```

#### [ ] Step 9.2: Summary Endpoint
Add summary retrieval endpoint.

**Tasks:**
- Add `GET /sessions/{id}/summary` endpoint
- Return SessionSummary model
- Return 404 if summary not yet available

**Reference:** spec.md Section 6.1 GET /sessions/{id}/summary

**Verification:**
- Summary returns after session ends

#### [ ] Step 9.3: Post-Session Recap UI
Build recap components.

**Tasks:**
- Create `components/recap/synthesis-board.tsx`
- Create `components/recap/key-agreements.tsx`
- Create `components/recap/action-items.tsx`
- Create `components/recap/transcript-view.tsx` (P1 - if transcript available)
- Create `components/recap/rating-prompt.tsx`

**Reference:** requirements.md Section 6.9 Post-Session Recap Design

**Verification:**
- Summary displays correctly
- Rating can be submitted

#### [ ] Step 9.4: Session Detail Page
Build unified session detail page.

**Tasks:**
- Update `app/(dashboard)/sessions/[id]/page.tsx`
- Show pre-session view (waiting for consent, ready to launch)
- Show post-session view (recap, summary)
- Route to live page when session in_progress

**Verification:**
- Correct view based on session status

---

### Phase 10: Polish & Testing

#### [ ] Step 10.1: Responsive Testing
Verify mobile/desktop layouts.

**Tasks:**
- Test all pages at 360x640 (mobile)
- Test all pages at 1280x720 (desktop)
- Fix any layout issues
- Verify navigation works on both

**Verification:**
- All pages usable on both breakpoints

#### [ ] Step 10.2: Accessibility Audit
Ensure accessibility compliance.

**Tasks:**
- Run Lighthouse accessibility audit
- Fix contrast issues (target >=4.5:1)
- Add keyboard navigation to forms and dialogs
- Add screen reader labels to controls

**Reference:** requirements.md Section 11.2 Accessibility

**Verification:**
- Lighthouse accessibility score >=90

#### [ ] Step 10.3: Error Handling
Implement error states.

**Tasks:**
- Add error boundaries to React components
- Create fallback UI for WebSocket disconnect
- Handle API errors gracefully
- Add retry logic where appropriate

**Reference:** spec.md Section 11.4 Reliability

**Verification:**
- App recovers from API errors
- WebSocket reconnects automatically

#### [ ] Step 10.4: Performance Optimization
Optimize bundle and load times.

**Tasks:**
- Run `npm run analyze` to check bundle size
- Add code splitting for large components
- Lazy load session detail pages
- Optimize images

**Reference:** requirements.md Section 11.1 Performance

**Verification:**
- Initial bundle <500KB
- Page load <2s on broadband

#### [ ] Step 10.5: Integration Testing
Test complete flows.

**Tasks:**
- Test session creation → invite → consent → start → end → summary flow
- Test kill switch functionality
- Test WebSocket reconnection
- Test error scenarios

**Verification:**
- All critical flows work end-to-end

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
