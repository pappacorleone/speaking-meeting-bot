# Diadi Frontend PRD & Implementation Guide

## Document Overview

**Product:** Diadi - AI-Facilitated Dyadic Communication Platform
**Document Type:** PRD + Phased Implementation Roadmap
**Target:** Product & Engineering Teams
**Tech Stack:** Next.js 14 + React + TypeScript
**Backend:** Existing FastAPI + Pipecat codebase
**Created:** January 2026

---

## 1. Executive Summary

Diadi is a real-time communication assistant that facilitates difficult conversations between two people who care about each other. Unlike coaching tools that serve one person, Diadi observes both participants and intervenes only when genuinely helpful.

**Core Differentiator:** Real-time facilitation for human-human dyads with symmetric visibility.

**Alpha Success Criteria:** >80% of conversation pairs rate experience 4+/5 with <3 AI interventions per 30-minute session.

---

## 2. Screen Inventory & Rationalization

The UI mockups contain 90+ screens across 10 categories. This section rationalizes them into a coherent user flow.

### 2.1 Screen Categories

| Category | Screens | Purpose |
|----------|---------|---------|
| Hub | 2 | Central dashboard (mobile + desktop) |
| Partner Invitation | 6 | Consent-first invitation flow |
| Session Creation | 15 | Multi-step session setup |
| Pre-Session | 4 | Prep and rehearsal |
| Active Session (Diadi) | 12 | Native video facilitation |
| Active Session (Zoom/Meet) | 5 | Platform integration HUD |
| Interventions | 18 | AI facilitation overlays |
| Post-Session | 7 | Synthesis and artifacts |
| Partner Profiles | 5 | Relationship CRM |
| User Profile | 2 | Account management |
| Navigation | 4 | App navigation patterns |
| Complications | 7 | Edge cases and indicators |

### 2.2 Branding Rationalization

**Issue:** Screens show both "Talk." and "Diadi" branding.
**Resolution:** Use "Diadi" consistently across all platforms.

### 2.3 Unified User Flow

```
ONBOARDING
├── Sign Up / Login
└── Initial Profile Setup

HUB (Home)
├── Active Sessions ("Ready for Facilitation")
├── Artifact Library
├── Recent Sessions Archive
└── Quick Actions (+ New Session, Search)

SESSION CREATION (6 Steps)
├── Step 00: Identity & Bond (Who are you connecting with?)
├── Step 01: Invitation (Send consent request)
├── Step 02: Strategic Intent (Goal setting)
├── Step 03: Emotional Pulse (How are you feeling?)
├── Step 04: Confirmation (Review before starting)
└── Step 05: Talk Prep (AI recommendations, artifacts)

PARTNER INVITATION (Recipient Side)
├── Invitation Card (Proposed aim, time, encryption notice)
├── Accept → Join session flow
└── Decline Privately → No notification to inviter

PRE-SESSION
├── Rehearsal Simulation (Practice with AI partner)
├── Initialization ("Ready to connect?" + partner waiting)
└── Device Check (Mic & Camera verified)

ACTIVE SESSION
├── Native Diadi Mode
│   ├── Video feeds + Talk Balance Ring (55:45)
│   ├── Facilitator Settings Panel
│   ├── Intervention Overlays
│   └── Session Controls (Mute, Video, End)
└── Zoom/Meet Mode
    ├── Companion HUD Overlay
    ├── Converge AI Indicator
    └── Nudge Triggers

INTERVENTIONS (During Session)
├── Agent Icebreaker (Opening prompt)
├── Bridge Insight (Topic pivot suggestion)
├── Neutral Grounding (Escalation pause - 60s silence)
├── Nudge Trigger (Turn-taking imbalance)
└── Human Intervention (Escalation to professionals)

POST-SESSION
├── Synthesis Board (AI consensus summary)
├── Key Agreements & Action Items
├── Full Transcript
└── Shared Artifacts (PDF downloads)

PARTNER PROFILES
├── Journey History
├── AI Goal Recommendations
└── Shared Artifacts by Partner

USER PROFILE
├── Account Settings
├── Billing & Subscription
├── My Assistants (Default facilitator)
└── Integrations (Zoom, etc.)
```

