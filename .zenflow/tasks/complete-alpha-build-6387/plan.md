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

### [x] Step: 1.4 Session CRUD Routes
<!-- chat-id: b52a39c9-9649-466d-8335-6b7368e58703 -->

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

**Completed:** Added session CRUD routes to `app/routes.py`:
- `POST /sessions` - Creates session with `CreateSessionRequest`, returns `CreateSessionResponse` with session_id, status, invite_link, and invite_token
- `GET /sessions` - Lists all sessions with optional `status_filter`, `limit`, and `offset` query params; returns paginated response with `sessions`, `total`, and `hasMore`
- `GET /sessions/{session_id}` - Returns single `Session` object or 404 if not found
- Proper error handling: 400 for validation errors, 404 for not found, 500 for server errors
- Verified with `ruff check` and `ruff format` - All checks passed (pre-existing issues in file not related to new code)

### [x] Step: 1.5 Extend /bots Response
<!-- chat-id: b0bb6d31-3b58-443b-b1e9-9efda954a126 -->

Modify existing `/bots` endpoint to return `client_id`.

**Tasks:**
- Update `JoinResponse` model to include `client_id` field
- Update `/bots` route to return the generated `bot_client_id`

**Reference:** spec.md Section 6.1

**Verification:**
```bash
ruff check app/routes.py
```

**Completed:** Extended `/bots` response to include `client_id`:
- Updated `JoinResponse` model in `app/models.py` to include `client_id: str` field with description
- Updated `/bots` route in `app/routes.py` to return both `bot_id` (MeetingBaas ID) and `client_id` (internal ID for WebSocket connections)
- Verified with `ruff check` - no new issues introduced (pre-existing issues in files are unrelated)

### [x] Step: 1.6 Create Diadi Personas
<!-- chat-id: b8854a64-2e5e-4109-b171-74e49c2346b0 -->

Create three new personas in `config/personas/`.

**Tasks:**
- Create `config/personas/neutral_mediator/README.md`
- Create `config/personas/deep_empath/README.md`
- Create `config/personas/decision_catalyst/README.md`
- Each with: name, prompt, entry_message, metadata (gender, voice placeholder)

**Reference:** spec.md Section 8.1 New Personas

**Verification:**
- Verify personas load via PersonaManager

**Completed:** Created three Diadi facilitator personas:
- `neutral_mediator/README.md` - Calm, balanced facilitator focused on fair dialogue. Gender: neutral. Entry message emphasizes support for both participants.
- `deep_empath/README.md` - Warm, emotionally attuned facilitator prioritizing emotional safety. Gender: female. Entry message focuses on creating safe space.
- `decision_catalyst/README.md` - Focused, action-oriented facilitator driving toward decisions. Gender: male. Entry message emphasizes staying focused and reaching outcomes.
- All personas follow the existing PersonaManager format with Core Behaviors, Intervention Style, and Metadata sections
- Voice IDs marked as TBD (matched at runtime via VoiceUtils)
- Images marked as TBD (generated at runtime via Replicate SDXL)

---

## Phase 2: Frontend Foundation

### [x] Step: 2.1 Initialize Next.js Project
<!-- chat-id: 25a639fe-9117-4af7-9c4f-d6227e7c1601 -->

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

