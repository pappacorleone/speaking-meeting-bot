# Diadi Frontend - Consolidated Requirements Document

**Version:** 1.0
**Date:** 2026-01-05
**Status:** Consolidated from docs folder
**Sources:**
- docs/DYADIC_ALPHA_MASTER_STRATEGY.md
- docs/PRD_DIADI_FRONTEND_V2.md
- docs/DIADI_FRONTEND_PRD_CONSOLIDATED.md
- docs/DIADI_FRONTEND_TECHNICAL_SPEC.md
- docs/meeting-agent-platform-ux-recommendations.md
- docs/archive/* (archived PRDs and specs)

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [Target Users & Personas](#3-target-users--personas)
4. [Core Values & Constraints](#4-core-values--constraints)
5. [Alpha Scope (P0)](#5-alpha-scope-p0)
6. [Functional Requirements](#6-functional-requirements)
7. [Technical Requirements](#7-technical-requirements)
8. [Data Model](#8-data-model)
9. [API Requirements](#9-api-requirements)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Success Metrics](#11-success-metrics)
12. [Implementation Phases](#12-implementation-phases)
13. [Open Questions & Risks](#13-open-questions--risks)

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

## 6. Functional Requirements

### 6.1 Hub
**Requirements:**
- Show active sessions with status (ready, in progress, completed)
- Primary CTA to start a new session
- Show recent sessions list with date and partner
- Show lightweight artifact area only if artifacts exist

**Acceptance Criteria:**
- Empty states for no sessions, no artifacts
- Search field supports sessions and partners (no advanced filtering in alpha)

### 6.2 Session Creation Wizard
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

### 6.3 Invitation and Consent
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

### 6.4 Launch and Waiting Room
**Acceptance Criteria:**
- Show readiness status (mic, camera, agent ready)
- Show partner status (waiting, joining, joined)
- Allow copying invite link
- If external platform is selected, show meeting link and "Open meeting" button

### 6.5 Active Session UI
**Surfaces:**
- Live facilitation room in Diadi app
- External meeting running separately (Zoom/Meet/Teams)

**Acceptance Criteria:**
- Always-visible AI status indicator (Listening, Preparing, Intervening, Paused)
- Talk balance indicator updates every 1-2 seconds
- Session timer and time remaining
- Goal snippet visible in the live room
- Kill switch or pause facilitation available at all times

### 6.6 Intervention System

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

### 6.7 Kill Switch
**Requirements:**
- Immediate effect with no confirmation
- Both participants notified
- Re-enable only with explicit consent from both parties

### 6.8 Post-Session Recap
**Acceptance Criteria:**
- Summary generated within 30 seconds of session end
- Summary includes: goal, consensus, key points, action items, balance stats
- Rating prompt for AI presence (1-5)
- Transcript view only if backend supports transcription (P1)

### 6.9 Profile and Integrations
**Acceptance Criteria:**
- Basic account details and subscription status
- Integrations section shows MeetingBaas status (active or not configured)

---

## 7. Technical Requirements

### 7.1 Frontend Stack
- **Framework:** Next.js 14 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + component primitives (shadcn/ui)
- **State Management:** Zustand for session UI state
- **Server State:** TanStack Query
- **Validation:** Zod for runtime validation

### 7.2 Frontend Directory Structure
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

### 7.3 Backend Requirements (Additions to Existing)
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

### 7.4 Real-Time Event Stream
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

### 7.5 New Personas to Create
Three new personas in `config/personas/`:

1. **neutral_mediator** - Balanced, non-judgmental facilitation
2. **deep_empath** - Emotionally attuned, validation-focused
3. **decision_catalyst** - Action-oriented, decision-driving

---

## 8. Data Model

### 8.1 Core Entities (TypeScript)
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

### 8.2 Session State Machine
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

## 9. API Requirements

### 9.1 Session Management Endpoints

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

### 9.2 Backend Modifications Required
- Extend `/bots` response to include `client_id` and `websocket_url`
- Store mapping of `session_id` -> `bot_id`, `client_id`
- Emit UI events from Pipecat (balance updates, interventions, time remaining)
- Add speaker diarization for talk balance tracking

---

## 10. Non-Functional Requirements

### 10.1 Performance
- Initial page load <= 2 seconds on broadband
- Real-time updates <= 1 second latency
- All primary flows usable on 360x640 and 1280x720

### 10.2 Accessibility
- Contrast ratio >= 4.5:1 for text
- Keyboard navigable forms and dialogs
- Screen reader labels for controls and status indicators

### 10.3 Privacy and Security
- Session-only data by default, no recording unless explicitly enabled
- Clear consent language before any facilitation begins
- Audit logging for consent and kill switch events
- E2E encryption where possible

### 10.4 Reliability
- Graceful degradation if real-time metrics fail
- Fallback UI states when WebSocket is disconnected
- Reconnection logic with exponential backoff

---

## 11. Success Metrics

### 11.1 North Star Metric
**"Conversations that felt better"**: Percentage of facilitated conversations where BOTH participants rate the experience as better than they would have had without facilitation.

### 11.2 Primary Metrics
| Metric | Target |
|--------|--------|
| Both-party satisfaction | >4.0/5 average |
| Talk-time balance achieved | >60% of sessions reach 40-60% split |
| Goal completion | >80% addressed |
| Session completion | >90% |
| Return usage | >60% within 30 days |

### 11.3 Facilitation Quality Metrics
| Metric | Target |
|--------|--------|
| Intervention rate | <3 per 30-min session |
| Intervention helpfulness | >4.0/5 |
| Escalation prevention | >80% of escalation events |
| False positive rate | <10% |

### 11.4 Analytics Events
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

## 12. Implementation Phases

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

## 13. Open Questions & Risks

### 13.1 Open Questions
1. **Authentication**: How will users authenticate (email magic link, SSO, internal only)?
2. **Platform Priority**: Which meeting platform first (Zoom vs Meet vs Teams)?
3. **Data Retention**: What data is retained by default for summaries and transcripts?
4. **Talk Balance Implementation**: MeetingBaas speaker diarization vs Pipecat-level tracking?
5. **Analytics Provider**: Segment, Amplitude, or custom?

### 13.2 Key Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users find AI intrusive | Medium | High | Minimal intervention philosophy; easy disable; user testing |
| Speaker diarization errors | Medium | High | Confidence thresholds; graceful degradation |
| Interventions feel awkward | High | Medium | Human-written templates; extensive testing |
| Privacy/consent concerns | Medium | High | Radical transparency; data minimization |
| WebSocket reliability | Medium | Medium | Reconnection logic; fallback UI |

### 13.3 Dependencies
- Backend API additions must be coordinated with frontend phases
- Design references available in `docs/Diadi screens/`
- MeetingBaas API key handling needs security review

---

## Appendix A: Design References
UI mockups organized by category in `docs/Diadi screens/`:
- hub (2 screens)
- navigation (4 screens)
- partner invitation (6 screens)
- session creation (15 screens)
- active session - diadi (11 screens)
- active session - zoom_meet (6 screens)
- interventions (21 screens)
- session detail/pre-session (6 screens)
- session detail/during-session (1 screen)
- session detail/post-session (9 screens)
- partner profiles (5 screens)
- user profile (2 screens)
- complications (7 screens)

## Appendix B: Coherence Decisions
- Product name is **Diadi**. Use "Talk" as a section label only, not as the brand.
- "Facilitator" is the system role. "Neutral Mediator", "Deep Empath", and "Decision Catalyst" are persona labels.
- External meeting platform is the alpha default. "Diadi Video Chat" is marked "Coming soon" until Beta.
- Deep Prep screens are Beta. In Alpha, show disabled or hidden entry points.
- Dyad health, AI recommendations, and journey insights are Beta. Hide or show as placeholders.

---

*This document consolidates requirements from all docs folder sources for the Diadi Frontend Alpha implementation.*