---

## 3. Feature Specifications

### 3.1 Hub (Home Dashboard)

**Purpose:** Central command center showing active sessions and quick access to history.

**Components:**
- **Search Bar:** Find sessions, partners, or consensus goals
- **Active Session Card:** Shows "Ready for Facilitation" status, partner name, goal, agreement baseline percentage, "Join/Resume Session" CTA
- **Artifact Library:** Grid of shared documents (Consensus Map, Equity Draft, Ground Rules, Sentiment Analysis)
- **Recent Sessions Archive:** List with partner name, date, consensus status

**Desktop Layout:**
- Left sidebar navigation (Home, People, Create, Profile)
- Main content area with session card prominently displayed
- Right section for artifacts

**Mobile Layout:**
- Bottom navigation bar
- Stacked cards
- Collapsible artifact section

### 3.2 Session Creation Flow

**Step 00 - Identity & Bond**
- Partner's name input
- Relationship context textarea (e.g., "Co-founders, 3 years working together, high trust but recent friction")
- "Continue to Setup" CTA

**Step 01 - Invitation**
- Preview card showing proposed aim
- Schedule picker (date, time, duration)
- Meeting link generation
- E2E encryption notice
- Send invitation button

**Step 02 - Strategic Intent**
- Discussion goal input (quoted format)
- Facilitator tips based on partner history
- Neutral Mediation info ("System will auto-pause for asymmetrical speaking patterns")
- Partner Dynamics insight ("Focus on 'Vesting' triggers as per Dec 12 history")

**Step 03 - Emotional Pulse**
- 4 emotional states: Centered, Stressed, Reserved, Dynamic
- Each with icon and selection state
- Mindful nudge based on selection
- Example: "Since you're feeling Centered, use your grounding to help David if he begins to escalate. Stay curious."

**Step 04 - Penultimate Confirmation**
- Summary card: Partner, Facilitator type, Goal
- "Accept & Initialize Room" CTA
- "Back to Calibration" link

**Step 05 - Talk Prep**
- "Where we left off" summary from last session
- Recent artifacts list
- AI Facilitator recommendation (e.g., "Review the 'Single Trigger' acceleration section on page 4 of the Equity PDF before opening the room")

### 3.3 Partner Invitation (Recipient)

**Invitation Card:**
- "You're Invited." headline
- Partner name who invited
- Proposed aim in quotes
- Schedule (Today, 2:00 PM, 45m)
- Meeting link
- E2E encryption notice: "Conversations are E2E encrypted and never stored on centralized servers"
- Accept button (primary)
- "Decline Privately" link (inviter not notified)

**Strategic Intent Confirmation (After Accept):**
- Confirmed goal display
- Neutral Mediation info
- Partner Dynamics insight
- "Continue Prep" or "Go Directly to Chat" options

### 3.4 Active Session (Native Diadi)

**Video Container:**
- Local video feed (self)
- Remote video feed (partner)
- Partner name label
- "ROOM LIVE" indicator

**Talk Balance Indicator:**
- Circular ring showing ratio (e.g., 55:45)
- Updates in real-time via WebSocket
- Visible to both participants (symmetric)

**Facilitator Settings Panel:**
- Sentiment Detection toggle (Assist Live / Paused)
- Tension Monitoring toggle (Active / Paused)
- Facilitated Prompts toggle (Enabled / Paused)
- "Apply Configuration" button

**Session Controls:**
- Microphone mute/unmute
- Video on/off
- End call (red button)
- Settings gear icon

**Key Constraint Display:**
- "Balanced talk-time active (60/40 threshold)"
- "Open the Line" button

### 3.5 Active Session (Zoom/Meet Integration)

**Companion HUD:**
- "Converge AI" badge indicating active facilitation
- Multi-participant video grid view
- Talk balance visualization
- Nudge trigger cards

**Nudge Trigger Card:**
- Icon + "NUDGE TRIGGER" label
- Message: "Turn-taking imbalance detected. Invite [Name] to respond to the last point?"
- Two CTAs: "Prompt" (primary), "Skip" (secondary)

### 3.6 Intervention System

**Types & Triggers:**