**Completed:** Next.js 14 project initialized in `web/` directory:
- Created project with TypeScript, Tailwind, ESLint, App Router, and src directory
- Enhanced `tsconfig.json` with additional strict options: `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters`, `forceConsistentCasingInFileNames`
- Updated root `.gitignore` with Next.js-specific entries (node_modules, .next, .env.local, etc.)
- Installed dependencies: `zustand`, `@tanstack/react-query`, `zod`
- Created `src/providers/query-provider.tsx` with QueryClient configuration
- Updated `src/app/layout.tsx` to wrap children with QueryProvider
- Created `.env.local` with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`
- Created `.env.example` for documentation
- Verified build passes: `npm run build` ✓

### [x] Step: 2.2 Configure Tailwind Theme
<!-- chat-id: 40c0672f-f509-4899-ae84-e3e47b9566fd -->

Set up Diadi design system in Tailwind.

**Tasks:**
- Update `tailwind.config.ts` with Diadi color palette
- Add custom border-radius tokens
- Configure font families
- Add status colors

**Reference:** spec.md Section 3.2 Design System Implementation

**Completed:** Configured Tailwind with Diadi design system:
- Updated `tailwind.config.ts` with full color palette using HSL CSS variables for shadcn/ui compatibility:
  - Primary: Dark charcoal (#2D2D2D) for main CTAs
  - Secondary: Olive/sage green (#6B7B5C) for secondary actions
  - Background: Warm cream (#F5F3EF)
  - Status colors: active (green), warning (amber), error (red), info (blue)
  - Sidebar, card, popover, muted, accent, destructive colors
- Added custom border-radius tokens: `rounded-card` (16px) and `rounded-button` (pill-shaped)
- Configured font families: serif (for headlines) and sans (for body text)
- Added custom fontSize for section headers with letter-spacing
- Added box-shadow tokens: `shadow-card` and `shadow-elevated`
- Added animations: `glow` for AI intervention, `accordion-down/up` for shadcn/ui
- Updated `globals.css` with CSS custom properties in HSL format
- Added Diadi-specific component utility classes: `.btn-primary`, `.btn-secondary`, `.diadi-card`, `.section-header`, `.status-badge-*`
- Installed `tailwindcss-animate` plugin for shadcn/ui compatibility
- Verified build passes: `npm run build` ✓

### [x] Step: 2.3 Install and Configure shadcn/ui
<!-- chat-id: bc00a4b7-1037-4626-a210-468b43c09d4a -->

Set up component library.

**Tasks:**
- Run `npx shadcn-ui@latest init`
- Install base components: button, card, input, dialog, toggle, form
- Customize components for Diadi style

**Verification:**
```bash
cd web && npm run build
```

**Completed:** Installed and configured shadcn/ui with Diadi styling:
- Initialized shadcn/ui with `npx shadcn@latest init --defaults` (new-york style, neutral base)
- Created `components.json` configuration and `lib/utils.ts` with `cn()` helper
- Installed base components: button, card, input, dialog, toggle, form, label
- Customized Button component (`components/ui/button.tsx`):
  - Added `rounded-button` (pill-shaped) for default, destructive, outline, secondary variants
  - Added `uppercase tracking-widest` for Diadi CTA styling
  - Increased default size to `h-10 px-6`
- Customized Card component (`components/ui/card.tsx`):
  - Changed to `rounded-card` (16px) and `shadow-card`
  - Added `font-serif` to CardTitle for Diadi headlines
- Customized Input component (`components/ui/input.tsx`):
  - Changed to `h-10 rounded-lg bg-background px-4 py-2`
  - Enhanced focus ring with `ring-2 ring-offset-2`
- Customized Toggle component (`components/ui/toggle.tsx`):
  - Updated on-state to use secondary color (`bg-secondary text-secondary-foreground`)
  - Changed to `rounded-lg` with larger sizes
- Customized Dialog component (`components/ui/dialog.tsx`):
  - Changed to `rounded-card` and `shadow-elevated`
  - Added `font-serif` to DialogTitle
- Verified build passes: `npm run build` ✓

### [x] Step: 2.4 Create API Client
<!-- chat-id: 701e7d02-25de-4957-b19f-eeead4ff59df -->

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

**Completed:** Created API client in `web/src/lib/api/`:
- `types.ts` - All API response types matching backend Pydantic models:
  - Enums: `SessionStatus`, `Platform`, `FacilitatorPersona`, `ParticipantRole`
  - Models: `Session`, `Participant`, `FacilitatorConfig`, `TalkBalanceMetrics`, `InterventionRecord`, `SessionSummary`
  - Request types: `CreateSessionRequest`, `ConsentRequest`, `StartSessionRequest`
  - Response types: `CreateSessionResponse`, `ConsentResponse`, `StartSessionResponse`, `EndSessionResponse`, `PauseResumeResponse`, `ListSessionsResponse`
  - Error types: `ApiError`, `ApiRequestError` class
- `client.ts` - Base API client with fetch wrapper:
  - `ApiClient` class with request/get/post/put/patch/delete methods
  - Automatic JSON serialization/deserialization
  - API key header injection (`x-meeting-baas-api-key`)
  - Error handling with `ApiRequestError`
  - Helper functions: `buildQueryString()`, `getWebSocketUrl()`
- `sessions.ts` - Session API functions:
  - `createSession()`, `listSessions()`, `getSession()`, `getSessionByInviteToken()`
  - `recordConsent()`, `startSession()`, `endSession()`
  - `pauseSession()`, `resumeSession()`, `getSessionSummary()`
  - Convenience `sessionsApi` object export
- `index.ts` - Barrel exports for clean imports
- Verified with `npm run build` and `npx tsc --noEmit` - All checks passed

### [x] Step: 2.5 Define TypeScript Types
<!-- chat-id: 9db52dbd-4a61-4cfd-a375-6ea41060c34c -->

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

**Completed:** Created TypeScript type definitions in `web/src/types/`:
- `session.ts` - Session-related types with camelCase naming for React:
  - Enums: `SessionStatus`, `Platform`, `FacilitatorPersona`, `ParticipantRole`, `BalanceStatus`, `SessionStatusGroup`
  - Models: `Participant`, `FacilitatorConfig`, `Session`, `TalkBalanceMetrics`, `SessionSummary`, `KeyAgreement`
  - Wizard types: `SessionWizardFormData`, `WizardStep`
  - Utility functions: `getSessionStatusGroup()`, `isSessionActive()`, `canStartSession()`, `getStatusLabel()`
- `intervention.ts` - Intervention types for AI facilitation:
  - Enums: `InterventionType`, `InterventionModality`, `InterventionPriority`
  - Models: `Intervention`, `InterventionWithMeta`, `InterventionQueueState`
  - Specialized types: `BalanceIntervention`, `SilenceIntervention`, `TimeWarningIntervention`, `EscalationIntervention`, `GoalDriftIntervention`, `IcebreakerIntervention`
  - Utility functions: `getInterventionPriority()`, `shouldAutoDismiss()`, `getAutoDismissDelay()`, `getInterventionLabel()`, `getInterventionIcon()`
- `events.ts` - WebSocket event types for real-time communication:
  - Event type literal: `SessionEventType`
  - Base event: `SessionEvent<T>`
  - Event data types: `BalanceUpdateData`, `TimeRemainingData`, `SessionStateData`, `ParticipantStatusData`, `AIStatusData`, `GoalDriftData`, `ErrorData`
  - Typed events: `BalanceUpdateEvent`, `TimeRemainingEvent`, `SessionStateEvent`, `InterventionEvent`, etc.
  - Type guards: `isBalanceUpdateEvent()`, `isTimeRemainingEvent()`, etc.
  - WebSocket types: `WebSocketConnectionState`, `WebSocketConfig`, `WebSocketState`, `SessionEventHandlers`
- `index.ts` - Barrel exports for clean imports
- Verified with `npx tsc --noEmit` and `npm run build` - All checks passed

### [x] Step: 2.6 Implement Navigation Components
<!-- chat-id: 5fcb4756-f94b-42ad-96c1-39c86215a1c6 -->

Build responsive navigation.

**Tasks:**
- Create `components/navigation/mobile-nav.tsx`
- Create `components/navigation/side-rail.tsx`
- Create `components/navigation/nav-item.tsx`
- Implement responsive behavior

**Reference:** requirements.md Section 6.2 Navigation Design

**Verification:**
```bash
cd web && npm run build
```

**Completed:** Created responsive navigation components in `web/src/components/navigation/`:
- `nav-item.tsx` - Base navigation item components:
  - `NavItem` - Link-based navigation item with icon and label
  - `NavItemButton` - Button-based variant for actions like collapse
  - Supports active state highlighting and expanded/collapsed views
- `side-rail.tsx` - Desktop sidebar navigation:
  - Collapsible from 64px (icons only) to 256px (with labels)
  - Navigation items: Dashboard, Partners, Artifacts, Settings
  - New Session CTA button at bottom
  - Collapse/expand toggle button
  - Hidden on mobile (< md breakpoint)
- `mobile-nav.tsx` - Mobile bottom navigation bar:
  - Fixed position at bottom of screen
  - 3-tab layout: Home, New Session (elevated center CTA), Partners
  - Active state highlighting
  - Hidden on desktop (>= md breakpoint)
- `app-layout.tsx` - Responsive layout wrapper:
  - Combines SideRail (desktop) and MobileNav (mobile)
  - Handles content padding for mobile nav bar
- `index.ts` - Barrel exports for clean imports
- Verified with `npm run build` ✓

### [x] Step: 2.7 Create Hub Page
<!-- chat-id: 7de0290a-b68c-4b7a-ab6b-937655435ca5 -->

Build main hub/dashboard page.

**Tasks:**
- Create `app/(dashboard)/hub/page.tsx`
- Create `components/hub/active-session-card.tsx`
- Create `components/hub/recent-sessions-list.tsx`
- Create `components/hub/search-bar.tsx`
- Create `components/common/empty-state.tsx`

**Reference:** requirements.md Section 6.3 Hub Screen Design

**Completed:** Created Hub page with all components:
- `components/common/empty-state.tsx` - Reusable empty state component with icon, title, description, and optional action button
- `components/hub/active-session-card.tsx` - Prominent card for ready/in_progress sessions with status badge, goal preview, partner info, and Join/Resume CTA
- `components/hub/recent-sessions-list.tsx` - List of recent sessions with status icons, date formatting, and "View All" link
- `components/hub/search-bar.tsx` - Search input with icon for filtering sessions/partners
- `app/(dashboard)/hub/page.tsx` - Main Hub page integrating all components:
  - Header with "The Hub." title
  - Search bar (desktop full, mobile simplified)
  - Active session card section (if any ready/in_progress/paused session exists)
  - Recent sessions list with search filtering
  - Loading skeleton and error states
  - Empty state for new users
- `app/(dashboard)/layout.tsx` - Dashboard layout wrapping children with AppLayout
- Updated `app/page.tsx` to redirect to `/hub`
- Fixed `lib/api/types.ts` to use `session_id` matching backend
- Verified with `npm run build` ✓

---

## Phase 3: Session Creation

### [x] Step: 3.1 Wizard State Management
<!-- chat-id: a404474f-5d80-4a86-95ff-9deea5620e74 -->

Create wizard form state context.

**Tasks:**
- Create `components/session/wizard/wizard-provider.tsx` with React Context
- Define wizard state: currentStep, formData for each step
- Add navigation functions: nextStep, prevStep, setStepData

**Verification:**
```bash
cd web && npm run type-check
```

**Completed:** Created wizard state management in `web/src/components/session/wizard/`:
- `wizard-provider.tsx` - Full wizard state management with React Context:
  - `WizardProvider` component with `useReducer` for state management
  - `WizardState` type with: `currentStep`, `formData`, `stepErrors`, `isSubmitting`, `isComplete`
  - `SessionWizardFormData` type with all form fields for 5 steps
  - Navigation: `nextStep()` (with validation), `prevStep()`, `goToStep()`
  - Data management: `setStepData()`, `setFieldValue()`, `getFieldError()`
  - Validation: `validateCurrentStep()`, `validateStep()` using Zod schemas
  - Form state: `setSubmitting()`, `setComplete()`, `reset()`
  - Derived values: `currentStepConfig`, `isFirstStep`, `isLastStep`, `canGoBack`, `canGoForward`
- Zod validation schemas for each step:
  - `stepIdentitySchema` - Partner name and relationship context
  - `stepGoalSchema` - Goal text, scheduled time, duration (15-90 min)
  - `stepFacilitatorSchema` - Persona and toggle settings
  - `stepLaunchSchema` - Platform and meeting URL
  - `sessionWizardSchema` - Combined full form validation
- `WIZARD_STEPS` configuration array with 5 steps: Identity & Bond, Session Goal, Facilitator Calibration, Review & Confirm, Launch Hub
- Convenience hooks: `useWizard()`, `useWizardNavigation()`, `useWizardFormData()`, `useWizardValidation()`
- `index.ts` - Barrel exports for all exports
- `components/session/index.ts` - Parent barrel export
- Verified with `npm run build` ✓

### [x] Step: 3.2 Step 0 - Identity & Bond
<!-- chat-id: d17e2961-490b-4d4f-b1fd-42528cc10ada -->

Build first wizard step.

**Tasks:**
- Create `components/session/wizard/step-identity.tsx`
- Add form fields: Partner's Name, Relationship Context
- Add Zod validation schema

**Reference:** requirements.md Section 6.4 Step 0

**Completed:** Created Identity & Bond wizard step:
- `components/ui/textarea.tsx` - New Textarea component for multi-line text input, styled to match Input component
- `components/session/wizard/step-identity.tsx` - Step 0 component with:
  - Step indicator showing "00 / IDENTITY & BOND"
  - Headline: "Who are you connecting with?"
  - Partner's Name text input with placeholder "e.g. David Miller"
  - Relationship Context textarea with placeholder describing dynamics
  - Character counter (0/500) for relationship context
  - Error display for validation errors with proper ARIA attributes
  - "Continue to Setup" CTA button with arrow icon
  - Uses `useWizardFormData()` and `useWizardNavigation()` hooks
- Updated `components/session/wizard/index.ts` to export `StepIdentity`
- Zod validation already defined in wizard-provider.tsx (`stepIdentitySchema`)
- Verified with `npm run build` ✓

### [x] Step: 3.3 Step 1 - Session Goal
<!-- chat-id: 89eba964-b556-49fa-b210-4c99927fb12f -->

Build goal step.

**Tasks:**
- Create `components/session/wizard/step-goal.tsx`
- Add form fields: Goal text, Schedule, Duration dropdown
- Add character counter for goal

**Reference:** requirements.md Section 6.4

**Completed:** Created Session Goal wizard step:
- `components/session/wizard/step-goal.tsx` - Step 1 component with:
  - Step indicator showing "01 / SESSION GOAL"
  - Headline: "What do you want to accomplish?"
  - Goal textarea with placeholder describing expected outcomes
  - Character counter (0/500) with warning color when near limit
  - Schedule datetime-local input (optional) with calendar icon
  - Duration selection as button group (15/30/45/60/90 min options)
  - Back button and "Continue to Facilitator" CTA
  - Error display for validation errors with proper ARIA attributes
  - Uses `useWizardFormData()` and `useWizardNavigation()` hooks
- Updated `components/session/wizard/index.ts` to export `StepGoal`
- Zod validation already defined in wizard-provider.tsx (`stepGoalSchema`)
- Verified with `npm run build` ✓

### [x] Step: 3.4 Step 2 - Facilitator Calibration
<!-- chat-id: cb9ce5a1-2ef0-45df-9489-66facd37371d -->

Build facilitator selection step.

**Tasks:**
- Create `components/session/wizard/step-facilitator.tsx`
- Create `components/session/persona-selector.tsx`
- Create `components/session/parameter-toggles.tsx`

**Reference:** requirements.md Section 6.4 Step 2

**Completed:** Created Facilitator Calibration step with all components:
- `components/session/persona-selector.tsx` - Radio card group for selecting AI facilitator persona:
  - Three persona options: Neutral Mediator (shield icon), Deep Empath (heart icon), Decision Catalyst (zap icon)
  - Each card shows name, subtitle, description, and selection state
  - Accessible with proper ARIA attributes (`role="radiogroup"`, `role="radio"`, `aria-checked`)
- `components/session/parameter-toggles.tsx` - Switch toggles for configuring facilitator behavior:
  - Three toggles: Interrupt Authority, Direct Inquiry, Silence Detection
  - Each toggle shows label, description, ON/OFF state, and switch control
  - Uses shadcn/ui Switch component (installed during implementation)
- `components/session/wizard/step-facilitator.tsx` - Step 2 component with:
  - Step indicator showing "02 / FACILITATOR CALIBRATION"
  - Headline: "Facilitator."
  - Two-column layout on desktop: Persona selection (left) and Parameter toggles (right)
  - Back button and "Review & Connect" CTA
  - Uses `useWizardFormData()` and `useWizardNavigation()` hooks
- Updated `components/session/wizard/index.ts` to export `StepFacilitator`
- Updated `components/session/index.ts` to export `PersonaSelector` and `ParameterToggles`
- Verified with `npm run build` ✓

### [x] Step: 3.5 Step 3 - Review & Connect
<!-- chat-id: f179ae66-0a5e-4696-bf9a-0303c1f73578 -->

Build review step.

**Tasks:**
- Create `components/session/wizard/step-review.tsx`
- Display summary of all entered data
- Show edit links to return to previous steps

**Completed:** Created Review & Connect wizard step:
- `components/session/wizard/step-review.tsx` - Step 3 component with:
  - Step indicator showing "03 / REVIEW & CONFIRM"
  - Headline: "Finalize Setup" with subtitle "Initialize the encrypted facilitation chamber."
  - Summary card displaying: Partner name, Goal (truncated to 2 lines), Mediator persona, Duration, Schedule (if set)
  - Facilitator settings badges showing enabled behaviors (Interrupt Authority, Direct Inquiry, Silence Detection)
  - Edit buttons (pencil icons) on each row to navigate back to relevant step via `goToStep()`
  - Helper functions: `getPersonaDisplayName()`, `formatDuration()`, `formatScheduledDate()`
  - "Back to Calibration" and "Accept & Initialize" navigation buttons
- Updated `components/session/wizard/index.ts` to export `StepReview`
- Verified with `npm run build` ✓

### [x] Step: 3.6 Step 4 - Launch Hub
<!-- chat-id: 52206e24-bf7e-4f52-bfad-192d5b4fc3e7 -->

Build final launch step.

**Tasks:**
- Create `components/session/wizard/step-launch.tsx`
- Generate and display invite link
- Add platform selection dropdown
- Add meeting URL input field

**Completed:** Created Launch Hub wizard step:
- `components/session/wizard/step-launch.tsx` - Step 4 component with:
  - Step indicator showing "04 / LAUNCH HUB"
  - Headline: "Invite Your Partner" with subtitle about sharing link and connecting
  - Invite Link Card:
    - Read-only input displaying the generated invite link
    - Copy button with success state ("Copied" with checkmark)
    - Helper text explaining partner consent requirement
  - Platform Selection:
    - Radio card group with 4 options: Diadi, Zoom, Google Meet, Microsoft Teams
    - Each card shows icon, name, description, and selection state
    - Accessible with proper ARIA attributes (`role="radiogroup"`, `role="radio"`, `aria-checked`)
  - Conditional Meeting URL Input:
    - Only shows when external platform (Zoom/Meet/Teams) is selected
    - URL validation with error display
    - Helper text explaining AI facilitator will join the meeting
  - Navigation: "Back to Review" and "Create Session" buttons
  - Disabled states during submission
- Updated `components/session/wizard/index.ts` to export `StepLaunch`
- Verified with `npm run build` ✓

### [x] Step: 3.7 Session Creation Page
<!-- chat-id: 843a0058-aad8-44c6-ae41-9fdb54f65748 -->

Assemble wizard into page.

**Tasks:**
- Create `app/(dashboard)/sessions/new/page.tsx`
- Integrate WizardProvider
- Wire up API call on completion (POST /sessions)
- Redirect to session detail page on success

**Reference:** spec.md Section 6.1 POST /sessions

**Completed:** Created Session Creation Page at `web/src/app/(dashboard)/sessions/new/page.tsx`:
- `WizardProgress` - Desktop step indicator showing current/completed steps with checkmark icons
- `MobileProgress` - Mobile step indicator with progress bar and step title
- `ErrorAlert` - Error display component for API failures
- `StepLaunchInternal` - Custom launch step with submission handler:
  - Invite link display with copy functionality
  - Platform selection (Diadi, Zoom, Google Meet, Microsoft Teams)
  - Conditional meeting URL input for external platforms
  - Create Session button with loading state
- `WizardContentWithSubmit` - Step renderer with form submission logic:
  - Validates final step before submission
  - Checks platform URL requirements
  - Transforms form data to API request format
  - Handles errors and loading states
- `NewSessionPage` - Main page component:
  - Wraps content in `WizardProvider`
  - Handles API call via `createSession()` from `lib/api/sessions.ts`
  - Transforms camelCase form data to snake_case API format
  - Redirects to `/sessions/{session_id}` on success
- Verified with `npm run build` ✓

---

## Phase 4: Invitation & Consent

### [x] Step: 4.1 Invite Token & Consent Backend
<!-- chat-id: c313a8cc-0a2b-4985-bcfd-5339f2981a9f -->

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

**Completed:** Added invite token lookup and consent routes to `app/routes.py`:
- `GET /sessions/invite/{invite_token}` - Look up session by invite token for partner to view details before consenting. Route placed before `GET /sessions/{session_id}` to ensure correct path matching.
- `POST /sessions/{session_id}/consent` - Record partner consent with `ConsentRequest` containing invite_token, invitee_name, and consented flag. Returns `ConsentResponse` with updated status and participants.
- Service methods `get_session_by_invite_token()` and `record_consent()` already implemented in Step 1.3
- Dual consent logic: When partner consents, they're added to participants; if both parties have consented, session status transitions to "ready"
- Decline logic: Session is archived privately without notifying creator
- Proper error handling: 404 for session not found, 400 for invalid token
- Verified with `ruff check` - no new issues introduced (pre-existing issues in files are unrelated)

### [x] Step: 4.2 Invite Page
<!-- chat-id: a31c80db-14a5-48ed-80e2-60193007a498 -->

Build partner invitation page.

**Tasks:**
- Create `app/invite/[token]/page.tsx`
- Fetch session data using invite token
- Display: Goal, Schedule, Duration, AI consent explanation
- Create `components/session/consent-form.tsx`

**Reference:** requirements.md Section 6.5 Partner Invitation Design

**Completed:** Created Partner Invitation page and ConsentForm component:
- `app/invite/[token]/page.tsx` - Invite page with:
  - Fetches session data via `getSessionByInviteToken()` using invite token from URL
  - Loading state with spinner
  - Error state for invalid/expired tokens
  - Session status checks (redirects for in_progress/ended/archived)
  - Mobile layout: Centered header with mail icon, "You're Invited." headline, inviter name
  - Desktop layout: Split view with hero text (left) and form card (right)
  - Success state after acceptance with redirect to session details
  - Decline state with privacy confirmation
- `components/session/consent-form.tsx` - Consent form component with:
  - Session details card showing inviter name as CardDescription
  - "Proposed Aim" section with quoted goal text (italic serif)
  - Schedule/duration display with icons
  - Meeting link (external link) for external platforms
  - AI Facilitation Notice section with 4 consent points:
    - "An AI will observe your conversation"
    - "BOTH of you see the same information"
    - "Either can pause anytime"
    - "Nothing is stored by default"
  - "End-to-End Encrypted Session" badge
  - Name input field for invitee
  - "Accept" button (secondary variant) and "Decline Privately" link
  - Loading/disabled states during submission
- Updated `components/session/index.ts` to export ConsentForm
- Verified with `npm run build` ✓

### [x] Step: 4.3 Consent Form Component

Build consent UI.

**Tasks:**
- Display consent information
- Add Accept button
- Add "Decline Privately" link

**Reference:** requirements.md Section 7.3 Consent Information

**Completed:** Implemented as part of Step 4.2 in `components/session/consent-form.tsx`

### [x] Step: 4.4 Waiting Room Component
<!-- chat-id: 9c7964ac-5a93-4262-a68c-df448fb4cb3c -->

Build waiting room UI.

**Tasks:**
- Create `components/session/waiting-room.tsx`
- Display readiness status
- Show partner status
- Add copy invite link button

**Reference:** requirements.md Section 6.6 Waiting Room Design

**Completed:** Created `components/session/waiting-room.tsx` with:
- `WaitingRoom` - Main component with responsive mobile and desktop layouts
- Mobile view: Partner avatar with status ring, "Waiting for [partner]..." headline, progress bar showing readiness status, status message, copy invite link button
- Desktop view: Card layout with two-column design - left side shows system readiness checklist (Mic, Agent, Partner status with green/gray dots), right side shows partner preview card with avatar and status badge
- `PartnerAvatar` - Avatar component with status ring (green for ready/joined, amber for joining, gray for waiting)
- `ReadinessStatusDot` - Status indicator dot (green ready, amber initializing with animation, gray pending)
- Helper functions: `getPartnerStatusLabel()`, `createDefaultReadinessItems()`
- Props: partnerName, partnerAvatarUrl, partnerStatus, readinessItems, inviteLink, meetingUrl, goal, onStartSession, isStarting
- Copy invite link button with clipboard API and success state
- External meeting link support for Zoom/Meet/Teams
- Start Session button that enables when all systems ready and partner joined
- Verified with `npm run build` ✓

---

## Phase 5: Live Session Infrastructure

### [x] Step: 5.1 Session Start Backend
<!-- chat-id: d3f797ac-8739-4cef-afa5-53d9047d000c -->

Implement session start logic.

**Tasks:**
- Add `POST /sessions/{id}/start` endpoint
- Implement `start_session()` in SessionService
- Call `create_meeting_bot()` and `start_pipecat_process()`
- Update session status to in_progress

**Reference:** spec.md Section 4.2 start_session()

**Completed:** Implemented full session start backend:
- Added `POST /sessions/{session_id}/start` endpoint to `app/routes.py`:
  - Accepts `StartSessionRequest` with `meeting_url`
  - Returns `StartSessionResponse` with status, bot_id, client_id, and event_url
  - Proper error handling: 404 for session not found, 400 for not ready, 500 for MeetingBaas/Pipecat failures
- Updated `start_session()` in `app/services/session_service.py`:
  - Loads facilitator persona based on session configuration (with fallbacks)
  - Resolves voice ID via VoiceUtils if not present
  - Creates MeetingBaas bot with session context (goal, persona) in `extra` metadata
  - Starts Pipecat subprocess for AI audio pipeline
  - Stores process in PIPECAT_PROCESSES for cleanup
  - Updates session status to IN_PROGRESS
  - Returns bot_id, client_id, and event_url
- Integration with existing infrastructure:
  - Uses `create_meeting_bot()` from `scripts/meetingbaas_api.py`
  - Uses `start_pipecat_process()` from `core/process.py`
  - Uses `determine_websocket_url()` from `utils/ngrok.py`
  - Stores meeting details in `MEETING_DETAILS` for WebSocket handler
- Verified with `ruff check` - All new code passes

### [x] Step: 5.2 Session Events WebSocket
<!-- chat-id: 852706b2-415c-48f2-97ed-a6e324371f6c -->

Add WebSocket endpoint for session events.

**Tasks:**
- Add `WS /sessions/{session_id}/events` endpoint
- Register connection in SESSION_EVENTS
- Send initial session state on connect
- Implement `broadcast_session_event()` helper

**Reference:** spec.md Section 7.1 WebSocket Handler Extension

**Completed:** Added session events WebSocket endpoint to `app/websockets.py`:
- Added `WS /sessions/{session_id}/events` endpoint for real-time session updates
- Validates session exists on connect (returns 4004 if not found)
- Registers connection in SESSION_EVENTS via `register_event_connection()`
- Sends initial session state on connect with:
  - Session status, goal, duration
  - Full participant list with id, name, role, consented status
  - Facilitator config (persona, interrupt_authority, direct_inquiry, silence_detection)
  - bot_id and client_id references
- Handles incoming client messages:
  - `ping` → responds with `pong` for heartbeat
  - `update_settings` → logs and acknowledges settings updates (TODO: forward to Pipecat)
  - `intervention_ack` → logs intervention acknowledgment for analytics
- Invalid JSON triggers error event back to client
- Proper cleanup on disconnect via `unregister_event_connection()`
- Logs connection counts for debugging
- `broadcast_session_event()` helper already exists in `core/session_store.py` (implemented in Step 1.2)
- Verified with `ruff check` and `ruff format` - All checks passed

### [x] Step: 5.3 Balance Tracker Module
<!-- chat-id: f37e6a96-c16f-447f-9aa7-03af02974413 -->

Create balance tracking logic.

**Tasks:**
- Create `core/balance_tracker.py`
- Implement `SpeakerMetrics` dataclass
- Implement `BalanceTracker` class

**Reference:** spec.md Section 4.4 Balance Tracker

**Completed:** Created `core/balance_tracker.py` with comprehensive balance tracking:
- `SpeakerMetrics` dataclass with `total_speaking_time_ms`, `last_spoke_at`, `is_speaking` fields
- `BalanceResult` dataclass for structured balance calculations with `to_dict()` for JSON serialization
- `BalanceTracker` class with:
  - Configurable thresholds: `MILD_IMBALANCE_THRESHOLD=35` (65/35), `SEVERE_IMBALANCE_THRESHOLD=40` (70/30)
  - Duration thresholds: `MILD_IMBALANCE_DURATION=3min`, `SEVERE_IMBALANCE_DURATION=5min`
  - `update_speaker()` - Update speaker state from diarization events
  - `get_current_speaking_time()` - Get total time including active turns
  - `get_balance()` - Calculate percentages and status ("balanced", "mild_imbalance", "severe_imbalance")
  - `check_intervention_trigger()` - Returns "severe_balance" or "balance" based on duration thresholds
  - `get_dominant_speaker()` / `get_quiet_speaker()` - Helper methods for intervention targeting
  - `reset_intervention_timers()` - Reset after intervention delivery
  - `to_metrics_dict()` - Export full metrics for API response
- Verified with `ruff check` and `ruff format` - All checks passed

### [x] Step: 5.4 Frontend WebSocket Hook
<!-- chat-id: 4881c66f-c73b-4324-b13f-d9b39187fe5f -->

Create WebSocket hook for session events.

**Tasks:**
- Create `hooks/use-session-events.ts`
- Implement connection with reconnection logic
- Handle event types: balance_update, intervention, time_remaining, session_state

**Reference:** spec.md Section 7.3 Frontend WebSocket Hook

**Completed:** Created `web/src/hooks/use-session-events.ts` with:
- `useSessionEvents` hook with full WebSocket connection management
- Connection states: connecting, connected, disconnected, reconnecting, error
- Automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, 16s delays)
- Maximum 5 reconnect attempts before giving up
- Heartbeat/ping every 30 seconds to keep connection alive
- Event routing for all event types: balance_update, intervention, escalation, time_remaining, session_state, participant_status, ai_status, goal_drift, error
- Helper methods: `sendMessage()`, `acknowledgeIntervention()`, `updateSettings()`
- Manual `connect()` and `disconnect()` controls
- Proper cleanup on unmount (closes connection, clears timeouts)
- Ref-based callback pattern to avoid circular dependencies
- TypeScript types exported: `UseSessionEventsOptions`, `UseSessionEventsReturn`
- Barrel export in `hooks/index.ts`
- Verified build passes: `npm run build` ✓

### [x] Step: 5.5 Session UI Store
<!-- chat-id: cab647c6-de0c-4b61-94c2-95f3e5a35d7c -->

Create Zustand store for live session state.

**Tasks:**
- Create `stores/session-store.ts`
- Add state and actions

**Reference:** spec.md Section 3.4 State Management

**Completed:** Created Zustand stores in `web/src/stores/`:
- `session-store.ts` - Live session UI state management:
  - `SessionUIState` interface with: sessionId, session, isConnected, connectionError, lastEventAt, balance, aiStatus, timeRemaining, elapsedSeconds, participantStatuses, isOnGoal, goalDriftSeconds, facilitatorPaused, facilitatorConfig, isStarting, isEnding, isPausing
  - `SessionUIActions` interface with: initSession, clearSession, setConnected, setConnectionError, setBalance, setAIStatus, setTimeRemaining, incrementElapsed, setParticipantStatus, clearParticipantStatuses, setGoalDrift, toggleFacilitator, setFacilitatorPaused, updateFacilitatorConfig, setStarting, setEnding, setPausing, updateSession, updateParticipants
  - Selectors: selectIsSessionActive, selectIsSessionPaused, selectCanStartSession, selectTimeRemainingPercent, selectDominantSpeaker, selectAllParticipantsConnected, selectCurrentSpeaker
  - Uses devtools middleware for debugging
- `intervention-store.ts` - Intervention queue management:
  - `InterventionState` interface with: queue, current, history, isOverlayVisible, isPreviewing, lastInterventionAt, cooldownActive, totalInterventions, acknowledgedCount, autoDismissedCount
  - `InterventionActions` interface with: push, dismiss, acknowledge, clear, showOverlay, hideOverlay, setPreviewMode, processNext, clearHistory, setCooldown
  - Priority-based queue sorting (critical > high > medium > low)
  - Auto-dismiss support with helper function `getAutoDismissTimeout()`
  - Selectors: selectHasCurrentIntervention, selectQueueLength, selectCurrentPriority, selectIsCriticalIntervention, selectAcknowledgementRate, selectRecentHistory, selectInterventionsByType, selectIsInCooldown
- `index.ts` - Barrel exports for all stores, types, selectors, and helpers
- Verified build passes: `npm run build` ✓

---

## Phase 6: Live Session UI

### [x] Step: 6.1 Talk Balance Component
<!-- chat-id: 68c57780-c3e4-46a1-8fb2-cf28217c3ba6 -->

Build real-time balance indicator.

**Tasks:**
- Create `components/live/talk-balance.tsx`
- Display horizontal bicolor bar
- Show participant names and percentages

**Reference:** requirements.md Section 6.7 Active Session Design

**Completed:** Created `web/src/components/live/talk-balance.tsx` with three variants:
- `TalkBalance` - Main component with horizontal bicolor bar:
  - Header row showing participant names, percentages, and status badge
  - Horizontal progress bar split proportionally between participants
  - Color coding based on balance status (green=balanced, amber=mild, red=severe)
  - Props: `balance`, `compact`, `showPercentages`, `showNames`, `className`
  - Loading skeleton when balance is null
  - Accessible with ARIA progressbar role
- `TalkBalanceCompact` - Minimal HUD overlay variant:
  - Just percentages and thin bar for video overlays
  - Light colors for dark backgrounds
- `TalkBalanceVertical` - Side panel variant:
  - Vertical bars for each participant
  - Useful for side panels and dashboards
- Created `components/live/index.ts` barrel export
- Verified with `npm run build` ✓

### [x] Step: 6.2 AI Status Indicator
<!-- chat-id: 93359176-f0d6-41c4-8436-bf5e012f35a7 -->

Build AI status display.

**Tasks:**
- Create `components/live/ai-status-indicator.tsx`
- Show status: Listening, Preparing, Intervening, Paused
- Add animated states

**Reference:** spec.md Section 3.3 AIStatusIndicator Component

**Completed:** Created `web/src/components/live/ai-status-indicator.tsx` with multiple variants:
- `AIStatusIndicator` - Main component with circular ring indicator and icon:
  - Supports 5 AI states: idle, listening, preparing, intervening, paused
  - Custom SVG icons for each state
  - Animated states: listening (pulse), preparing (spin), intervening (glow)
  - Configurable: compact mode, show/hide label, custom message
- `AIStatusBadge` - Badge-style variant for toolbar/header use:
  - Compact horizontal layout with dot indicator and label
  - Color-coded backgrounds and rings per status
- `AIStatusHUD` - HUD overlay variant for video backgrounds:
  - Light colors on semi-transparent dark backdrop
  - Optimized for visibility on video feeds
- `AIStatusLarge` - Large display variant for full-screen states:
  - Large animated ring with icon
  - Label and optional message below
  - Outer glow effect for intervening state
- Helper functions: `getStatusLabel()`, `getStatusStyles()` for consistent styling
- Custom inline SVG icons: IdleIcon, ListeningIcon, PreparingIcon, InterveningIcon, PausedIcon
- Uses existing `animate-glow` animation from Tailwind config
- Proper ARIA attributes: `role="status"`, `aria-live="polite"`, `aria-label`
- Updated `components/live/index.ts` barrel export
- Verified with `npm run build` ✓

### [x] Step: 6.3 Session Timer
<!-- chat-id: 8a189b23-1ad5-490f-8d83-9ed0b4e060a5 -->

Build countdown timer.

**Tasks:**
- Create `components/live/session-timer.tsx`
- Display elapsed time and time remaining

**Completed:** Created `web/src/components/live/session-timer.tsx` with multiple variants:
- `SessionTimer` - Main component with status indicator dot and time display:
  - Displays elapsed or remaining time in mm:ss or hh:mm:ss format
  - Color coding based on time status: normal (green), warning (< 5 min, amber), critical (< 2 min, red)
  - Progress bar showing completion percentage
  - Configurable: compact mode, show elapsed vs remaining
  - Timer interval with `onTick` callback for incrementing elapsed seconds
  - Proper ARIA attributes: `role="timer"`, `aria-label`
- `SessionTimerSkeleton` - Loading skeleton for the timer
- `SessionTimerWithLabel` - Timer with descriptive label (top or left position)
- `SessionTimerHUD` - Compact overlay variant for video backgrounds:
  - Pill-shaped with semi-transparent dark background
  - Status dot (green/amber/red) and white text
  - Designed for visibility on video feeds
- `SessionTimerLarge` - Large display variant for prominent timer placement:
  - Large 3xl font with status indicator
  - Status badge showing time state
  - Full progress bar
  - Optional dual display (elapsed + remaining)
- `SessionTimerDual` - Side-by-side elapsed and remaining display:
  - Shows both times with labels
  - Full-width progress bar with position marker
  - Duration label
- Helper functions: `formatTime()`, `calculateTimeRemaining()`, `getTimeStatus()`, `getStatusColors()`, `getStatusLabel()`
- Updated `components/live/index.ts` barrel export
- Verified with `npm run build` ✓

### [x] Step: 6.4 Live Facilitation Room Page
<!-- chat-id: 3ff66ead-661b-4ba4-a0f0-e61ac46209a1 -->

Assemble live session page.

**Tasks:**
- Create `app/(dashboard)/sessions/[id]/live/page.tsx`
- Integrate WebSocket hook
- Layout: TalkBalance, Timer, AIStatus, GoalSnippet

**Reference:** requirements.md Section 6.7 Active Session Design

**Completed:** Created Live Facilitation Room page with all components:
- `app/(dashboard)/sessions/[id]/live/page.tsx` - Main live session page with:
  - Session data fetching via React Query with session store integration
  - WebSocket integration via `useSessionEvents` hook for real-time updates
  - Event handlers for: balance_update, time_remaining, ai_status, goal_drift, session_state, intervention
  - Connection state management with reconnection banner UI
- Layout components:
  - `SessionHeader` - Partner name and AI status indicator
  - `MetricsPanel` - TalkBalance, SessionTimer, and GoalSnippet in card layout
  - `SessionControls` - End session button and Pause Facilitation kill switch
  - `ConnectionBanner` - Visual indicator for connecting/reconnecting/disconnected states
- Created `components/live/goal-snippet.tsx` - New component with:
  - `GoalSnippet` - Main component showing goal with on/off-track status and drift warning
  - `GoalSnippetInline` - Compact HUD overlay variant
  - `GoalCard` - Full card variant for sidebar use
- Created `app/(dashboard)/sessions/[id]/page.tsx` - Session detail page that:
  - Shows pre-session waiting room for draft/pending_consent/ready states
  - Redirects to `/live` for in_progress/paused states
  - Shows post-session summary for ended state
  - Shows archived message for archived state
- Updated `components/live/index.ts` to export GoalSnippet variants
- Verified build passes: `npm run build` ✓

---

## Phase 7: Intervention System

### [x] Step: 7.1 Intervention Engine
<!-- chat-id: 0d67c344-2e6a-44f8-98ae-e26eaf66527f -->

Create backend intervention logic.

**Tasks:**
- Create `core/intervention_engine.py`
- Implement intervention types and blockers
- Configure thresholds from requirements

**Reference:** spec.md Section 4.5 Intervention Engine

**Completed:** Created `core/intervention_engine.py` with comprehensive intervention logic:
- `InterventionType` enum: BALANCE, SILENCE, GOAL_DRIFT, TIME_WARNING, ESCALATION, ICEBREAKER
- `InterventionModality` enum: VISUAL, VOICE
- `InterventionPriority` enum: CRITICAL, HIGH, MEDIUM, LOW
- `Intervention` dataclass with `to_dict()` for JSON serialization
- `InterventionTemplates` class with human-written message templates:
  - Balance (visual and voice variants)
  - Silence prompts
  - Time warnings (5 min, 2 min, 1 min)
  - Goal drift prompts
  - Escalation/tension prompts
  - Icebreaker prompts
- `InterventionEngine` class with:
  - Configurable thresholds from requirements:
    - MIN_INTERVENTION_INTERVAL: 30 seconds
    - COOLDOWN_PERIOD: 2 minutes
    - SILENCE_THRESHOLD: 15 seconds
    - FIRST_MINUTES_QUIET: 3 minutes
    - GOAL_DRIFT_THRESHOLD: 2 minutes
    - TENSION_THRESHOLD: 0.7
    - Time warnings at 5, 2, 1 minute remaining
  - Blocker conditions: mid_sentence, emotional_disclosure, repair_in_progress, crisis_detected
  - `can_intervene()` - checks all blocker conditions and timing constraints
  - `evaluate()` - evaluates conditions in priority order and returns intervention
  - Individual check methods: `_check_escalation()`, `_check_severe_balance()`, `_check_time_warning()`, `_check_silence()`, `_check_mild_balance()`, `_check_goal_drift()`
  - `pause()` / `resume()` - kill switch support
  - `create_icebreaker()` - for session start
  - `get_stats()` / `get_history()` - for analytics
- Verified with `ruff check` and `ruff format` - All checks passed

### [x] Step: 7.2 Intervention Store
<!-- chat-id: 8bb8994c-fcaa-43e9-b914-43bfe3be44d2 -->

Create frontend intervention queue.

**Tasks:**
- Create `stores/intervention-store.ts`
- Add state: queue, current intervention

**Completed:** Already implemented as part of Step 5.5 (Session UI Store). The `web/src/stores/intervention-store.ts` file contains:
- `InterventionState` interface with: queue, current, history, isOverlayVisible, isPreviewing, lastInterventionAt, cooldownActive, totalInterventions, acknowledgedCount, autoDismissedCount
- `InterventionActions` interface with: push, dismiss, acknowledge, clear, showOverlay, hideOverlay, setPreviewMode, processNext, clearHistory, setCooldown
- Priority-based queue sorting (critical > high > medium > low)
- Auto-dismiss support with `getAutoDismissTimeout()` helper
- Selectors: selectHasCurrentIntervention, selectQueueLength, selectCurrentPriority, selectIsCriticalIntervention, selectAcknowledgementRate, selectRecentHistory, selectInterventionsByType, selectIsInCooldown
- Verified build passes: `npm run build` ✓

### [x] Step: 7.3 Intervention Overlay Component
<!-- chat-id: d03b446c-f823-496c-93ea-b1d3499ea48f -->

Build intervention display.

**Tasks:**
- Create `components/intervention/intervention-overlay.tsx`
- Render based on intervention type

**Reference:** requirements.md Section 6.8 Intervention UI Design

**Completed:** Created intervention overlay and all variant components in `web/src/components/intervention/`:
- `intervention-overlay.tsx` - Main overlay component with:
  - `InterventionOverlay` - Full-screen modal overlay integrating with intervention store
  - `InterventionBanner` - Bottom banner variant for non-modal display
  - `InterventionToast` - Minimal toast-style notification
  - Auto-dismiss timer integration via `getAutoDismissTimeout()`
  - Priority-based styling (critical=red, high=dark, medium=secondary, low=light)
  - Click-outside dismiss (except critical priority)
  - Animated entrance with `animate-in fade-in zoom-in-95`
- `balance-prompt.tsx` - Balance intervention UI:
  - `BalancePrompt` - Full card with balance bar visualization, percentages, severity colors
  - `BalancePromptBanner` - Compact banner variant
- `silence-prompt.tsx` - Silence intervention UI:
  - `SilencePrompt` - Card with animated silence indicator, conversation starters
  - `SilencePromptBanner` - Compact banner variant
- `time-warning.tsx` - Time warning intervention UI:
  - `TimeWarning` - Card with countdown ring, urgency colors, time management tips
  - `TimeWarningBanner` - Compact banner variant
  - `TimeWarningHUD` - Minimal HUD overlay for persistent display
- `escalation-alert.tsx` - Escalation/tension intervention UI:
  - `EscalationAlert` - Full card with tension meter, suggested responses, pause/continue actions
  - `EscalationBanner` - Bottom banner per design reference
- `icebreaker-modal.tsx` - Icebreaker intervention UI:
  - `IcebreakerModal` - Full-screen modal with agent avatar, session goal reminder, prompt
  - `IcebreakerPrompt` - Inline prompt variant
  - `IcebreakerCard` - Compact card variant
- `goal-resync.tsx` - Goal drift intervention UI:
  - `GoalResync` - Card with original goal, drift duration, refocus action
  - `GoalResyncOverlay` - Full-screen loading overlay per design reference
  - `GoalResyncBanner` - Compact banner variant
  - `GoalReminder` - Small inline goal reminder
- `index.ts` - Barrel exports for all components
- Verified build passes: `npm run build` ✓

### [x] Step: 7.4 Intervention Variants

Build specific intervention UIs.

**Tasks:**
- Create balance, silence, time, escalation prompts
- Create icebreaker modal

**Reference:** requirements.md Section 7.6 Intervention Templates

**Completed:** All intervention variants implemented as part of Step 7.3 above. Each variant includes:
- Main component for modal/card display
- Banner/compact variant for less intrusive display
- Proper styling per requirements.md Section 6.8
- Integration with intervention store for dismiss/acknowledge actions
- Auto-dismiss progress bars where applicable
- Accessible ARIA attributes

---

## Phase 8: Kill Switch & Session End

### [x] Step: 8.1 Pause/Resume Backend
<!-- chat-id: fb30329e-0c5d-4835-9325-03647dada617 -->

Add pause/resume endpoints.

**Tasks:**
- Add `POST /sessions/{id}/pause` endpoint
- Add `POST /sessions/{id}/resume` endpoint

**Reference:** spec.md Section 6.1 Pause/Resume endpoints

**Completed:** Added pause/resume backend functionality:
- Added `PauseResumeResponse` model to `app/models.py` with status field
- Added `POST /sessions/{session_id}/pause` endpoint to `app/routes.py`:
  - Validates session exists and is in_progress
  - Calls `session_service.pause_facilitation()`
  - Returns `PauseResumeResponse` with status "paused"
  - Proper error handling: 404 for not found, 400 if not in progress
- Added `POST /sessions/{session_id}/resume` endpoint to `app/routes.py`:
  - Validates session exists and is paused
  - Calls `session_service.resume_facilitation()`
  - Returns `PauseResumeResponse` with status "in_progress"
  - Proper error handling: 404 for not found, 400 if not paused
- Updated `session_service.pause_facilitation()` with:
  - Status validation (must be IN_PROGRESS to pause)
  - Broadcasts `session_state` event to WebSocket clients with `facilitator_paused: true`
- Updated `session_service.resume_facilitation()` with:
  - Status validation (must be PAUSED to resume)
  - Broadcasts `session_state` event to WebSocket clients with `facilitator_paused: false`
- Verified with `ruff format --check` - all files properly formatted

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
