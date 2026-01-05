# Diadi Frontend - Consolidated Requirements Document

**Version:** 1.0
**Date:** 2026-01-05
**Status:** Consolidated from docs folder
**Sources (all now archived in `docs/archive/`):**
- DYADIC_ALPHA_MASTER_STRATEGY.md (master strategy document)
- PRD_DIADI_FRONTEND_V2.md (latest PRD)
- DIADI_FRONTEND_PRD_CONSOLIDATED.md (consolidated PRD)
- DIADI_FRONTEND_TECHNICAL_SPEC.md (technical spec)
- DIADI_FRONTEND_PRD.md (original PRD)
- DIADI_FRONTEND_TECH_SPEC.md (original tech spec)
- PRD_DIADI_FRONTEND.md (early PRD draft)

**Design References:**
- docs/Diadi screens/* (94 UI mockup screenshots - UX designs extracted in Section 6)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [Target Users & Personas](#3-target-users--personas)
4. [Core Values & Constraints](#4-core-values--constraints)
5. [Alpha Scope (P0)](#5-alpha-scope-p0)
6. [UX Design Specifications](#6-ux-design-specifications)
7. [Functional Requirements](#7-functional-requirements)
8. [Technical Requirements](#8-technical-requirements)
9. [Data Model](#9-data-model)
10. [API Requirements](#10-api-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Success Metrics](#12-success-metrics)
13. [Implementation Phases](#13-implementation-phases)
14. [Open Questions & Risks](#14-open-questions--risks)

---

## 1. Executive Summary

### 1.1 Product Definition
**Diadi** is an AI-powered communication assistant that facilitates difficult conversations between two people who care about each other. Unlike coaching tools that serve one person, Diadi observes both participants and intervenes only when genuinely helpful.

**Core Differentiator:** Real-time facilitation for human-human dyads with symmetric visibility.

**Tagline:** "The AI that helps you have the conversations you've been avoiding."

### 1.2 Alpha Success Criteria
- >= 80% of pairs rate the session 4/5 or higher
- < 3 interventions per 30 minutes
- Talk balance within 40/60 to 60/40 for at least 60% of the session
- Consent completion rate >= 85% of invited partners

---

## 2. Product Vision & Strategy

### 2.1 The Opportunity
No existing product provides real-time facilitation for conversations between two humans with awareness of both participants.

**Market Pain Points:**
| Relationship Type | Pain Point | Scale |
|-------------------|------------|-------|
| Romantic Partners | Communication cited as primary divorce cause | 65-70% of failed marriages |
| Families | Cut off contact due to unresolved conflict | 25%+ of American adults |
| Co-Founders | Breakups kill companies and friendships | 65% of startups fail due to co-founder conflict |
| Professional Partners | Avoid giving honest feedback | 70% of employees |

### 2.2 Competitive Landscape
| Solution Category | Examples | Gap |
|-------------------|----------|-----|
| Performance Coaching | Poised, Gong | Coaches ONE person; creates asymmetry |
| AI Companions | Replika, Character AI | AI IS the relationship; substitutes rather than facilitates |
| Relationship Apps | Lasting, Relish | Asynchronous; no real-time facilitation |
| Passive Transcription | Otter, Fireflies | No active participation |

### 2.3 Our Unique Position
Multi-person facilitation specialists with:
- Multi-Speaker Awareness
- Active Turn Management
- Participation Balancing
- Structured Format Support
- Real-Time Group Analytics

---

## 3. Target Users & Personas

### 3.1 Primary Personas (Alpha)

#### Persona 1: Couples in Conflict
**Maya (34) & David (36)** — Married 7 years, recurring arguments about money
- Jobs to be done: Have budget discussions without fighting; stop shutdown dynamics
- Success: Talk-time balance improves from 70/30 to 55/45; escalation rate decreases 50%

#### Persona 2: Estranged Parent and Adult Child
**Robert (65) & Emma (32)** — Father-daughter with strained communication
- Jobs to be done: Connect as adults; ask questions instead of lecture; discuss unspoken topics
- Success: Balance improves from 80/20 to 60/40; calls last longer voluntarily

#### Persona 3: Partners Making a Major Decision
**Aisha (27) & Marcus (29)** — Dating, long-distance, need to decide future
- Jobs to be done: Make decisions together, not against each other; cover planned topics
- Success: Complete conversation without argument; goal completion >80%

#### Persona 4: Co-Founders at a Crossroads
**Jordan (35) & Alex (33)** — Co-founders facing strategic disagreements
- Jobs to be done: Have the avoided conversation; express concerns without destroying partnership
- Success: Both express unspoken concerns; reach at least one concrete agreement

### 3.2 Secondary Personas (Alpha Stretch)
- Manager with struggling report (Sarah & Riley)
- Close professional partners with difficult dynamics

### 3.3 Out of Scope
- Casual relationships
- Large family groups (3+ people)
- Standard business meetings
- Therapy or crisis intervention

---

## 4. Core Values & Constraints

### 4.1 Values Hierarchy (Priority Order)
| Priority | Value | Product Behavior |
|----------|-------|------------------|
| 1 | **Safe** | Dual consent, visible AI presence, instant disable, crisis escalation |
| 2 | **Respectful** | No side-taking, symmetric visibility, data minimization, no shaming |
| 3 | **Healthy** | Minimal intervention, balance awareness, relationship-serving |
| 4 | **Culturally Aware** | Adapts to communication norms, supports diverse expression styles |
| 5 | **Constructive** | Goal-oriented, forward-moving, actionable outcomes |

### 4.2 Non-Negotiable Constraints
- Serve the relationship, not either individual
- No private coaching to one party
- No hidden AI presence or unilateral reports
- Session-only data by default
- Minimal intervention, visual first, voice only when necessary
- Never present as therapy or crisis support

### 4.3 What We Will NOT Build
| Anti-Feature | Reason |
|--------------|--------|
| Private coaching to one party | Violates symmetric trust |
| Manipulation or persuasion tools | Conflicts with Respectful value |
| "Performance reports" on one partner | Creates asymmetry |
| Therapy replacement | Scope creep; regulatory risk |
| Prediction of relationship outcomes | Ethically problematic |

---

## 5. Alpha Scope (P0)

### 5.1 In Scope
- Hub with active sessions and history
- Session creation wizard (5-step lean flow)
- Partner invitation and dual consent
- External platform support (Zoom, Meet, Teams) via MeetingBaas
- Waiting room and readiness checks
- Live facilitation room with talk balance, timer, AI status
- Visual interventions (balance, silence, time remaining, goal drift)
- Kill switch or pause facilitation
- Post-session summary and rating

### 5.2 Alpha Stretch (P1)
- Facilitator parameter tuning
- Escalation detection and grounding exercises
- Full transcript with AI annotations
- Strategic Intent and Emotional Pulse wizard steps (optional)
- Limited artifact upload and export

### 5.3 Beta (P2)
- Deep Prep studio
- Partner profiles and journey history
- Dyad health score
- Cross-session memory (opt-in)
- Native Diadi video chat
- Translation

### 5.4 Out of Scope for Alpha
- Group calls (3+ participants)
- Therapy replacement or diagnosis
- One-sided performance coaching
- Persistent relationship CRM by default

---

## 6. UX Design Specifications

*Extracted from 94 UI mockup screenshots in `docs/Diadi screens/`*

### 6.1 Visual Design System

#### Color Palette
| Usage | Color | Notes |
|-------|-------|-------|
| Primary Background | Warm cream/off-white (#F5F3EF) | Used across all screens |
| Primary CTA | Dark charcoal (#2D2D2D) | Buttons: "JOIN SESSION", "CONTINUE TO SETUP", etc. |
| Secondary CTA | Olive/Sage green (#6B7B5C) | "LAUNCH SESSION", "RESUME SESSION", "ACCEPT" |
| Text Primary | Dark charcoal (#2D2D2D) | Headlines and body text |
| Text Secondary | Muted gray (#8B8B8B) | Labels, captions |
| Status Indicators | Green (#4CAF50) | Active states, "Ready" indicators |
| Warning/Alert | Amber/Orange (#F59E0B) | Emotional intensity warnings |
| Sidebar/Nav Dark | Dark charcoal (#2D2D2D) | Desktop sidebar, expanded nav |

#### Typography
| Element | Style |
|---------|-------|
| Page Headlines | Large serif font (e.g., "The Hub.", "Facilitator.") |
| Section Headers | All caps, small, spaced tracking (e.g., "READY FOR FACILITATION", "SESSION GOAL") |
| Body Text | Sans-serif, regular weight |
| Button Labels | All caps, medium weight |

#### Component Patterns
- **Cards**: Rounded corners (16px radius), subtle shadow, white background
- **Buttons**: Pill-shaped (full rounded), dark fill with white text for primary
- **Inputs**: Rounded borders, light gray placeholder text
- **Icons**: Minimal line icons for navigation, filled icons for status

### 6.2 Navigation Design

#### Mobile Navigation (Bottom Bar)
**Reference**: `navigation/Screenshot 2025-12-30 232335.png`
- 3 tabs with center CTA button:
  - Home (house icon)
  - Center: New Session button (circular, elevated)
  - People (two-person icon)
- User avatar in bottom-right corner (floating)

#### Desktop Navigation (Side Rail)
**Reference**: `navigation/Screenshot 2025-12-30 232404.png`
- Collapsed state: Icon-only vertical rail on left
  - Home (house icon, highlighted when active)
  - Partners (two-person icon)
  - Artifacts (folder icon)
  - Settings (gear icon)
- Expanded state: Dark panel with:
  - User avatar and name at top
  - "Dashboard" and "Partners" menu items
  - "COLLAPSE" button at bottom

### 6.3 Hub Screen Design

**Reference**: `hub/Screenshot 2025-12-31 013921.png`, `hub/Screenshot 2025-12-31 013934.png`

#### Mobile Layout
- Header: "Talk." logo with search icon
- Active Session Card:
  - Green dot + "READY FOR FACILITATION" status badge
  - Partner name (large, bold)
  - Session goal preview (truncated)
  - "JOIN SESSION" CTA button (dark, full-width)
- Artifact Library section:
  - 2-column grid of artifact cards
  - Each card: Icon + title + file type + size
- Recent Sessions section:
  - "VIEW ALL" link in header
  - List of session cards with icon, title, partner name, date

#### Desktop Layout
- Search bar at top: "Find sessions, partners, or consensus goals..."
- User avatars cluster in top-right ("+2" indicator for more)
- Main content area:
  - "The Hub." headline with tagline
  - Active session card (larger):
    - Status badge
    - Session title (large serif font)
    - Partner joined status + agreement baseline percentage
    - "RESUME SESSION" and "ARCHIVE" buttons
- Session Artifacts Library:
  - 4-column horizontal card row
  - Card types: Consensus Map (PDF), Equity Draft (DOC), Ground Rules (IMG), Sentiment Analysis (XLS)
  - "EXPLORE ALL" link
- Recent Sessions Archive:
  - 2-column card grid
  - Each card: Icon, title, date, partner name, agreement percentage

### 6.4 Session Creation Wizard Design

#### Step 0: Identity & Bond
**Reference**: `session creation/Screenshot 2025-12-31 143620.png`, `session creation/Screenshot 2025-12-31 144126.png`

- Step indicator: "00 / IDENTITY & BOND"
- Headline: "Who are you connecting with?"
- Form fields:
  - "PARTNER'S NAME" - text input with placeholder "e.g. David Miller"
  - "RELATIONSHIP CONTEXT" - textarea with placeholder "Describe your dynamic (e.g. Co-founders, 3 years working together, high trust but recent friction...)"
- CTA: "CONTINUE TO SETUP →" (dark button)

#### Step 2: Facilitator Calibration
**Reference**: `session creation/Screenshot 2025-12-31 143628.png`

- Step indicator: "02 / FACILITATOR CALIBRATION"
- Headline: "Facilitator."
- Two-column layout:
  - Left: "CHOOSE AGENT PERSONA"
    - Radio cards for each persona:
      - **Neutral Mediator** (shield icon, "SELECTED" badge) - default
      - **Deep Empath** (heart icon) - "EMOTIONAL ANCHOR" subtitle
      - **Decision Catalyst** (lightning icon) - "RAPID RESOLUTION" subtitle
  - Right: "AGENT PARAMETERS"
    - Toggle switches:
      - "Interrupt Authority" - ON - "Facilitator may pause speakers to clarify"
      - "Direct Inquiry" - ON - "Asks challenging, data-driven questions"
      - "Silence Detection" - OFF - "Nudges room if silence > 20s"
- CTA: "REVIEW & CONNECT" (dark button)

#### Session Detail & Deep Prep (Pre-Session)
**Reference**: `session creation/Screenshot 2025-12-31 145032.png`

- Desktop layout with sidebar
- Header: Phase badge "PRE-SESSION PHASE" + "Drafting since Dec 31, 2025"
- Right: "LAUNCH SESSION" CTA + "ENCRYPTED CHAMBER" badge
- Main content:
  - Session title (large serif): "Equity Split Discussion."
  - Partner indicator: Avatar + "With David Miller"
  - "SESSION GOAL" card with quoted goal text
  - "CHOSEN FACILITATOR" card with persona icon + "Neutral Mediator" + "ACTIVE CONFIGURATION"
  - "RECENT ARTIFACTS" section
- Deep Prep modal overlay:
  - "AI DEEP PREP LABORATORY" header + "STRATEGIC ADVANTAGE" badge
  - "How would you like to prepare for this conversation?"
  - Two option cards:
    - "Simulate Dialogue" (chat icon)
    - "Draft Opening" (edit icon)

### 6.5 Partner Invitation Design

**Reference**: `partner invitation/Screenshot 2025-12-31 135823.png`

#### Mobile Invitation View
- Header: Mail envelope icon
- Headline: "You're Invited."
- Subtext: "[Inviter name] has invited you to a facilitated talk on Diadi."
- Content card:
  - "PROPOSED AIM" section with quoted goal
  - Schedule: Calendar icon + "TODAY @ 2:00 PM (45M)"
  - Meeting link (truncated URL)
  - Privacy note: "Conversations are E2E encrypted and never stored on centralized servers."
- Actions:
  - "Accept" button (olive green, primary)
  - "Decline Privately" link

#### Desktop Invitation View
- Split layout
- Left: Large "You're Invited." headline with explanation
- Right: Content card with:
  - "CONTEXT & GOAL" header
  - Quoted goal text (italic serif)
  - Clock icon + schedule
  - "Open Meeting Link" link
  - "END-TO-END ENCRYPTED SESSION" badge
- Actions: "ACCEPT" (olive) + "DECLINE" buttons

### 6.6 Waiting Room / Liminal Space Design

**Reference**: `active session (diadi)/Screenshot 2026-01-01 044207.png`

#### Mobile View
- Partner avatar (circular, with status ring)
- Headline: "Waiting for David..."
- Status: "INITIALIZING FACILITATOR"
- Progress bar with "AGENT PRE-CHECK" label
- Status message: "Preparing a neutral space for alignment."

#### Desktop View
- Headline: "You are Ready."
- Subtext: "We are just making sure the partner connection is stable before we begin the facilitated session."
- Readiness checklist (green dots):
  - "Mic: Active"
  - "Agent: Ready"
  - "Partner: Joining" (gray dot = pending)
- Partner photo preview card

### 6.7 Active Session Design

#### Native Diadi Session (Mobile)
**Reference**: `active session (diadi)/Screenshot 2026-01-01 171135.png`

- Video feed (partner's face, full-screen background)
- Top overlay:
  - Session timer (green dot + "12:34")
  - "TALK BALANCE" indicator bar (horizontal, bicolor)
- Right side floating indicators:
  - "CALM" badge (green, emoji icon)
  - "TEN..." badge (truncated tension indicator)
- Bottom controls:
  - Microphone button
  - End call button (red, center)
  - Help/info button
- Facilitator Settings panel (slide-up sheet):
  - "Facilitator Settings" header
  - "Configure AI intervention logic"
  - Toggle switches:
    - "Sentiment Detection" - "AGENT LIVE"
    - "Tension Monitoring" - "ACTIVE"
    - "Facilitated Prompts" - "PAUSED"
  - "✓ APPLY CONFIGURATION" button

#### External Platform HUD (Zoom/Meet)
**Reference**: `active session (zoom_meet)/Screenshot 2026-01-04 103921.png`

- Three-panel comic-style illustration showing:
  - Participant 1 view (with balance indicator overlay)
  - Participant 2 view (headphones)
  - AI analysis panel with:
    - "ACTIVE ANALYSIS" badge
    - Balance percentages (47% / Low)
    - AI prompt: "David, you've established your position. Shall we invite Maya's Converge AI (Red)"

### 6.8 Intervention UI Design

#### Agent Icebreaker
**Reference**: `interventions/Screenshot 2025-12-30 230514.png`

- Modal overlay on video
- Agent avatar icon (circular, branded)
- Header: "AGENT ICEBREAKER"
- Message: Quoted facilitation prompt contextual to session goal
- CTA: "I'LL START" (dark button)

#### Kill Switch / Pause Modal
**Reference**: `interventions/Screenshot 2025-12-30 230628.png`

- Centered modal dialog
- Pause icon (circle with two bars)
- Headline: "Mute Agent?"
- Explanation: "Pausing the facilitator stops all interventions and data tracking immediately."
- Participant status: "MAYA: READY" + "DAVID: READY"
- Actions:
  - "PAUSE AI FACILITATION" (dark button, primary)
  - "CANCEL" link

#### Emotional Intensity Alert
**Reference**: `interventions/Screenshot 2025-12-30 231018.png`

- Dark overlay banner at bottom of screen
- Warning icon (triangle)
- Headline: "Emotional Intensity High"
- Message: "I'm detecting significant tension. Would a 2-minute breath-pause help both of you?"
- Actions:
  - "PAUSE SESSION" button
  - "CONTINUE" button
- Badge: "AI INTERVENTION ACTIVE"

#### Goal Re-sync
**Reference**: `interventions/Screenshot 2025-12-30 232647.png`

- Dark full-screen overlay
- Animated loading indicator (dashed circle)
- Message: "Re-syncing with Goal..."
- Badge: "DIADI AGENT"

### 6.9 Post-Session Recap Design

#### Transcript View
**Reference**: `session detail/post-session/Screenshot 2025-12-30 173732.png`

- Header: "RECAP 02: TRANSCRIPT" badge (olive)
- Back button: "← EQUITY REVIEW"
- Headline: "Full Transcript"
- Chat-style layout:
  - Participant messages with:
    - Avatar + name + timestamp
    - Message bubble (rounded, light background)
  - AI annotation inline:
    - Green accent bar on left
    - Italic text: "AI Prompted: '[insight]'"
- Search bar: "Search Keywords..." with filter icon
- Footer note: "The Record: Transcripts are enriched with AI annotations"

#### Synthesis Board (Summary)
**Reference**: `session detail/post-session/Screenshot 2026-01-04 092600.png`

- Header: "RECAP 1 / SYNTHESIS BOARD"
- Navigation: Back arrow + "RECAP MODE" badge + timestamp
- Actions: "SHARE RECAP" + "DOWNLOAD PDF" buttons
- Main content card:
  - "AI CONSENSUS SUMMARY" header
  - Large italic serif quote summarizing outcome
- Key Agreements section:
  - Two cards in row:
    - "KEY AGREEMENT 1": Title + description
    - "KEY AGREEMENT 2": Title + description
- Right sidebar:
  - "ACTION ITEMS" section with checkboxes
  - "GENERATED ASSETS" section with downloadable files (PDF, PNG)

### 6.10 Partner Profile Design (Beta)

**Reference**: `partner profiles/Screenshot 2025-12-30 225626.png`

- Header: "Partner Perspective"
- CTA: "START TALK WITH DAVID" (olive button)
- Main content:
  - Partner photo (circular) with edit badge
  - Name + role: "David Miller" / "CO-FOUNDER PARTNER"
  - "DYAD HEALTH" score: 92% with progress bar
- "AI NEXT STEP RECOMMENDATIONS" section:
  - Two recommendation cards
- "ACTIVE GOAL" card:
  - Goal title + alignment percentage
- "JOURNEY HISTORY WITH DAVID" list:
  - Session entries with titles + dates

### 6.11 User Profile Design

**Reference**: `user profile/Screenshot 2025-12-30 225714.png`

- User avatar (large, centered)
- Name + membership: "Maya Jenkins" / "PREMIUM MEMBER • SINCE 2024"
- "ACCOUNT MANAGEMENT" section:
  - "Email Settings" row with arrow
  - "Billing & Subscription" row with arrow
- "MY ASSISTANTS" section:
  - Active facilitator: "The Neutral Mediator" / "ACTIVE DEFAULT"
- "INTEGRATIONS" section:
  - Platform icons with "ACTIVE" / "LINK" status badges

### 6.12 Screen-to-Feature Mapping

| Feature | Screenshots | Notes |
|---------|-------------|-------|
| Hub | `hub/*` (2) | Mobile + desktop responsive layouts |
| Navigation | `navigation/*` (4) | Bottom bar, side rail, collapsed/expanded |
| Session Creation | `session creation/*` (14) | 5-step wizard + variants |
| Partner Invitation | `partner invitation/*` (6) | Mobile + desktop, accept/decline flows |
| Waiting Room | `active session (diadi)/*` | Liminal space initialization |
| Live Session (Native) | `active session (diadi)/*` (11) | Video call with AI overlay |
| Live Session (External) | `active session (zoom_meet)/*` (6) | HUD for Zoom/Meet/Teams |
| Interventions | `interventions/*` (21) | Balance, silence, escalation, icebreaker, kill switch |
| Pre-Session Detail | `session detail/pre-session/*` (6) | Session setup + deep prep |
| During Session | `session detail/during-session/*` (1) | Active session state |
| Post-Session Recap | `session detail/post-session/*` (9) | Summary, transcript, ratings |
| Partner Profiles | `partner profiles/*` (5) | Beta feature - dyad health |
| User Profile | `user profile/*` (2) | Account + integrations |
| Complications | `complications/*` (7) | Edge cases + error states |

---

## 7. Functional Requirements

### 7.1 Hub
**Requirements:**
- Show active sessions with status (ready, in progress, completed)
- Primary CTA to start a new session
- Show recent sessions list with date and partner
- Show lightweight artifact area only if artifacts exist

**Acceptance Criteria:**
- Empty states for no sessions, no artifacts
- Search field supports sessions and partners (no advanced filtering in alpha)

### 7.2 Session Creation Wizard
**5-Step Lean Flow:**
1. **Identity and Bond** - Partner name and relationship context
2. **Session Goal** - Goal text (max 200 chars), schedule (now or later), duration
3. **Facilitator Selection** - Persona selection (default: Neutral Mediator)
4. **Review and Connect** - Summary and invitation creation
5. **Launch Hub** - Invite link, platform selection, meeting link input

**Facilitator Personas:**
- Neutral Mediator (default) - Balanced, non-judgmental facilitation
- Deep Empath - Emotionally attuned, validation-focused
- Decision Catalyst - Action-oriented, decision-driving

### 7.3 Invitation and Consent
**Acceptance Criteria:**
- Invitee sees goal, time, duration, and AI consent explanation
- Invitee can accept or decline privately (inviter not notified of decline)
- Session cannot start until both consented
- Consent state visible to both participants

**Consent Information Shown:**
- "An AI will observe your conversation"
- "BOTH of you see the same information"
- "Either can pause anytime"
- "Nothing is stored by default"

### 7.4 Launch and Waiting Room
**Acceptance Criteria:**
- Show readiness status (mic, camera, agent ready)
- Show partner status (waiting, joining, joined)
- Allow copying invite link
- If external platform is selected, show meeting link and "Open meeting" button

### 7.5 Active Session UI
**Surfaces:**
- Live facilitation room in Diadi app
- External meeting running separately (Zoom/Meet/Teams)

**Acceptance Criteria:**
- Always-visible AI status indicator (Listening, Preparing, Intervening, Paused)
- Talk balance indicator updates every 1-2 seconds
- Session timer and time remaining
- Goal snippet visible in the live room
- Kill switch or pause facilitation available at all times

### 7.6 Intervention System

**Intervention Policy:**
- Visual-first, voice only for severe cases
- No more than 1 intervention every 2 minutes

**Triggers (Defaults):**
| Trigger | Threshold | Modality |
|---------|-----------|----------|
| Balance | > 65/35 for 3 minutes | Visual prompt |
| Balance (severe) | > 70/30 for 5 minutes | Voice prompt (optional) |
| Silence | > 15 seconds | Visual prompt |
| Goal drift | Off-goal > 2 minutes | Visual prompt |
| Time remaining | < 5 minutes | Visual prompt |
| Escalation | Tension score > 0.7 for 30s | Voice prompt |

**Intervention Blockers (When AI MUST NOT Intervene):**
- Either party mid-sentence
- Emotional disclosure in progress
- < 30 seconds since last intervention
- Repair attempt in progress
- First 3 minutes of session
- Grief or crisis expression

**Intervention Templates:**
- Balance Visual: "[Name] hasn't shared their perspective yet"
- Balance Voice: "I notice the conversation has been a bit one-sided. [Name], would you like to share your thoughts?"
- Silence: "Taking a moment..."
- Time: "You have about 5 minutes left. You mentioned wanting to discuss [topic]—would you like to touch on that?"
- Escalation: "I sense some tension rising. Would a 2-minute break help?"

### 7.7 Kill Switch
**Requirements:**
- Immediate effect with no confirmation
- Both participants notified
- Re-enable only with explicit consent from both parties

### 7.8 Post-Session Recap
**Acceptance Criteria:**
- Summary generated within 30 seconds of session end
- Summary includes: goal, consensus, key points, action items, balance stats
- Rating prompt for AI presence (1-5)
- Transcript view only if backend supports transcription (P1)

### 7.9 Profile and Integrations
**Acceptance Criteria:**
- Basic account details and subscription status
- Integrations section shows MeetingBaas status (active or not configured)

---

## 8. Technical Requirements

### 8.1 Frontend Stack
- **Framework:** Next.js 14 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + component primitives (shadcn/ui)
- **State Management:** Zustand for session UI state
- **Server State:** TanStack Query
- **Validation:** Zod for runtime validation

### 8.2 Frontend Directory Structure
```
web/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── hub/
│   │   │   ├── sessions/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   │       └── live/
│   │   │   └── profile/
│   │   └── invite/[token]/
│   ├── components/
│   │   ├── ui/
│   │   ├── hub/
│   │   ├── session/
│   │   ├── intervention/
│   │   └── navigation/
│   ├── hooks/
│   ├── lib/api/
│   ├── stores/
│   └── types/
```

### 8.3 Backend Requirements (Additions to Existing)
**New Endpoints Required:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| /sessions | POST | Create session |
| /sessions | GET | List sessions |
| /sessions/{id} | GET | Get session |
| /sessions/{id}/consent | POST | Record consent |
| /sessions/{id}/start | POST | Start session |
| /sessions/{id}/end | POST | End session |
| /sessions/{id}/summary | GET | Get summary |
| /sessions/{id}/events | WS | Event stream |

**Existing Endpoints (Current Backend):**
| Endpoint | Purpose |
|----------|---------|
| POST /bots | Create MeetingBaas bot |
| DELETE /bots/{bot_id} | Remove bot |
| WebSocket /ws/{client_id}/output | Audio stream from meeting |
| WebSocket /ws/{client_id}/input | Audio stream to meeting |

### 8.4 Real-Time Event Stream
**Primary Endpoint:** WebSocket `/sessions/{session_id}/events`

**Event Types:**
- `session_state`
- `balance_update`
- `intervention`
- `escalation`
- `time_remaining`
- `goal_drift`
- `participant_status`

**Balance Update Payload Example:**
```json
{
  "type": "balance_update",
  "data": {
    "participantA": { "id": "p1", "name": "Maya", "percentage": 55 },
    "participantB": { "id": "p2", "name": "David", "percentage": 45 },
    "status": "balanced"
  }
}
```

### 8.5 New Personas to Create
Three new personas in `config/personas/`:

1. **neutral_mediator** - Balanced, non-judgmental facilitation
2. **deep_empath** - Emotionally attuned, validation-focused
3. **decision_catalyst** - Action-oriented, decision-driving

---

## 9. Data Model

### 9.1 Core Entities (TypeScript)
```typescript
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
  inviteToken: string;
  botId?: string;
  clientId?: string;
}

interface TalkBalanceMetrics {
  participantA: number;
  participantB: number;
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

### 9.2 Session State Machine
```
draft -> pending_consent -> ready -> in_progress -> ended -> archived
                                  |
                                  v
                               paused
                                  |
                                  v
                            in_progress
```

---

## 10. API Requirements

### 10.1 Session Management Endpoints

**POST /sessions**
```json
Request: {
  "goal": "string",
  "relationshipContext": "string",
  "facilitator": { "persona": "neutral_mediator" },
  "durationMinutes": 30,
  "scheduledAt": "ISO8601 | null",
  "platform": "meet"
}
Response: {
  "sessionId": "string",
  "status": "draft",
  "inviteLink": "string",
  "inviteToken": "string"
}
```

**POST /sessions/{id}/consent**
```json
Request: {
  "participantId": "string | null",
  "inviteToken": "string",
  "consented": true
}
Response: {
  "status": "ready",
  "participants": [...]
}
```

**POST /sessions/{id}/start**
```json
Request: {
  "meetingUrl": "https://meet.google.com/xxx"
}
Response: {
  "status": "in_progress",
  "botId": "string",
  "clientId": "string",
  "eventUrl": "wss://..."
}
```

### 10.2 Backend Modifications Required
- Extend `/bots` response to include `client_id` and `websocket_url`
- Store mapping of `session_id` -> `bot_id`, `client_id`
- Emit UI events from Pipecat (balance updates, interventions, time remaining)
- Add speaker diarization for talk balance tracking

---

## 11. Non-Functional Requirements

### 11.1 Performance
- Initial page load <= 2 seconds on broadband
- Real-time updates <= 1 second latency
- All primary flows usable on 360x640 and 1280x720

### 11.2 Accessibility
- Contrast ratio >= 4.5:1 for text
- Keyboard navigable forms and dialogs
- Screen reader labels for controls and status indicators

### 11.3 Privacy and Security
- Session-only data by default, no recording unless explicitly enabled
- Clear consent language before any facilitation begins
- Audit logging for consent and kill switch events
- E2E encryption where possible

### 11.4 Reliability
- Graceful degradation if real-time metrics fail
- Fallback UI states when WebSocket is disconnected
- Reconnection logic with exponential backoff

---

## 12. Success Metrics

### 12.1 North Star Metric
**"Conversations that felt better"**: Percentage of facilitated conversations where BOTH participants rate the experience as better than they would have had without facilitation.

### 12.2 Primary Metrics
| Metric | Target |
|--------|--------|
| Both-party satisfaction | >4.0/5 average |
| Talk-time balance achieved | >60% of sessions reach 40-60% split |
| Goal completion | >80% addressed |
| Session completion | >90% |
| Return usage | >60% within 30 days |

### 12.3 Facilitation Quality Metrics
| Metric | Target |
|--------|--------|
| Intervention rate | <3 per 30-min session |
| Intervention helpfulness | >4.0/5 |
| Escalation prevention | >80% of escalation events |
| False positive rate | <10% |

### 12.4 Analytics Events
- session_created
- invitation_sent
- consent_accepted / consent_declined
- session_started
- intervention_triggered
- kill_switch_used
- session_ended
- summary_viewed
- rating_submitted

---

## 13. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Backend:**
- Add session data models
- Implement SessionService with in-memory storage
- Add session CRUD endpoints
- Modify `/bots` to return `client_id`
- Create new Diadi personas

**Frontend:**
- Initialize Next.js 14 project in `web/`
- Set up Tailwind + shadcn/ui
- Create API client and types
- Implement basic navigation
- Create Hub page with empty states

### Phase 2: Session Creation (Week 2-3)
**Backend:**
- Add invite token generation and lookup
- Implement consent endpoints

**Frontend:**
- Build 5-step session creation wizard
- Create SessionCard and SessionList components
- Add form validation and state management

### Phase 3: Invitation & Consent (Week 3-4)
**Backend:**
- Add consent tracking per participant
- Implement session status transitions

**Frontend:**
- Build invite page (`/invite/[token]`)
- Create ConsentForm with AI explanation
- Implement waiting room with partner status

### Phase 4: Live Session (Week 4-5)
**Backend:**
- Add `/sessions/{id}/events` WebSocket endpoint
- Emit balance_update, intervention, time_remaining events
- Integrate speaker diarization

**Frontend:**
- Build Live Facilitation Room
- Implement useSessionEvents WebSocket hook
- Create TalkBalance, AIStatusIndicator components
- Implement KillSwitch

### Phase 5: Interventions (Week 5-6)
**Backend:**
- Add intervention logic in Pipecat
- Implement intervention guardrails

**Frontend:**
- Build InterventionCard component
- Create BalancePrompt, SilencePrompt, TimeWarning variants

### Phase 6: Post-Session (Week 6-7)
**Backend:**
- Add summary generation endpoint
- Store session summary on end

**Frontend:**
- Build Summary component
- Add rating prompt

### Phase 7: Polish & Testing (Week 7-8)
- Mobile responsive testing
- Accessibility audit
- Performance optimization
- End-to-end testing

---

## 14. Open Questions & Risks

### 14.1 Open Questions
1. **Authentication**: How will users authenticate (email magic link, SSO, internal only)?
2. **Platform Priority**: Which meeting platform first (Zoom vs Meet vs Teams)?
3. **Data Retention**: What data is retained by default for summaries and transcripts?
4. **Talk Balance Implementation**: MeetingBaas speaker diarization vs Pipecat-level tracking?
5. **Analytics Provider**: Segment, Amplitude, or custom?

### 14.2 Key Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users find AI intrusive | Medium | High | Minimal intervention philosophy; easy disable; user testing |
| Speaker diarization errors | Medium | High | Confidence thresholds; graceful degradation |
| Interventions feel awkward | High | Medium | Human-written templates; extensive testing |
| Privacy/consent concerns | Medium | High | Radical transparency; data minimization |
| WebSocket reliability | Medium | Medium | Reconnection logic; fallback UI |

### 14.3 Dependencies (Ordered by Priority)

**Critical Path (must be completed in order):**
1. **Authentication system** - Blocks all user-facing features
2. **Session data model + CRUD endpoints** - Blocks session creation UI
3. **Invite token system** - Blocks partner invitation flow
4. **Consent tracking** - Blocks session start (both must consent)
5. **MeetingBaas bot integration** - Blocks live session launch
6. **WebSocket event stream** - Blocks real-time UI updates
7. **Speaker diarization** - Blocks talk balance feature
8. **Intervention logic in Pipecat** - Blocks AI interventions
9. **Summary generation** - Blocks post-session recap

**External Dependencies:**
- MeetingBaas API key and account configuration
- Cartesia voice API for facilitator speech
- Deepgram/Gladia for speech-to-text
- OpenAI API for LLM intelligence

**Design Dependencies:**
- Design references available in `docs/Diadi screens/`
- Some screenshots show scrolled states (hub, post-session) - review full viewport designs
- Mobile/desktop breakpoints need design review at 360px and 1280px

**Security Reviews Required:**
- MeetingBaas API key handling
- Invite token generation and validation
- Consent audit logging
- Session data retention policies

---

## Appendix A: Design References - Complete Screenshot Inventory

**Total: 94 UI mockup screenshots** organized by category in `docs/Diadi screens/`

**Note:** Some screenshots show scrolled viewport states. Multiple screenshots of the same screen may represent:
- Different scroll positions (above/below fold)
- Different device sizes (mobile vs desktop)
- Different states (empty, filled, loading, error)

### Hub (2 screens)
| File | Description |
|------|-------------|
| `hub/Screenshot 2025-12-31 013921.png` | Hub main view - mobile + desktop, above fold with active session card |
| `hub/Screenshot 2025-12-31 013934.png` | Hub scrolled state - artifacts library + recent sessions archive |

### Navigation (4 screens)
| File | Description |
|------|-------------|
| `navigation/Screenshot 2025-12-30 232335.png` | Mobile bottom nav bar - Home, New Session (center), People |
| `navigation/Screenshot 2025-12-30 232345.png` | Mobile nav with user avatar |
| `navigation/Screenshot 2025-12-30 232404.png` | Desktop side rail - expanded state with menu items |
| `navigation/Screenshot 2025-12-30 232717.png` | Desktop side rail - collapsed icon-only state |

### Partner Invitation (6 screens)
| File | Description |
|------|-------------|
| `partner invitation/Screenshot 2025-12-31 135823.png` | Invitation landing - mobile + desktop views with accept/decline |
| `partner invitation/Screenshot 2025-12-31 135832.png` | Invitation with goal + schedule details |
| `partner invitation/Screenshot 2025-12-31 135840.png` | Invitation scrolled - privacy/encryption notice |
| `partner invitation/Screenshot 2025-12-31 150015.png` | Pre-session detail after acceptance |
| `partner invitation/Screenshot 2025-12-31 150019.png` | Pre-session scrolled state |
| `partner invitation/Screenshot 2025-12-31 150025.png` | Pre-session with partner status |

### Session Creation (14 screens)
| File | Description |
|------|-------------|
| `session creation/Screenshot 2025-12-31 143620.png` | Step 0: Identity & Bond - desktop view |
| `session creation/Screenshot 2025-12-31 143623.png` | Step 0: Identity & Bond - with form fields |
| `session creation/Screenshot 2025-12-31 143628.png` | Step 2: Facilitator Calibration - persona selection |
| `session creation/Screenshot 2025-12-31 143631.png` | Step 2: Agent parameters toggles |
| `session creation/Screenshot 2025-12-31 143635.png` | Step 2: Facilitator scrolled state |
| `session creation/Screenshot 2025-12-31 144126.png` | Step 0: Mobile view - Identity & Bond |
| `session creation/Screenshot 2025-12-31 144128.png` | Step 1: Session Goal - mobile |
| `session creation/Screenshot 2025-12-31 144131.png` | Step 1: Goal + schedule input |
| `session creation/Screenshot 2025-12-31 144134.png` | Step 3: Review & Connect |
| `session creation/Screenshot 2025-12-31 144137.png` | Step 4: Launch Hub - invite link |
| `session creation/Screenshot 2025-12-31 145032.png` | Session Detail - pre-session with Deep Prep modal |
| `session creation/Screenshot 2025-12-31 145037.png` | Session Detail - scrolled, showing artifacts |
| `session creation/Screenshot 2025-12-31 145040.png` | Session Detail - desktop full view |
| `session creation/Screenshot 2025-12-31 145044.png` | Session Detail - launch ready state |

### Active Session - Native Diadi (11 screens)
| File | Description |
|------|-------------|
| `active session (diadi)/Screenshot 2026-01-01 044207.png` | Waiting room / Liminal space - mobile + desktop |
| `active session (diadi)/Screenshot 2026-01-01 171135.png` | Active call - talk balance + sentiment indicators |
| `active session (diadi)/Screenshot 2026-01-01 172756.png` | Active call with facilitator settings panel |
| `active session (diadi)/Screenshot 2026-01-01 175050.png` | Active call - tension indicator visible |
| `active session (diadi)/Screenshot 2026-01-01 175056.png` | Active call - calm state indicator |
| `active session (diadi)/Screenshot 2026-01-01 180318.png` | Active call - full controls visible |
| `active session (diadi)/Screenshot 2026-01-01 180330.png` | Active call - alternate view |
| `active session (diadi)/Screenshot 2026-01-01 180515.png` | Facilitator settings - sentiment detection ON |
| `active session (diadi)/Screenshot 2026-01-01 180519.png` | Facilitator settings - tension monitoring ON |
| `active session (diadi)/Screenshot 2026-01-01 180545.png` | Facilitator settings - prompts paused |
| `active session (diadi)/Screenshot 2026-01-01 183104.png` | Active call - end session state |

### Active Session - Zoom/Meet Integration (6 screens)
| File | Description |
|------|-------------|
| `active session (zoom_meet)/Screenshot 2025-12-30 230744.png` | External HUD concept - overlay on meeting |
| `active session (zoom_meet)/Screenshot 2026-01-04 103921.png` | 3-panel view - both participants + AI analysis |
| `active session (zoom_meet)/Screenshot 2026-01-04 103935.png` | HUD with balance percentages visible |
| `active session (zoom_meet)/Screenshot 2026-01-04 104525.png` | AI intervention prompt overlay |
| `active session (zoom_meet)/Screenshot 2026-01-04 104556.png` | HUD compact mode |
| `active session (zoom_meet)/Screenshot 2026-01-04 104611.png` | HUD expanded analysis panel |

### Interventions (21 screens)
*Note: Multiple screenshots cover various intervention types and states*
| File | Description |
|------|-------------|
| `interventions/Screenshot 2025-12-30 180210.png` | Balance intervention - visual prompt |
| `interventions/Screenshot 2025-12-30 180217.png` | Balance intervention - expanded |
| `interventions/Screenshot 2025-12-30 1801217.png` | Silence detection prompt |
| `interventions/Screenshot 2025-12-30 1802101.png` | Goal drift intervention |
| `interventions/Screenshot 2025-12-30 1802117.png` | Time warning - 5 min remaining |
| `interventions/Screenshot 2025-12-30 1810210.png` | Escalation detection |
| `interventions/Screenshot 2025-12-30 2010948.png` | AI thinking/preparing state |
| `interventions/Screenshot 2025-12-30 2100948.png` | Intervention dismissed state |
| `interventions/Screenshot 2025-12-30 230514.png` | Agent Icebreaker modal |
| `interventions/Screenshot 2025-12-30 230526.png` | Icebreaker - alternate text |
| `interventions/Screenshot 2025-12-30 230610.png` | Mid-session prompt |
| `interventions/Screenshot 2025-12-30 230628.png` | Kill Switch / Mute Agent modal |
| `interventions/Screenshot 2025-12-30 231018.png` | Emotional Intensity High alert |
| `interventions/Screenshot 2025-12-30 231042.png` | Tension alert - pause offered |
| `interventions/Screenshot 2025-12-30 232647.png` | Goal re-sync loading state |
| `interventions/Screenshot 2025-12-30 232656.png` | Goal re-sync complete |
| `interventions/Screenshot 2025-12-30 233249.png` | Balance visual - name prompt |
| `interventions/Screenshot 2025-12-30 233254.png` | Balance visual - persistent |
| `interventions/Screenshot 2025-12-30 233258.png` | Intervention history/log |
| `interventions/Screenshot 2025-12-30 233334.png` | Intervention settings |
| `interventions/Screenshot 2025-12-310 200948.png` | Voice intervention indicator |

### Session Detail - Pre-Session (6 screens)
| File | Description |
|------|-------------|
| `session detail/pre-session/Screenshot 2025-12-31 150007.png` | Pre-session - waiting for partner consent |
| `session detail/pre-session/Screenshot 2025-12-31 150015.png` | Pre-session - partner invite sent |
| `session detail/pre-session/Screenshot 2025-12-31 150019.png` | Pre-session - scrolled, artifacts visible |
| `session detail/pre-session/Screenshot 2025-12-31 150025.png` | Pre-session - both parties consented |
| `session detail/pre-session/Screenshot 2026-01-04 092056.png` | Pre-session - launch ready state |
| `session detail/pre-session/Screenshot 2026-01-04 092507.png` | Pre-session - desktop full layout |

### Session Detail - During Session (1 screen)
| File | Description |
|------|-------------|
| `session detail/during-session/Screenshot 2026-01-02 170340.png` | During session - live status indicators |

### Session Detail - Post-Session (9 screens)
*Note: Multiple screenshots show scrolled states of recap views*
| File | Description |
|------|-------------|
| `session detail/post-session/Screenshot 2025-12-30 173732.png` | Transcript view - chat-style with AI annotations |
| `session detail/post-session/Screenshot 2025-12-30 2039391.png` | Transcript scrolled - more messages |
| `session detail/post-session/Screenshot 2025-12-30 204653.png` | Summary - key agreements section |
| `session detail/post-session/Screenshot 2025-12-30 205020.png` | Summary scrolled - action items |
| `session detail/post-session/Screenshot 2025-12-30 225213.png` | Summary - generated assets section |
| `session detail/post-session/Screenshot 2025-12-30 225319.png` | Summary - download/share options |
| `session detail/post-session/Screenshot 2026-01-04 092600.png` | Synthesis Board - AI consensus summary |
| `session detail/post-session/Screenshot 2026-01-04 092605.png` | Synthesis Board scrolled - key agreements |
| `session detail/post-session/Screenshot 2026-01-04 092614.png` | Synthesis Board - action items + assets sidebar |

### Partner Profiles (5 screens) - Beta Feature
| File | Description |
|------|-------------|
| `partner profiles/Screenshot 2025-12-30 1815105.png` | Partner profile - mobile view |
| `partner profiles/Screenshot 2025-12-30 204653.png` | Partner profile - dyad health score |
| `partner profiles/Screenshot 2025-12-30 225626.png` | Partner Perspective - desktop with recommendations |
| `partner profiles/Screenshot 2025-12-30 232021.png` | Partner profile - journey history |
| `partner profiles/Screenshot 2025-12-30 232118.png` | Partner profile scrolled - past sessions list |

### User Profile (2 screens)
| File | Description |
|------|-------------|
| `user profile/Screenshot 2025-12-30 192703.png` | User profile - desktop full view |
| `user profile/Screenshot 2025-12-30 225714.png` | User profile - mobile with integrations |

### Complications (7 screens)
*Note: Edge cases, error states, and unusual flows*
| File | Description |
|------|-------------|
| `complications/Screenshot 2025-12-30 231126.png` | Partner declined invitation |
| `complications/Screenshot 2025-12-30 231131.png` | Connection lost state |
| `complications/Screenshot 2025-12-30 231135.png` | Partner left session |
| `complications/Screenshot 2025-12-30 231138.png` | Session timeout warning |
| `complications/Screenshot 2025-12-30 231141.png` | Audio/mic issue detected |
| `complications/Screenshot 2025-12-30 231144.png` | Bot join failed |
| `complications/Screenshot 2025-12-30 231159.png` | Reconnection in progress |

## Appendix B: Coherence Decisions
- Product name is **Diadi**. Use "Talk" as a section label only, not as the brand.
- "Facilitator" is the system role. "Neutral Mediator", "Deep Empath", and "Decision Catalyst" are persona labels.
- External meeting platform is the alpha default. "Diadi Video Chat" is marked "Coming soon" until Beta.
- Deep Prep screens are Beta. In Alpha, show disabled or hidden entry points.
- Dyad health, AI recommendations, and journey insights are Beta. Hide or show as placeholders.

---

*This document consolidates requirements from all docs folder sources for the Diadi Frontend Alpha implementation.*