| Type | Trigger | Modality | Message Pattern |
|------|---------|----------|-----------------|
| Icebreaker | Session start | Voice + Visual | "Welcome both of you. Since the goal is [X], would you like to start by [suggestion]?" |
| Nudge | Balance >65% for 3min | Visual first | "[Name] hasn't shared their perspective yet" |
| Balance Voice | Balance >70% for 5min | Voice | "I notice the conversation has been a bit one-sided. [Name], would you like to share your thoughts?" |
| Bridge Insight | Topic drift >2min | Visual | "[Name] just expressed concern about [topic]. Would you like to address that specifically before moving to the budget?" |
| Neutral Grounding | Tension score >0.7 | Voice + Visual | "The volume and tempo of the conversation have increased. Let's take 60 seconds of silence to process the last statement." |
| Human Intervention | High friction detected | Visual | "This impasse requires more than AI guidance. We recommend shifting to a certified human professional." |

**Intervention Blockers:**
- Either party mid-sentence
- Emotional disclosure in progress
- <30 seconds since last intervention
- Repair attempt in progress
- First 3 minutes of session

### 3.7 Post-Session

**Synthesis Board:**
- AI Consensus Summary (italic quote format)
- Key Agreements cards (e.g., "Vesting Finalized", "Acceleration Trigger")
- Action Items checklist with assignee
- Generated Assets list

**Tabs:**
- Summary (default)
- Full Transcript
- Artifacts

**Shared Workspace:**
- Document cards: CONSENSUS_MEMO.PDF, EQUITY_STRUCTURE.PNG, VESTING_SCHEDULE.PDF
- File metadata (date, size)
- Download/share buttons

**Export Options:**
- Share Recap
- Download PDF

### 3.8 Partner Profiles

**Header:** Partner name with avatar

**AI Recommendation Card:**
- Proposed goal with reasoning
- "Adopt This Goal" CTA

**Journey History:**
- Session list with dates and consensus status
- Shared artifacts by session

### 3.9 Safety Escalation

**Human Intervention Screen:**
- "This impasse requires more than AI guidance"
- Professional Referrals:
  - Business Mediator Network
  - Relationship Counseling
- "Review Talk Artifacts" CTA

---

## 4. Technical Architecture

### 4.1 Frontend Stack

```
diadi-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, signup
│   │   ├── (dashboard)/        # Protected routes
│   │   │   ├── hub/
│   │   │   ├── partners/
│   │   │   ├── sessions/
│   │   │   │   ├── new/        # Creation wizard
│   │   │   │   └── [id]/       # Session detail/active
│   │   │   └── profile/
│   │   ├── invite/[token]/     # Public invitation
│   │   └── api/                # BFF routes
│   ├── components/
│   │   ├── ui/                 # Shadcn primitives
│   │   ├── hub/
│   │   ├── session/
│   │   ├── intervention/
│   │   └── partner/
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useSession.ts
│   │   ├── useTalkBalance.ts
│   │   └── useWebRTC.ts
│   ├── stores/                 # Zustand
│   │   ├── sessionStore.ts
│   │   └── userStore.ts
│   ├── lib/
│   │   ├── api/
│   │   ├── websocket/
│   │   └── webrtc/
│   └── types/
```

### 4.2 Backend Extensions Required

**New WebSocket Endpoint:**
```python
# app/websockets.py - ADD
@websocket_router.websocket("/ws/{client_id}/feedback")
async def feedback_websocket(websocket: WebSocket, client_id: str):
    """Real-time UI feedback channel for Diadi frontend"""
```

**New State Store:**
```python
# core/connection.py - ADD
SESSION_STATE: Dict[str, Dict] = {}
# client_id -> {
#     "consent": {...},
#     "talk_time": {"user": float, "partner": float},
#     "interventions": [...],
#     "escalation_level": "green" | "yellow" | "orange" | "red"
# }
```

**New API Endpoints:**
- `POST /sessions` - Create session with goal/consent
- `GET /sessions/{id}` - Get session details
- `POST /invitations` - Generate invitation token
- `POST /invitations/{token}/respond` - Accept/decline
- `GET /sessions/{id}/summary` - AI summary
- `GET /sessions/{id}/transcript` - Full transcript

### 4.3 WebSocket Message Types

```typescript
interface WebSocketMessage {
  type: 'talk_balance' | 'intervention' | 'partner_status' | 'consent_update';
  payload: any;
  timestamp: number;
}

// Talk Balance (sent every 5 seconds)
{ type: 'talk_balance', payload: { user: 55, partner: 45, duration: 1234 }}

// Intervention
{ type: 'intervention', payload: {
  id: 'uuid',
  type: 'nudge' | 'bridge_insight' | 'neutral_grounding',
  message: 'string',
  actions: [{label: 'Accept', value: 'accept'}, {label: 'Skip', value: 'skip'}],
  voiceEnabled: boolean
}}

// Partner Status
{ type: 'partner_status', payload: { status: 'waiting' | 'connected' | 'disconnected' }}
```

### 4.4 Data Models

```typescript
interface Session {
  id: string;
  goal: string;
  status: 'pending' | 'invited' | 'accepted' | 'active' | 'completed';
  creatorId: string;
  partnerId: string | null;
  partnerName: string;
  relationshipContext: string;
  scheduledAt: Date | null;
  duration: number; // minutes
  consentStates: {
    creator: { consented: boolean; consentedAt: Date | null };
    partner: { consented: boolean; consentedAt: Date | null };
  };
  facilitatorSettings: FacilitatorSettings;
}

interface Intervention {
  id: string;
  sessionId: string;
  type: 'icebreaker' | 'bridge_insight' | 'neutral_grounding' | 'nudge';
  message: string;
  triggeredAt: Date;
  response: 'accept' | 'skip' | null;
}

interface Artifact {
  id: string;
  sessionId: string;
  type: 'consensus_memo' | 'transcript' | 'equity_structure';
  title: string;
  format: 'pdf' | 'png' | 'docx';
  fileSize: number;
}
```

---

## 5. Phased Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Core infrastructure and Hub screen

**Deliverables:**
- [ ] Next.js 14 project setup (TypeScript, Tailwind, Shadcn/UI)
- [ ] Authentication flow (NextAuth.js)
- [ ] AppShell with responsive navigation
- [ ] Hub page with mock data
- [ ] API client setup
- [ ] Zustand stores (user, ui)
- [ ] User profile page (basic)

**Design Tokens to Extract:**
- Background: `#F5F3EE` (warm beige)
- Primary CTA: `#545B52` (sage/olive)
- Text: `#1A1A1A` (near black)
- Typography: Serif for headings, sans-serif for body

### Phase 2: Session Creation & Invitation (Weeks 4-6)

**Goal:** Complete session creation wizard and consent-first invitation

**Deliverables:**
- [ ] 6-step session creation wizard
- [ ] Partner invitation generation
- [ ] Public `/invite/[token]` page
- [ ] Consent state synchronization
- [ ] Partner profiles page
- [ ] "Decline Privately" functionality

**Backend Work:**
- [ ] `POST /sessions` endpoint
- [ ] `POST /invitations` endpoint
- [ ] `POST /invitations/{token}/respond` endpoint
- [ ] Invitation token generation and validation

### Phase 3: Active Session Experience (Weeks 7-10)

**Goal:** Real-time facilitated sessions

**Deliverables:**
- [ ] WebRTC peer connection (native video)
- [ ] Talk Balance Indicator component
- [ ] Facilitator Settings panel
- [ ] Intervention overlay system
  - [ ] AgentIcebreaker
  - [ ] BridgeInsight
  - [ ] NeutralGrounding (60s timer)
  - [ ] NudgeTrigger
- [ ] WebSocket `/ws/{id}/feedback` integration
- [ ] Session controls (mute, video, end)
- [ ] Zoom/Meet companion HUD
- [ ] Rehearsal Simulation mode
- [ ] Safety Escalation flow

**Backend Work:**
- [ ] `/ws/{client_id}/feedback` WebSocket endpoint
- [ ] `SESSION_STATE` dict implementation
- [ ] Diarization integration for talk-time tracking
- [ ] Intervention trigger logic

### Phase 4: Post-Session & Polish (Weeks 11-13)

**Goal:** Post-session synthesis and production readiness

**Deliverables:**
- [ ] Synthesis Board with AI summary
- [ ] Transcript view
- [ ] Artifact generation and download
- [ ] Share functionality
- [ ] Billing page (Stripe)
- [ ] Zoom OAuth integration
- [ ] Performance optimization
- [ ] E2E tests (Playwright)
- [ ] Production deployment

**Backend Work:**
- [ ] `GET /sessions/{id}/summary` endpoint
- [ ] `GET /sessions/{id}/transcript` endpoint
- [ ] Artifact generation service

---

## 6. Critical Files to Modify/Create

### Backend (Existing Codebase)

| File | Action | Purpose |
|------|--------|---------|
| `core/connection.py` | MODIFY | Add SESSION_STATE dict, extend ConnectionRegistry |
| `app/websockets.py` | MODIFY | Add `/ws/{client_id}/feedback` endpoint |
| `app/routes.py` | MODIFY | Add session and invitation endpoints |
| `app/models.py` | MODIFY | Add Session, Invitation, Artifact models |
| `scripts/meetingbaas.py` | MODIFY | Add diarization tracking, intervention triggers |

### Frontend (New Codebase)

| Path | Purpose |
|------|---------|
| `src/app/(dashboard)/hub/page.tsx` | Hub dashboard |
| `src/app/(dashboard)/sessions/new/` | 6-step creation wizard |
| `src/app/(dashboard)/sessions/[id]/active/page.tsx` | Active session view |
| `src/app/invite/[token]/page.tsx` | Public invitation page |
| `src/components/session/active/TalkBalanceIndicator.tsx` | Circular progress ring |
| `src/components/intervention/` | All intervention overlay components |
| `src/hooks/useWebSocket.ts` | WebSocket connection management |
| `src/hooks/useWebRTC.ts` | Native video handling |
| `src/stores/sessionStore.ts` | Session state management |

---

## 7. Design System Reference

### Colors
- Background: `bg-[#F5F3EE]`
- Card: `bg-white`
- Primary CTA: `bg-[#545B52] text-white`
- Secondary CTA: `border border-gray-300 text-gray-700`
- Accent (Status): `bg-green-500` (Ready), `bg-amber-500` (Waiting)

### Typography
- Headings: Serif font (e.g., "The Hub.", "You're Invited.")
- Body: Sans-serif
- Quotes/Goals: Italic serif in dark cards

### Components
- Cards: Rounded corners (`rounded-xl`), subtle shadow
- Buttons: Rounded full (`rounded-full`) for primary CTAs
- Navigation: Bottom bar (mobile), left sidebar (desktop)
- Talk Balance: Circular ring with percentage label

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Both-party satisfaction | >4.0/5 | Post-session rating |
| Talk-time balance achieved | >60% sessions | 40-60% split reached |
| Intervention rate | <3 per 30min | System logs |
| Intervention helpfulness | >4.0/5 | Post-session rating |
| Session completion | >90% | No early exit |
| Return usage | >60% | Use again within 30 days |

---

## 9. Open Questions

1. **Authentication:** Use NextAuth.js or external provider (Clerk, Auth0)?
2. **Database:** Add PostgreSQL for persistent session data, or extend in-memory for alpha?
3. **File Storage:** Where to store generated artifacts (S3, UploadThing)?
4. **Voice Synthesis:** Use existing Cartesia integration for intervention voice?
5. **Mobile App:** Defer React Native or include in alpha scope?

---

## 10. Next Steps

1. **Immediate:** Set up Next.js project with design system tokens
2. **Week 1:** Implement Hub screen with mock data
3. **Week 2:** Build session creation wizard steps 00-02
4. **Week 3:** Complete invitation flow and consent system
5. **Week 4+:** Follow phased roadmap above

---

## Related Documents

- [DYADIC_ALPHA_MASTER_STRATEGY.md](./DYADIC_ALPHA_MASTER_STRATEGY.md) - Product strategy and intervention philosophy
- [Diadi screens/](./Diadi%20screens/) - UI mockups organized by category

---

*This document synthesizes DYADIC_ALPHA_MASTER_STRATEGY.md with UI mockups from docs/Diadi screens/*
