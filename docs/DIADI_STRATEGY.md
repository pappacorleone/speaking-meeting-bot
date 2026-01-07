# Diadi Strategy

> **Purpose**: Strategic recommendations for product and marketing leadership to design and launch an AI-powered communication assistant that helps people have difficult conversations with the people they care about most.

**Target Market**: Close relationships (romantic partners, family, trusted professional partners)
**Alpha Scope**: Voice-first facilitation with visual feedback
**Core Philosophy**: Serve the relationship, not either individual

## Document Purpose

This strategy document defines **WHO** Diadi serves and **WHY**. It is the authoritative source for:
- Vision, mission, and positioning
- Market opportunity and competitive landscape
- Target personas and user stories
- Core values and product philosophy
- Go-to-market strategy and pricing
- Success metrics and business health
- Risk analysis and mitigation

**Audience:** Leadership, product strategy, marketing
**Related:** [DIADI_PRD.md](DIADI_PRD.md) (what), [DIADI_TECHNICAL_SPEC.md](DIADI_TECHNICAL_SPEC.md) (how)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Opportunity](#2-the-opportunity)
3. [Core Values and Product Philosophy](#3-core-values-and-product-philosophy)
4. [Target Relationships](#4-target-relationships)
5. [Personas](#5-personas)
6. [High-Pain User Stories](#6-high-pain-user-stories)
7. [Intervention Philosophy](#7-intervention-philosophy)
8. [Consent and Trust Architecture](#8-consent-and-trust-architecture)
9. [Go-to-Market Strategy](#9-go-to-market-strategy)
10. [Success Metrics](#10-success-metrics)
11. [Risk Analysis](#11-risk-analysis)
12. [Roadmap](#12-roadmap)
13. [Open Questions for Leadership](#13-open-questions-for-leadership)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### 1.1 Product Vision

**"The AI that helps you have the conversations you've been avoiding."**

We are building the first real-time communication assistant that serves *relationships*, not individuals. When two people who care about each other struggle to communicate effectively—whether romantic partners, family members, or trusted colleagues—our product creates the conditions for better conversations by observing both participants and intervening only when genuinely helpful.

### 1.2 The Problem We Solve

People avoid difficult conversations with the people they care about most. This avoidance compounds into relationship damage:

| Relationship Type | Pain Point | Scale |
|-------------------|------------|-------|
| **Romantic Partners** | Communication cited as primary divorce cause | 65-70% of failed marriages |
| **Families** | Cut off contact due to unresolved conflict | 25%+ of American adults |
| **Co-Founders** | Breakups kill companies and friendships | 65% of startups fail due to co-founder conflict |
| **Professional Partners** | Avoid giving honest feedback | 70% of employees |
| **All Types** | Conversations avoided cost relationships | $359B annually in workplace alone |

Current solutions fail because they either:
- Coach one person's performance (Poised, Gong) — creates asymmetry
- Replace human connection with AI (Replika, ChatGPT) — substitutes, doesn't facilitate
- Provide exercises between conversations (Lasting, Relish) — misses the critical moment
- Transcribe without participating (Otter, Fireflies) — passive observation

### 1.3 Our White Space

**No existing product provides real-time facilitation for conversations between two humans with awareness of both participants.**

```
                     REAL-TIME                         ASYNCHRONOUS
                        │                                   │
    ┌───────────────────┼───────────────────────────────────┼───────────────────┐
    │                   │                                   │                   │
    │   ★ OUR PRODUCT   │                                   │  Gottman Apps     │
SERVES    [WHITE SPACE]  │                                   │  Lasting, Relish  │
BOTH      │               │                                   │  Couples therapy  │
PARTIES   │               │                                   │                   │
    ├───────────────────┼───────────────────────────────────┼───────────────────┤
    │                   │                                   │                   │
    │  Poised           │                                   │  Gong, Chorus     │
SERVES    │  Hedy AI        │                                   │  Sales coaching   │
ONE       │  TalkMeUp       │                                   │  Performance      │
PARTY     │                   │                                   │                   │
    └───────────────────┼───────────────────────────────────┼───────────────────┘
```

### 1.4 Alpha Scope Summary

| Dimension | Alpha Scope |
|-----------|-------------|
| **Relationships** | Romantic partners, parent-adult child, co-founders, close professional partners |
| **Modality** | Voice calls with visual feedback |
| **Skills** | Facilitator (primary), Mediator (escalation) |
| **Platform** | Web-based, meeting platform integration |
| **Memory** | Session-only by default; opt-in for continuity |

### 1.5 Success Definition

**Alpha succeeds when**: Both participants in a facilitated conversation report feeling more heard and more connected than they would have without facilitation—while experiencing the AI as helpful rather than intrusive.

**Quantified**: >80% of conversation pairs rate the experience 4+/5 with <3 AI interventions per 30-minute session.

---

## 2. The Opportunity

### 2.1 Market Pain Points (Quantified)

#### Romantic Relationships
- **65-70%** of divorces cite communication problems as primary cause
- Couples in worst communication group divorce at **2x the rate** (22% vs 9%) of best group
- **57.7%** cite frequency of arguments as separation reason
- Only **19%** of married couples have sought counseling (cost barrier)
- Couples therapy costs **$150-300/session** — unaffordable for most

#### Family Relationships
- **25%+** of American adults have cut off contact with a family member
- **29%** of families experience turbulent relationships during peak adolescence
- Parents rate adolescence as the **most difficult stage** of parenting
- Only **36.7%** of adults have completed advance directives (end-of-life conversations avoided)

#### Close Professional Relationships
- **70%** of employees avoid difficult conversations with peers, supervisors, or reports
- Each avoided difficult conversation costs **$7,500** and 7 lost workdays
- Only **24%** of employees directly confront challenging situations
- **32%** of employees wait over 3 months for feedback
- Total cost: **$359 billion annually** in paid hours dealing with difficult situations

### 2.2 Why Current Solutions Fail

| Solution Category | Examples | Why It Fails for Close Relationships |
|-------------------|----------|--------------------------------------|
| **Performance Coaching** | Poised, Gong, Hedy AI | Coaches ONE person; creates asymmetry; optimizes performance not relationship |
| **AI Companions** | Replika, Character AI | AI IS the relationship; substitutes rather than facilitates |
| **Relationship Apps** | Lasting, Relish, Flamme | Asynchronous exercises; misses the critical real-time moment |
| **Passive Transcription** | Otter, Fireflies | No active participation; observation without facilitation |
| **Therapy Platforms** | BetterHelp, Talkspace | Human-dependent; scheduling constraints; cost barriers |
| **Translation Tools** | Google Translate, Talo | Transactional; no relationship context; no emotional tone |

### 2.3 Market Size

| Market Segment | 2024-2025 Value | Projection | CAGR |
|----------------|-----------------|------------|------|
| Conversational AI | $12-14B | $41-62B (2030-32) | 22-25% |
| Mental Health Counseling | $12.5B | $33B (2035) | 10.2% |
| Online Couples Therapy | $17.9B | $26B (2028) | 10.3% |
| Relationship Apps | $2B | $5.77B (2033) | 12.5% |
| Executive Coaching | $103.5B | $161B (2030) | 9.2% |

**Addressable Market for Close Relationship Communication**:
- US households with communication strain: ~50M
- Conversion at 5% with $20/month average: **$600M ARR opportunity**

### 2.4 The Training-to-Action Gap

Current AI solutions focus on **training and practice**—simulations, roleplay, post-call analysis. But the actual difficult conversation happens without support.

**Our differentiation**: Real-time, in-the-moment facilitation when it matters most.

---

## 3. Core Values and Product Philosophy

### 3.1 Values Hierarchy

Every product decision filters through five values in priority order:

| Priority | Value | Definition | Product Behavior |
|----------|-------|------------|------------------|
| 1 | **Safe** | Physical, emotional, psychological security | Dual consent, visible AI presence, instant disable, crisis escalation |
| 2 | **Respectful** | Honors dignity, autonomy, privacy | No side-taking, symmetric visibility, data minimization, no shaming |
| 3 | **Healthy** | Promotes wellbeing, not dependency | Minimal intervention, balance awareness, relationship-serving |
| 4 | **Culturally Aware** | Respects and bridges differences | Adapts to communication norms, supports diverse expression styles |
| 5 | **Constructive** | Moves toward positive outcomes | Goal-oriented, forward-moving, actionable outcomes |

**Conflict Resolution**: When values conflict, higher-priority values win. Example: If being "constructive" (pushing toward resolution) would feel unsafe, safety wins—we don't push.

### 3.2 The Facilitator Paradigm

We are building for **AI-as-Facilitator**, not AI-as-Partner:

| AI-as-Partner (NOT us) | AI-as-Facilitator (Our Model) |
|------------------------|-------------------------------|
| AI is one of two participants | AI observes human-human dyad |
| Optimizes for natural conversation flow | Optimizes for relationship health |
| Speaks frequently (backchannels, responses) | Speaks rarely (strategic interventions) |
| Success = engagement with AI | Success = quality of human-human interaction |

**Critical Research Insight** (CHI 2025): Personalized AI assistance aligned with one person's views actually *widened* cooperation gaps. Only *relational* assistance—tailored to the relationship dynamic—improved outcomes.

### 3.3 Minimal Intervention Philosophy

**"Silence is the default. Every intervention must earn its moment."**

A successful AI facilitator speaks as little as possible while achieving relationship outcomes. Traditional AI metrics (engagement, messages sent) conflict with our mission.

**Target**: <3 interventions per 30-minute conversation. Ideally 1-2.

### 3.4 What We Will NOT Build

| Anti-Feature | Why Not |
|--------------|---------|
| Private coaching to one party | Violates symmetric trust; creates asymmetry |
| Manipulation or persuasion tools | Conflicts with Respectful value |
| Detailed emotion recognition | Too invasive; error-prone; ethical concerns |
| Recording without both-party consent | Violates Safe and Respectful |
| Therapy replacement | Scope creep; regulatory risk; professional boundaries |
| "Performance reports" on one partner | Creates asymmetry; violates trust |
| Prediction of relationship outcomes | Not our role; ethically problematic |

---

## 4. Target Relationships

**Primary (Must nail for alpha success)**:
1. **Romantic partners** struggling with recurring conflicts or communication patterns
2. **Parent and adult child** with strained or superficial communication
3. **Co-founders** facing strategic disagreements or partnership strain

**Secondary (Include if resources allow)**:
4. **Close professional partners** (manager-report with difficult dynamics, mentors)

**Explicitly OUT of Alpha Scope**:
- Casual relationships (acquaintances, new connections)
- Large family groups (3+ people)
- Standard business meetings
- Therapy or crisis intervention
- Cross-language translation (defer to beta)

---

## 5. Personas

### 5.1 Persona 1: The Couple in Conflict

**Maya (34) & David (36)** — Married 7 years, two young children

#### Demographics & Context
- Dual-income household, professional jobs
- Kids are 3 and 6, constant time pressure
- Financial disagreements have become recurring fights
- Can't afford regular couples therapy ($150-300/session)
- Both love each other but are exhausted and frustrated

#### Communication Pain Points

| Pain Point | Current Workaround | Why It Fails |
|------------|-------------------|--------------|
| Arguments about money escalate within minutes | Avoid the topic entirely | Tension builds; small issues become crises |
| David shuts down when Maya's voice rises | Maya talks louder to get response | Shutdown deepens; Maya feels unheard |
| Old grievances resurface in every fight | Try to "move on" without resolution | Wounds reopen; resentment accumulates |
| Can't have hard conversations with kids around | Wait until kids are asleep (exhausted) | Too tired; conversations become worse |
| No neutral third party to help | Tried one therapy session; too expensive | No ongoing support |

#### Key Emotional Drivers
1. **Fear**: "If we can't fix this, are we headed for divorce?"
2. **Exhaustion**: "We're too tired to fight fair"
3. **Love buried under frustration**: "I know we love each other, but we can't connect"
4. **Hope**: "Other couples figure this out; why can't we?"

#### Jobs to Be Done
1. "I need to discuss the vacation budget without it turning into a fight"
2. "I need David to actually talk to me instead of shutting down"
3. "I need a way to stop old grievances from hijacking every conversation"
4. "I need affordable help that's available when we need it"

#### Journey with Our Product

1. **Discovery**: Maya searches "how to stop fighting with husband about money"; finds our product
2. **Invitation**: Maya sends invite to David; he sees symmetric design and agrees
3. **Setup**: They set goal: "Discuss vacation budget without fighting"
4. **During Call**:
   - Visual balance shows Maya at 70% talk time
   - Prompt appears: "David, would you like to share your perspective?"
   - When voices rise, gentle prompt: "I notice tension rising. Would a 2-minute break help?"
   - David speaks; Maya sees "David is speaking" indicator and waits
5. **After**: Summary shows escalation points, moments of agreement, action items
6. **Over Time**: Patterns show fewer escalations, more balanced conversations

#### Success Metrics for This Persona
- Talk-time balance improves from 70/30 to 55/45
- Escalation rate decreases 50% over 4 sessions
- Both rate sessions as "helpful" (4+/5)
- They have the vacation conversation without a fight

---

### 5.2 Persona 2: The Estranged Parent and Adult Child

**Robert (65)** & **Emma (32)** — Father and daughter, strained since she moved away

#### Demographics & Context
- Robert: Semi-retired professional, widowed 3 years ago
- Emma: Career-focused, lives 1,500 miles away, married
- Communication became superficial after Emma's mother died
- Weekly video calls feel obligatory and awkward
- Robert wants to rebuild connection; Emma feels smothered

#### Communication Pain Points

| Pain Point | Current Workaround | Why It Fails |
|------------|-------------------|--------------|
| Robert lectures; Emma disengages | Emma gives short answers to end calls faster | Calls become shorter; connection weakens |
| Unspoken grief about wife/mother | Both avoid the topic | Grief isolates them instead of connecting |
| Robert tries to "fix" Emma's problems | Emma stops sharing problems | Emma feels unheard; Robert feels shut out |
| Conversations are surface-level | Stick to "safe" topics (weather, work) | No emotional connection; relationship atrophies |
| Robert doesn't know how to ask questions | Defaults to giving advice | Emma feels criticized, not curious about |

#### Key Emotional Drivers
- **Robert**: Fear of losing daughter like he lost wife; doesn't know how to connect differently
- **Emma**: Guilt about distance; frustration at being lectured; grief unexpressed

#### Jobs to Be Done
1. "I need to connect with my daughter as an adult, not lecture her" (Robert)
2. "I need my dad to ask questions and listen, not just give advice" (Emma)
3. "I need to talk about Mom without it being awkward" (Both)
4. "I need our calls to feel like connection, not obligation" (Both)

#### Journey with Our Product

1. **Discovery**: Robert reads article about parent-child communication; Emma mentions the product
2. **Invitation**: Emma suggests trying it; Robert agrees (wants any help)
3. **Setup**: Goal: "Have a real conversation about how we're each doing"
4. **During Call**:
   - Balance shows Robert at 80% talk time
   - Visual prompt to Robert: "You've been sharing a lot. Would you like to hear Emma's perspective?"
   - When Robert starts giving advice, subtle prompt: "Emma, how are you feeling about this?"
   - When topic approaches grief, system stays silent (intervention blocker: emotional disclosure)
5. **After**: Robert sees 80/20 balance—eye-opening; commits to asking more questions
6. **Over Time**: Balance improves; calls last longer voluntarily; both report feeling more connected

#### Success Metrics for This Persona
- Talk-time balance improves from 80/20 to 60/40
- Call duration increases (voluntary, not forced)
- Both rate calls as "felt closer" (4+/5)
- They have a real conversation about Emma's mother

---

### 5.3 Persona 3: The Partners Making a Major Decision

**Aisha (27) & Marcus (29)** — Dating 2 years, currently long-distance

#### Demographics & Context
- Marcus took a job 800 miles away; Aisha is finishing grad school
- Need to decide: Does Aisha move after graduation? Does Marcus come back? Do they break up?
- High-stakes decision with career and relationship implications
- Video calls have become tense and unproductive
- Both avoid the "big conversation" because previous attempts ended badly

#### Communication Pain Points

| Pain Point | Current Workaround | Why It Fails |
|------------|-------------------|--------------|
| Decision conversations become arguments | Postpone; focus on logistics | Decision deadline approaches; anxiety increases |
| Marcus feels Aisha isn't prioritizing relationship | Doesn't express this directly | Resentment builds; Aisha doesn't know |
| Aisha feels pressured to sacrifice career | Overexplains why her program matters | Marcus feels dismissed; defensive cycle |
| Limited call time (busy schedules) | Rush through important topics | Conversations feel transactional |
| No shared framework for deciding | Each advocate for own preference | Zero-sum dynamic; no progress |

#### Key Emotional Drivers
- **Aisha**: Fear of losing identity in relationship; career ambitions; loves Marcus but won't be "that person" who gives up dreams
- **Marcus**: Fear of losing Aisha; invested in new job but not more than relationship; doesn't feel heard

#### Jobs to Be Done
1. "I need to understand what Marcus really wants without him getting defensive"
2. "I need Aisha to know I'd move back if that's what we decide—together"
3. "I need us to make this decision as partners, not opponents"
4. "I need help staying calm when we discuss this"

#### Journey with Our Product

1. **Discovery**: Aisha finds product researching "long distance relationship communication"
2. **Invitation**: Aisha explains it's for both of them; Marcus agrees to try
3. **Setup**: Goal: "Discuss our post-graduation plan and explore options together"
4. **During Call**:
   - When Marcus dominates early, balance prompt to Aisha
   - When Aisha says "you always make it about you," pause prompt: "I notice some tension. Would you like to rephrase that?"
   - System tracks goal: "You set out to explore options. You've discussed [move to Marcus] but not [Marcus comes back] or [third location]."
   - Time prompt: "You have 15 minutes left. You haven't discussed timeline yet."
5. **After**: Summary shows they covered 3 of 4 planned topics; action item: research third-city options
6. **Over Time**: Structured conversations lead to shared decision

#### Success Metrics for This Persona
- Complete difficult conversation without extended argument
- Cover planned topics (goal completion >80%)
- Both report "felt heard" (4+/5)
- Make progress toward decision (not just venting)

---

### 5.4 Persona 4: The Manager with a Struggling Report

**Sarah (38)** & **Riley (26)** — Manager and direct report with difficult dynamic

#### Demographics & Context
- Sarah: First-time manager, 6 direct reports, tech company
- Riley: Talented but underperforming; defensive about feedback
- Weekly 1:1s have become unproductive status updates
- Sarah avoids honest feedback; Riley doesn't know they're struggling
- HR has noticed performance issues; Sarah needs to address it

#### Communication Pain Points

| Pain Point | Current Workaround | Why It Fails |
|------------|-------------------|--------------|
| Sarah dominates 1:1s; Riley barely speaks | Sarah asks "any questions?" at end (Riley says no) | Riley feels unheard; issues unexpressed |
| Sarah avoids difficult feedback | Hints at problems indirectly | Riley doesn't understand severity |
| Riley gets defensive when criticized | Sarah backs off; softens message | Actual feedback never lands |
| No continuity between 1:1s | Start fresh each time | Same issues recur; no progress |
| Sarah talks 80% of the time | Riley gives brief responses | No real dialogue; power dynamic reinforced |

#### Key Emotional Drivers
- **Sarah**: Fear of damaging relationship; impostor syndrome as new manager; conflict avoidance
- **Riley**: Doesn't realize performance gap; defensive when blind-sided; wants to succeed

#### Jobs to Be Done
1. "I need to give Riley honest feedback without destroying our relationship" (Sarah)
2. "I need Riley to actually talk so I understand their perspective" (Sarah)
3. "I need to know how I'm really doing, not just nice words" (Riley)
4. "I need 1:1s to feel like development, not status meetings" (Both)

#### Journey with Our Product

1. **Discovery**: Sarah's HR partner recommends facilitated 1:1s for difficult conversations
2. **Invitation**: Sarah explains it helps both of them communicate better; Riley agrees
3. **Setup**: Goal: "Discuss project performance and development areas"
4. **During Call**:
   - Balance indicator shows Sarah at 75% immediately
   - Prompt: "Riley hasn't shared yet. Would you like to hear their perspective?"
   - When Sarah softens feedback, system stays silent (not its role to make feedback harsher)
   - When Riley responds defensively, prompt: "Sarah, can you help Riley understand the specific impact?"
   - Time prompt: "You have 10 minutes left. You set out to discuss development areas."
5. **After**: Summary shows talk-time balance, topics covered; Sarah sees she talked too much
6. **Over Time**: Balance improves; Riley speaks more; feedback conversations become normal

#### Success Metrics for This Persona
- Talk-time balance improves from 80/20 to 55/45
- Feedback is delivered and received (not avoided)
- Riley reports feeling heard and knowing where they stand
- Sarah rates experience as "helped me manage better"

---

### 5.5 Persona 5: The Co-Founders at a Crossroads

**Jordan (35)** & **Alex (33)** — Co-founders of a 3-year-old startup, facing strategic disagreements

#### Demographics & Context
- Jordan: CEO, external-facing, fundraising and sales background
- Alex: CTO, product and engineering, built the original prototype
- Friends for 10 years before starting the company together
- Company has 15 employees, raised Series A, at a strategic crossroads
- Recent board meeting exposed deep disagreement about company direction
- Both avoiding "the conversation" because the stakes feel existential

#### Communication Pain Points

| Pain Point | Current Workaround | Why It Fails |
|------------|-------------------|--------------|
| Fundamental disagreement on strategy | Talk around it in leadership meetings | Decisions get delayed; team senses tension |
| Resentment about equity/workload balance | Never discussed directly | Jordan feels Alex doesn't appreciate biz dev; Alex feels Jordan gets credit for their work |
| Different visions for company future | Assume they'll "figure it out" | Misalignment compounds; investors notice |
| Friendship makes business conflict personal | Avoid hard topics to "preserve friendship" | Friendship already suffering from unspoken tension |
| Fear of breakup destroying company | Neither raises concerns directly | Issues fester; explosive conflict becomes more likely |
| Power dynamics unclear | Defer to whoever cares more in the moment | Inconsistent decisions; neither feels ownership |

#### Key Emotional Drivers
- **Jordan**: Fear of losing the company AND the friendship; feels responsible for employees; worries Alex will leave
- **Alex**: Resentment that technical contribution is undervalued; torn between loyalty and feeling stuck; considering leaving but hasn't said it
- **Both**: Know they need to talk but terrified of what that conversation means

#### Jobs to Be Done
1. "I need to understand if Alex still believes in this company—and in us" (Jordan)
2. "I need Jordan to hear that I'm burning out without making it an ultimatum" (Alex)
3. "I need us to make a decision about direction instead of avoiding it" (Both)
4. "I need to know if we can still be friends if the business doesn't work" (Both)
5. "I need to have this conversation without destroying everything we've built" (Both)

#### Journey with Our Product

1. **Discovery**: Jordan reads about co-founder communication; finds our product in a founder community
2. **Invitation**: Jordan suggests it nervously; Alex agrees because they also know something has to change
3. **Setup**: Goal: "Discuss company direction and our partnership honestly"
4. **During Call**:
   - Both start cautiously; balance is even but surface-level
   - After 10 minutes of circling, prompt: "You set out to discuss your partnership honestly. Would either of you like to go deeper?"
   - Alex opens up about burnout; Jordan listens (balance shifts to Alex 70%)
   - When Jordan starts defending/explaining, prompt: "Alex just shared something important. Would you like to reflect back what you heard?"
   - When tension rises around equity, prompt: "This feels important. Take a moment—what do you each really need here?"
   - Time prompt: "You have 15 minutes left. You haven't discussed company direction yet."
5. **After**: Summary shows they spent 40 minutes on partnership, 15 on strategy; captures key concerns from each
6. **Follow-up**: They schedule another facilitated session specifically on strategy; partnership air is cleared

#### Success Metrics for This Persona
- Have the avoided conversation without relationship rupture
- Both express concerns that had been unspoken
- Reach at least one concrete agreement or next step
- Both report "I understand my co-founder better now"
- Company direction conversation happens (even if in follow-up session)

#### Why This Persona Matters
- **High stakes**: Co-founder breakups cost companies on average $500K+ and often kill the business entirely
- **Underserved market**: No tools designed for co-founder communication; they use couples therapists, executive coaches, or nothing
- **Bridges personal/professional**: Co-founders are often friends first; the relationship has both dimensions
- **Network effects**: Founders talk to founders; strong word-of-mouth potential in startup ecosystem
- **Validates enterprise path**: If it works for founders, it can work for leadership teams

---

## 6. High-Pain User Stories

### 6.1 Story Format

Each story follows the format:
```
As [persona],
When [situation],
I need [capability],
So that [outcome].

Acceptance Criteria:
- [Measurable condition 1]
- [Measurable condition 2]

Facilitation Behavior:
- [What AI does/doesn't do]

Key Moment: "[The aha moment that delivers value]"
```

---

### 6.2 Romantic Partner Stories

#### Story 1: The Recurring Argument

**As Maya and David** (Couple in Conflict),
**When** we need to discuss a topic that always leads to fighting (money, in-laws, parenting),
**I need** a way to have the conversation without it escalating,
**So that** we can actually make decisions together instead of avoiding topics.

**Acceptance Criteria**:
- Conversation completes without either party yelling or storming off
- Both parties report feeling heard (4+/5)
- At least one action item or agreement is reached
- Escalation detected and de-escalation offered within 30 seconds of tension rising

**Facilitation Behavior**:
- Monitor for escalation signals (raised voices, interruption spike, contempt markers)
- Visual prompt first: "Tension indicator" visible to both
- If escalation continues 30+ seconds, voice prompt: "I notice tension rising. Would a 2-minute break help?"
- If one party shuts down, gentle prompt: "[Name], would you like to share your perspective?"
- Do NOT take sides or suggest who is "right"

**Key Moment**: "We actually talked about the budget without fighting. That hasn't happened in months."

---

#### Story 2: The Shutdown Dynamic

**As Maya** (escalating partner),
**When** David stops responding during difficult conversations,
**I need** help getting him to re-engage without pressuring,
**So that** we can work through issues instead of hitting walls.

**Acceptance Criteria**:
- Silent partner speaks within 2 minutes of shutdown being detected
- Re-engagement feels invited, not forced
- Conversation continues productively after re-engagement
- Escalating partner doesn't fill silence (system helps hold space)

**Facilitation Behavior**:
- Detect shutdown: Partner silent >60 seconds despite topic continuation
- Visual prompt to both: "Space for reflection" (normalizing the pause)
- After 90 seconds, gentle voice: "[David], take your time. Would you like to share what you're thinking?"
- Signal to other partner: "Give [David] a moment to gather thoughts"
- Do NOT pressure or make shutdown feel like failure

**Key Moment**: "David actually told me why he shuts down. He said having the AI ask made it feel less like I was attacking him."

---

#### Story 3: The Old Grievance

**As David**,
**When** a conversation gets derailed by Maya bringing up past issues,
**I need** help acknowledging the past while staying focused on the current topic,
**So that** we can make progress instead of relitigating history.

**Acceptance Criteria**:
- Past grievance acknowledged (not dismissed)
- Conversation returns to original topic within 3 minutes
- Both parties feel the pivot was fair
- Option offered to schedule separate conversation about past issue

**Facilitation Behavior**:
- Detect topic shift to past grievance (semantic analysis)
- Allow 60-90 seconds of expression (don't interrupt emotional disclosure)
- Then visual prompt: "You started discussing [budget]. Would you like to return to that, or continue with this?"
- If they choose to continue with grievance, stay silent and facilitate that conversation
- Do NOT dismiss past pain or force return to original topic

**Key Moment**: "It asked us if we wanted to talk about that issue now or schedule a separate conversation. We picked later, but I didn't feel dismissed."

---

### 6.3 Family Stories

#### Story 4: The Lecture Loop

**As Robert** (parent who lectures),
**When** Emma shares something about her life,
**I need** help responding with curiosity instead of advice,
**So that** she feels heard instead of lectured.

**Acceptance Criteria**:
- Robert asks at least 3 genuine questions during conversation
- Emma talks more than Robert (balance flips from historical 80/20)
- Emma reports feeling "curious about, not judged"
- Robert catches himself before giving unsolicited advice at least once

**Facilitation Behavior**:
- Track question-to-statement ratio for Robert
- When Robert gives extended advice, visual prompt: "Would you like to learn more about Emma's perspective?"
- Suggest question formats: "What was that like for you?" or "How are you feeling about it?"
- Do NOT shame Robert for advising; gently redirect
- Celebrate moments of curiosity with subtle positive indicator

**Key Moment**: "The system reminded me to ask questions. Emma said it was the first call where she felt I was actually curious about her life."

---

#### Story 5: The Unspoken Tension

**As Emma**,
**When** there are things I need to say to Dad but don't know how,
**I need** help finding an opening,
**So that** important things get said before it's too late.

**Acceptance Criteria**:
- Difficult topic is raised during conversation (not perpetually avoided)
- Both parties engage with the topic for at least 5 minutes
- Conversation ends with both expressing it was valuable
- Follow-up conversation scheduled if needed

**Facilitation Behavior**:
- Pre-conversation: Option to note "something important I want to discuss but don't know how"
- During conversation: After rapport is established (10+ minutes), gentle prompt: "Emma, you mentioned wanting to discuss something important. Now might be a good time."
- If Emma hesitates, normalize: "Take your time. Robert, Emma has something she'd like to share."
- Hold space; do NOT fill silence; let moment unfold
- If topic is highly emotional, disable all intervention (intervention blocker)

**Key Moment**: "I finally told Dad that I've been struggling since Mom died. The AI just... made space for it. Dad cried. We both did. We needed that."

---

#### Story 6: The Medical Decision

**As Robert**,
**When** I need to discuss end-of-life planning with Emma,
**I need** help having a conversation neither of us wants to have,
**So that** Emma knows my wishes and isn't burdened with uncertainty.

**Acceptance Criteria**:
- Topic is raised and discussed for at least 10 minutes
- Key decisions/wishes are expressed and captured
- Both parties complete conversation (no early exit)
- Summary includes specific action items (advance directive, etc.)

**Facilitation Behavior**:
- Recognize topic sensitivity; reduce intervention frequency
- Allow longer pauses than normal (up to 30 seconds)
- If either party tries to deflect/change topic, gentle redirect: "This is an important topic. Would you like to continue?"
- Capture key expressed wishes in summary
- Do NOT add commentary or opinion on wishes expressed

**Key Moment**: "We finally talked about what Dad wants if something happens. It was hard, but now I know. I'm so relieved we had that conversation."

---

### 6.4 Professional Stories

#### Story 7: The Difficult Feedback

**As Sarah** (manager avoiding feedback),
**When** I need to tell Riley their performance isn't meeting expectations,
**I need** help delivering clear feedback without damaging our relationship,
**So that** Riley knows where they stand and can improve.

**Acceptance Criteria**:
- Specific performance concerns are clearly stated
- Riley demonstrates understanding of the concerns (can paraphrase back)
- Riley shares their perspective on the challenges
- Action items for improvement are captured
- Neither party reports feeling attacked or defensive

**Facilitation Behavior**:
- Track whether feedback is specific vs. vague
- If Sarah uses hedging language ("maybe sometimes kind of"), visual prompt: "Could you share a specific example?"
- When Riley responds, ensure Sarah hears fully before responding
- If Riley becomes defensive, prompt: "Riley, help Sarah understand what's making this hard"
- Do NOT make feedback harsher; facilitate clarity and dialogue

**Key Moment**: "I actually said what I needed to say. And Riley heard it because it wasn't just me talking—we had a real conversation about it."

---

#### Story 8: The Unbalanced 1:1

**As Riley**,
**When** our weekly 1:1s feel like Sarah talking and me listening,
**I need** space to actually share what's on my mind,
**So that** I feel like a participant in my own development.

**Acceptance Criteria**:
- Riley talks at least 40% of the time
- Riley raises at least one topic unprompted
- Sarah asks at least 3 open-ended questions
- Riley reports feeling "like a real conversation, not a lecture"

**Facilitation Behavior**:
- Balance indicator prominent from start
- Early prompt to Sarah (if at 60%+ in first 5 min): "Would you like to hear Riley's perspective?"
- Prompt Riley to share: "Riley, what's been on your mind this week?"
- Time allocation: If 20 minutes in and Riley hasn't raised a topic, prompt: "Riley, is there anything you wanted to discuss?"
- Summary shows balance metrics; creates awareness for future

**Key Moment**: "For the first time, I actually got to talk about what's blocking me. Sarah didn't even realize she'd been doing 80% of the talking until she saw the numbers."

---

### 6.5 Co-Founder Stories

#### Story 9: The Strategic Crossroads

**As Jordan and Alex** (co-founders avoiding the big conversation),
**When** we fundamentally disagree about company direction but keep talking around it,
**I need** help having the conversation we've been avoiding,
**So that** we can make a real decision instead of letting misalignment kill the company.

**Acceptance Criteria**:
- Both express their actual vision for the company (not hedged versions)
- Areas of agreement and disagreement are clearly identified
- At least one concrete next step is agreed upon
- Neither leaves feeling like they "lost" the conversation
- The friendship survives the business conversation

**Facilitation Behavior**:
- Recognize when conversation is surface-level; prompt to go deeper after 10+ minutes of circling
- When one founder dominates, create space: "[Other founder], what's your perspective on this?"
- When defensiveness rises, prompt reflection: "Can you reflect back what you heard before responding?"
- Track stated goal; prompt when drifting: "You set out to discuss company direction. You've been talking about [other topic] for a while."
- Do NOT suggest a "right" direction; facilitate exploration

**Key Moment**: "We finally said the things we've been thinking for months. It was hard, but now we actually know where we each stand."

---

#### Story 10: The Equity and Contribution Conversation

**As Alex** (CTO feeling undervalued),
**When** I feel like Jordan gets credit while I do the work, but I've never said it directly,
**I need** help expressing resentment without destroying the partnership,
**So that** we can address the imbalance before I burn out or leave.

**Acceptance Criteria**:
- Alex expresses the core concern clearly
- Jordan hears and acknowledges without immediately defending
- Both share their perception of contributions and recognition
- Some form of acknowledgment or adjustment is discussed
- Conversation ends with both feeling heard, even if not fully resolved

**Facilitation Behavior**:
- When Alex opens up, protect the moment: hold space, don't let Jordan interrupt
- When Jordan starts defending, prompt: "Jordan, before responding, can you share what you heard Alex say?"
- If Alex minimizes or backs off, gentle prompt: "Alex, it sounded like there was more. Would you like to continue?"
- Recognize high emotional stakes; allow longer pauses than normal
- Do NOT take sides on who contributes more; facilitate understanding

**Key Moment**: "I finally told Jordan I've been thinking about leaving. And instead of it being an explosion, we actually talked about why."

---

## 7. Intervention Philosophy

### 7.1 Core Principle

**"A successful AI facilitator speaks as little as possible while achieving relationship outcomes."**

Every intervention must earn its moment. Silence is not passive—it's active trust-building.

### 7.2 Intervention Hierarchy

Interventions follow a modality stack—always prefer less intrusive options:

```
MODALITY STACK (prefer lower tiers)

Tier 1: OBSERVE ONLY (default)
├── AI is present but silent
└── Conversation flows naturally

Tier 2: VISUAL ONLY (most interventions)
├── Balance indicator adjusts
├── Subtle prompt appears (text visible to both)
└── No interruption of conversation flow

Tier 3: VOICE (rare, high-stakes only)
├── Brief spoken prompt (<10 seconds)
├── Used only for: severe imbalance, escalation, time warnings, explicit requests
└── Always framed as invitation, not command

Tier 4: SAFETY (crisis only)
├── Offer to end session
├── Provide resources
└── Never continue without consent
```

### 7.3 Intervention Triggers (When AI MAY Intervene)

| Trigger | Threshold | Modality |
|---------|-----------|----------|
| **Balance threshold** | One person >65% talk time for >3 minutes | Visual first; voice if >70% for >5 min |
| **Awkward silence** | Neither speaking for >15 seconds | Visual prompt to less-active party |
| **Topic drift** | Off stated goal for >2 minutes | Visual: "You set out to discuss [X]" |
| **Escalation signals** | Raised voices, interruptions, contempt markers | Visual tension indicator; voice if continues >30s |
| **Time awareness** | 5 minutes remaining, key topics uncovered | Voice: "You have 5 minutes left" |
| **Explicit request** | Either party says "help" or trigger phrase | Respond to request |
| **Shutdown detected** | One party silent >60 seconds during active topic | Visual space; then gentle voice prompt |

### 7.4 Intervention Blockers (When AI MUST NOT Intervene)

| Blocker | Why |
|---------|-----|
| **Either party mid-sentence** | Never interrupt active speech |
| **Emotional disclosure in progress** | Allow processing; intervention would rupture moment |
| **Less than 30 seconds since last intervention** | Cooldown prevents feeling badgered |
| **Repair attempt in progress** | If someone is apologizing/reconnecting, stay silent |
| **Either party said "pause facilitation"** | Explicit consent withdrawal |
| **Conversation flowing naturally** | High turn-taking, balanced—don't fix what isn't broken |
| **First 3 minutes of session** | Allow natural warm-up |
| **Grief or crisis expression** | Deep emotional moments need space, not management |

### 7.5 Intervention Templates

**Balance Prompts**:
- Visual: "[Name] hasn't shared their perspective yet"
- Voice: "I notice the conversation has been a bit one-sided. [Name], would you like to share your thoughts?"

**Escalation Prompts**:
- Visual: Tension indicator rises (meter visible to both)
- Voice: "I sense some tension rising. Would a 2-minute break help?"
- Voice (severe): "Would it help to pause and each share what you're feeling right now?"

**Time Prompts**:
- Visual: "5 minutes remaining"
- Voice: "You have about 5 minutes left. You mentioned wanting to discuss [topic]—would you like to touch on that?"

**Topic/Goal Prompts**:
- Visual: "You set out to discuss [goal]. You've covered [X] but not [Y]."
- Voice: "It sounds like the conversation has drifted. Would it help to come back to [original goal]?"

**Shutdown/Re-engagement**:
- Visual: "Taking a moment..." (normalizes pause)
- Voice: "[Name], take your time. Would you like to share what you're thinking?"

**Clarification**:
- Visual: "[Name] seems unsure—might help to rephrase"
- Voice: "[Name], it seems like there might be some confusion. Could you say more about what you mean?"

### 7.6 Safety Escalation Protocol

| Level | Signals | Response |
|-------|---------|----------|
| **Green** | Balanced, flowing, constructive | No intervention |
| **Yellow** | Moderate imbalance (65/35), mild tension | Visual prompts only |
| **Orange** | Severe imbalance (75/25+), escalation | Voice intervention |
| **Red** | Threats, abuse patterns, crisis indicators | Offer to end; provide resources; never continue without consent |

**Red Response Template**:
"I want to pause here. It sounds like this conversation might benefit from a break or additional support. Would you like to end the session? I can also share some resources that might help."

---

## 8. Consent and Trust Architecture

### 8.1 Non-Negotiable Trust Requirements

| Requirement | Implementation | Rationale |
|-------------|----------------|-----------|
| **Explicit dual consent** | Both parties actively tap "I consent" before AI observes | No hidden third party |
| **Visible AI presence** | Constant indicator showing AI is active | Transparency builds trust |
| **Symmetric access** | Both see identical information always | No asymmetric advantage |
| **Instant disable** | Either can say "pause" or tap kill switch | Autonomy preserved |
| **Data minimization** | Default: session-only, no storage | Privacy-first; earn trust before asking for data |
| **Transparency report** | Users can see exactly what data exists | No hidden collection |

### 8.2 Consent Flow Design

```
INVITATION FLOW
├── User A opens app, creates relationship space
├── User A sees full explanation:
│   "This AI observes your conversation and occasionally helps
│    keep things balanced. BOTH of you see the same information.
│    Either of you can pause facilitation at any time.
│    Nothing is stored unless you both opt in."
├── User A sends invitation link to User B
└── User B receives invitation with same explanation

ACCEPTANCE FLOW
├── User B reviews what AI will observe
├── User B reviews what data may be stored (default: nothing)
├── User B actively taps "I consent" (not just "Continue")
├── Decline option available; A is not notified of decline
└── Only after both consent does facilitation begin

SESSION START
├── Visual indicator: "AI facilitation active"
├── Brief audio (optional, first session only):
│   "I'm here to help keep your conversation balanced.
│    You'll see indicators, and I'll only speak if things
│    get significantly off-track. Either of you can say
│    'pause facilitation' at any time."
└── AI goes SILENT unless triggered

DURING SESSION
├── Constant visual indicator showing AI is observing
├── Kill switch always accessible
├── Either can say "pause facilitation" to disable
└── If paused, requires both to re-enable

SESSION END
├── Summary visible to both simultaneously
├── Option to save or discard
├── Feedback optional
└── No follow-up contact unless opted in
```

### 8.3 Data Policy

| Data Type | Default | With Consent |
|-----------|---------|--------------|
| **Real-time audio** | Processed, not stored | Same |
| **Transcript** | Not stored | Stored if BOTH opt in |
| **Summary** | Shown once, then discarded | Stored if BOTH opt in |
| **Balance metrics** | Shown once, then discarded | Stored for trends if BOTH opt in |
| **Intervention history** | Not stored | Stored for improvement if BOTH opt in |

### 8.4 What We Will NOT Do

| Anti-Pattern | Commitment |
|--------------|------------|
| Enable surveillance | Cannot hide AI presence from either party |
| Provide private reports | No "how your partner performed" analysis |
| Share with third parties | Never; not even anonymized |
| Use for training | Conversation data never used for model training without explicit consent |
| Store without consent | Default is always session-only |
| Continue after consent withdrawal | Immediate stop if either says "pause" |

---

## 9. Go-to-Market Strategy

### 9.1 Positioning Statement

**"The AI that helps you have the conversations you've been avoiding—by staying out of the way until you need it."**

**For** couples, families, and close partners who struggle to communicate effectively,
**[Product Name]** is the first AI that facilitates real-time conversations between two people,
**Unlike** coaching tools that help one person or therapy that happens between sessions,
**Our product** observes both participants, maintains balance, and intervenes only when genuinely helpful.

### 9.2 Messaging by Persona

| Persona | Core Message | Supporting Message |
|---------|--------------|-------------------|
| **Couples in conflict** | "Have the conversations you've been avoiding" | "Affordable support for the moments therapy can't reach" |
| **Estranged family** | "Reconnect across the distance" | "Turn obligatory calls into real connection" |
| **Decision-making partners** | "Decide together, not against each other" | "Stop rehearsing arguments and start having conversations" |
| **Co-founders at a crossroads** | "The conversation your company depends on" | "Don't let misalignment kill the business—or the friendship" |
| **Managers with difficult dynamics** | "1:1s that actually develop your people" | "Give feedback that lands without damaging relationships" |

### 9.3 Channel Strategy

**Primary Channels (High Intent)**:

| Channel | Rationale | Tactics |
|---------|-----------|---------|
| **Relationship content creators** | Trusted voices; audience already seeking help | Partnerships with couples therapists on social media |
| **Search (SEO)** | People actively searching for help | Content: "how to talk to [spouse/parent/teenager] about [money/career/feelings]" |
| **Therapist referrals** | Professional credibility; homework between sessions | Therapist partner program |
| **Podcast sponsorship** | Relationship/communication/self-improvement audiences | Targeted shows with relationship-focused content |
| **Founder communities** | High-stakes relationships; strong word-of-mouth | Y Combinator, Indie Hackers, founder Slack groups, startup podcasts |

**Secondary Channels (Awareness)**:

| Channel | Rationale | Tactics |
|---------|-----------|---------|
| **Social proof/testimonials** | Emotional resonance | User stories: "We finally talked about X" |
| **HR/management platforms** | Professional use case | Integration partnerships |
| **App store optimization** | Discovery | Category: relationship, communication |

**Channels to Avoid**:

| Channel | Why Avoid |
|---------|-----------|
| Broad paid social ads | Expensive; low intent; wrong audience |
| Enterprise sales (for alpha) | Distracts from core relationship focus |
| Tech press | Wrong audience for relationship product |

### 9.4 Pricing Strategy

**Model**: Freemium with relationship-based pricing

| Tier | Price | Includes | Target |
|------|-------|----------|--------|
| **Free** | $0 | 2 sessions/month (30 min each), basic facilitation | Trial, evaluation |
| **Essential** | $15/month | Unlimited sessions, full facilitation, summaries | Individual or couple |
| **Plus** | $25/month | Everything + cross-session memory, trend insights | Committed relationships |
| **Annual Essential** | $120/year ($10/mo) | Same as Essential, annual commitment | Value seekers |
| **Annual Plus** | $200/year ($16.67/mo) | Same as Plus, annual commitment | Committed users |

**Pricing Rationale**:
- **vs. Therapy** ($150-300/session): 10-20x more accessible; available when needed
- **vs. Relationship apps** ($10-30/month): Similar; but real-time vs. exercises
- **vs. Coaching** ($100-500/session): Continuous vs. episodic; relationship vs. individual

### 9.5 Launch Strategy

**Phase 1: Private Beta**
- 200-300 relationships (couples and families)
- Recruited via therapist partners, relationship content creators
- Intense feedback: NPS, interviews, session observations (with consent)
- Iterate on intervention triggers, templates, UX

**Phase 2: Waitlist Launch**
- Open waitlist; generate anticipation
- Content marketing: "The conversations we're helping people have"
- Influencer testimonials
- 2,000-5,000 relationships

**Phase 3: Public Launch**
- App store listing
- PR: Human interest stories about reconnected relationships
- Paid acquisition (limited, targeted)
- Therapist referral program live

### 9.6 Partnership Opportunities

| Partner Type | Value to Us | Value to Them |
|--------------|-------------|---------------|
| **Therapists/counselors** | Credibility; referrals; "homework" use case | Tool for clients between sessions |
| **Relationship content creators** | Audience; authenticity | Content; affiliate revenue |
| **HR platforms** | Enterprise distribution | Difficult conversations tool for managers |
| **EAP providers** | Corporate access | Preventive mental health tool |

---

## 10. Success Metrics

### 10.1 North Star Metric

**"Conversations that felt better"**: Percentage of facilitated conversations where BOTH participants rate the experience as better than they would have had without facilitation.

**Target**: >80% of sessions rated "felt better than usual" by both parties.

### 10.2 Primary Metrics (Relationship Quality)

| Metric | Description | Target |
|--------|-------------|--------|
| **Both-party satisfaction** | Post-session rating (both must rate) | >4.0/5 average |
| **Talk-time balance achieved** | Sessions reaching 40-60% split | >60% of sessions |
| **Balance improvement** | Trend toward 50/50 over time | Measurable improvement |
| **Goal completion** | Stated topics addressed | >80% addressed |
| **Session completion** | Finish naturally (no early exit) | >90% |
| **Return usage** | Use again within 30 days | >60% |

### 10.3 Facilitation Quality Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Intervention rate** | AI interventions per 30-min session | <3 (ideally 1-2) |
| **Intervention helpfulness** | Post-session rating of AI prompts | >4.0/5 |
| **Escalation prevention** | Sessions where escalation was de-escalated | >80% of escalation events |
| **False positive rate** | Interventions marked "not helpful" | <10% |

### 10.4 Business Health Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Invitation rate** | Users who invite a partner | >70% of sign-ups |
| **Conversion (free to paid)** | After trial period | >15% |
| **30-day retention** | Still active after 30 days | >60% |
| **90-day retention** | Still active after 90 days | >40% |
| **NPS** | Net Promoter Score | >50 |

### 10.5 Anti-Metrics (What We Don't Optimize)

| Anti-Metric | Why We Avoid |
|-------------|--------------|
| Time in app | Efficient conversations are good; long sessions may indicate struggle |
| AI messages per session | More intervention = worse facilitation |
| "Engagement" | Vague; often conflicts with user wellbeing |
| Data collected | Less is better for trust |
| Daily active users | Relationships don't need daily facilitation |

### 10.6 Leading Indicators of Product-Market Fit

1. **Organic invitations**: User A invites User B without prompting
2. **Testimonial requests**: Users volunteer stories about breakthrough conversations
3. **Repeat scheduling**: Same pair schedules another facilitated conversation
4. **Cross-context adoption**: Same user uses for different relationships
5. **Therapist referrals**: Therapists recommend to clients unprompted

---

## 11. Risk Analysis

### 11.1 High-Impact Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Users find AI intrusive** | Medium | High | Minimal intervention philosophy; easy disable; visual-first; user testing |
| **Speaker diarization errors** | Medium | High | Confidence thresholds; "I'm not sure who said that" transparency; graceful degradation |
| **Interventions feel awkward** | High | Medium | Human-written templates; extensive testing; user feedback loop |
| **Privacy/consent concerns** | Medium | High | Radical transparency; data minimization; prominent consent |
| **Users expect therapy replacement** | Low | Medium | Clear positioning; explicit scope; professional referrals when appropriate |
| **Escalation detection false positives** | Medium | Medium | Conservative thresholds; always offer choice not force intervention |
| **One party dominates despite prompts** | Medium | Medium | Escalating prompts; session summary shows reality; user agency preserved |

### 11.2 Safety Risks

| Risk | Scenario | Prevention |
|------|----------|------------|
| **AI fails to detect abuse** | Facilitates conversation that becomes harmful | Conservative escalation triggers; offer exit; provide resources; don't pretend to be therapy |
| **Trust breach** | Data leak or unauthorized access | E2E encryption; minimal storage; security-first architecture |
| **Weaponization** | One party uses against another | Symmetric visibility; cannot hide AI presence; no private reports |
| **AI takes sides** | Intervention perceived as favoring one party | Strict neutrality in templates; never comment on who is "right" |

### 11.3 Competitive Risks

| Risk | Response |
|------|----------|
| Big tech enters space | Values-first differentiation; trust features; move fast on core experience |
| Therapy platforms add real-time | We're not therapy; complementary positioning; different use case |
| Relationship apps add facilitation | Deep focus beats feature addition; relationship-native architecture |

### 11.4 Launch Risk Checklist

Pre-launch verification:

- [ ] Diarization accuracy >95% for 2-person conversations
- [ ] Intervention templates tested with 20+ real conversations
- [ ] Consent flow tested for clarity (user research)
- [ ] Kill switch tested and functional
- [ ] Privacy policy reviewed by legal
- [ ] Escalation protocol documented and tested
- [ ] Support team trained on edge cases
- [ ] Data retention policy implemented correctly
- [ ] Graceful degradation tested (poor audio quality, network issues)

---

## 12. Roadmap

### 12.1 Phase Overview

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **Alpha** | Core facilitation for close relationships | P0 features, 2 personas proven, 200+ relationships |
| **Beta** | Enhanced intelligence and memory | Escalation detection, cross-session, trends |
| **GA** | Scale and channels | Mobile, chat, enterprise, integrations |

### 12.2 Alpha Milestones

**Milestone A1: Core Facilitation Engine**
- [ ] Speaker diarization integration (Deepgram)
- [ ] Real-time talk-time balance tracking
- [ ] Balance indicator visible to both (WebSocket)
- [ ] Basic intervention engine (rule-based triggers/blockers)

**Milestone A2: Trust and Consent**
- [ ] Dual consent flow (both must opt-in)
- [ ] Visible AI presence indicator
- [ ] Kill switch functionality
- [ ] Data minimization (session-only default)

**Milestone A3: Intervention System**
- [ ] Templated voice interventions
- [ ] Visual prompts library
- [ ] Intervention cooldown management
- [ ] Session goal setting and tracking

**Milestone A4: Session Lifecycle**
- [ ] Session start flow (intro, goal setting)
- [ ] Post-session summary generation
- [ ] Feedback collection
- [ ] Platform integration (Zoom/Teams/Meet via existing infrastructure)

**Milestone A5: Quality and Launch**
- [ ] User testing with 50+ conversations
- [ ] Intervention template refinement
- [ ] Performance optimization
- [ ] Beta waitlist and launch prep

### 12.3 Beta Roadmap Preview

| Feature | Rationale |
|---------|-----------|
| **Escalation detection** | Proactively identify rising tension |
| **Topic tracking** | Ensure stated goals are addressed |
| **Cross-session memory** | Context and trends across conversations (opt-in) |
| **Pattern insights** | "Your balance has improved 15% over 4 sessions" |
| **Chat channel** | Text-based facilitation option |
| **Translation** | Cross-language facilitation for diaspora families |

### 12.4 GA Roadmap Preview

| Feature | Rationale |
|---------|-----------|
| **Mobile companion** | On-the-go access and notifications |
| **Enterprise features** | Admin controls, team deployment |
| **API for partners** | Therapist platforms, HR tools |
| **Additional skills** | Coach (post-conversation), Reflector |
| **WhatsApp/SMS** | Meet users where they communicate |

---

## 13. Open Questions for Leadership

### 13.1 Scope Decisions

1. **Primary relationship type for alpha**: Should we focus narrowly on couples OR include parent-adult child from the start?
   - *Recommendation*: Include both; similar facilitation needs; broader market validation

2. **Professional relationships in alpha**: Include manager-report use case or defer to beta?
   - *Recommendation*: Include as tertiary; validates enterprise path; similar core features

3. **Geographic focus**: US-only or include international from alpha?
   - *Recommendation*: US-only for alpha; simplifies compliance and support

### 13.2 Policy Decisions

4. **Data retention default**: Session-only (discard after) or opt-out (store unless declined)?
   - *Recommendation*: Session-only default; builds trust; users can opt-in for memory

5. **Intervention sensitivity**: Should users be able to configure intervention frequency?
   - *Recommendation*: Fixed for alpha (conservative); configurable in beta after learning

6. **Crisis protocol**: What happens when safety signals are detected?
   - *Recommendation*: Offer exit + resources; never continue without consent; don't pretend to be crisis intervention

### 13.3 Go-to-Market Decisions

7. **Pricing validation**: Should we test pricing with customer interviews before launch?
   - *Recommendation*: Yes; 20-30 interviews with target personas before finalizing

8. **Beta partner pipeline**: Which therapists/influencers are we targeting for partnerships?
   - *Need*: Identify 10-20 potential partners to approach during alpha

9. **Launch timing**: Beta in Q1 or wait for more refinement?
   - *Depends*: On alpha learnings and product-market fit signals

### 13.4 Technical Decisions

10. **Diarization provider**: Deepgram native or third-party diarization service?
    - *Recommendation*: Deepgram native for alpha; evaluate alternatives if accuracy insufficient

11. **LLM for interventions**: GPT-4 or fine-tuned model?
    - *Recommendation*: GPT-4 for alpha; consider fine-tuning if latency or cost issues

---

## 14. Appendices

### Appendix A: Competitive Analysis Detail

#### Real-Time Coaching (Individual Focus)
| Product | Focus | Pricing | Why It's Not Us |
|---------|-------|---------|-----------------|
| **Poised** | Individual meeting performance | $13-19/mo | Coaches ONE person |
| **Hedy AI** | Real-time meeting coach | $9.99/mo | Individual focus |
| **TalkMeUp** | Communication coaching | Enterprise | Individual performance |
| **Gong** | Sales conversation intelligence | $160-250/user/mo | Post-call; sales-only |

#### Relationship Apps (Asynchronous)
| Product | Focus | Pricing | Why It's Not Us |
|---------|-------|---------|-----------------|
| **Lasting** | Couples exercises | $29.99/mo | Asynchronous; no real-time |
| **Relish** | Relationship coaching | $15/mo | Quiz-focused; stagnant |
| **Flamme** | Daily connection | Freemium | No real-time facilitation |
| **Gottman** | Relationship skills | Varies | Education; no facilitation |

#### AI Companions (Replacement, Not Facilitation)
| Product | Focus | Why It's Not Us |
|---------|-------|-----------------|
| **Replika** | AI friend/companion | AI IS the relationship |
| **Character AI** | Role-play conversations | Entertainment; not relationship help |

### Appendix B: Market Research Sources

**Communication and Relationships**:
- HuffPost: "Poor Communication Is The #1 Reason Couples Split Up"
- PMC: Marriage and divorce patterns research
- Pew Research: Family relationships and communication
- Counseling Today: Parent-teen conflict research

**Workplace Communication**:
- Work Bravely: "Understanding the Conversation Gap" report
- Gallup: Workplace feedback and recognition research
- CultureMonkey: Employee feedback statistics
- Achievers: Manager difficult conversation readiness

**Market Size**:
- Grand View Research: Conversational AI Market
- Fortune Business Insights: Conversational AI projections
- Towards Healthcare: Mental health counseling market
- SkyQuest: Mental health market analysis

**AI and Conversation Research**:
- CHI 2025: "Relational AI: Facilitating Intergroup Cooperation"
- ScienceDirect: Turn-taking in conversational systems
- Nature Scientific Reports: Conversational AI and equity

### Appendix C: Intervention Template Library

```yaml
# Balance Interventions
balance_visual_mild:
  trigger: "talk_time_ratio > 0.65 for > 180 seconds"
  text: "[QUIET_PERSON] hasn't shared their perspective yet"
  modality: visual
  cooldown: 120 seconds

balance_voice_severe:
  trigger: "talk_time_ratio > 0.70 for > 300 seconds"
  text: "I notice the conversation has been a bit one-sided. [QUIET_PERSON], would you like to share your thoughts?"
  modality: voice
  cooldown: 180 seconds

# Silence Interventions
silence_visual:
  trigger: "both_silent > 15 seconds"
  text: "Taking a moment..."
  modality: visual
  cooldown: 60 seconds

silence_voice:
  trigger: "both_silent > 30 seconds AND recent_topic_active"
  text: "[LAST_QUIET_PERSON], take your time. Would you like to share what you're thinking?"
  modality: voice
  cooldown: 120 seconds

# Time Interventions
time_warning:
  trigger: "time_remaining < 5 minutes AND uncovered_goals > 0"
  text: "You have about 5 minutes left. You mentioned wanting to discuss [UNCOVERED_GOAL]—would you like to touch on that?"
  modality: voice
  cooldown: 300 seconds

# Escalation Interventions
escalation_visual:
  trigger: "tension_score > 0.6"
  text: "[Tension indicator rises]"
  modality: visual
  cooldown: 30 seconds

escalation_voice:
  trigger: "tension_score > 0.7 for > 30 seconds"
  text: "I sense some tension rising. Would a 2-minute break help?"
  modality: voice
  cooldown: 180 seconds
```

### Appendix D: Consent Flow Wireframes

```
┌─────────────────────────────────────┐
│         INVITATION SCREEN           │
│                                     │
│  [Product Logo]                     │
│                                     │
│  Maya has invited you to a          │
│  facilitated conversation.          │
│                                     │
│  What this means:                   │
│  • An AI will observe your          │
│    conversation                     │
│  • BOTH of you see the same info    │
│  • Either can pause anytime         │
│  • Nothing is stored by default     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    Learn More (optional)    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     I Consent [Primary]     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   No Thanks [Secondary]     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Maya won't be notified if you      │
│  decline.                           │
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│          SESSION SCREEN             │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      [Video Feed]           │   │
│  │                             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Goal: Discuss vacation budget      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Maya ████████████░░░ 65%    │   │
│  │ David ████████░░░░░░ 35%    │   │
│  └─────────────────────────────┘   │
│                                     │
│  [AI indicator: Facilitation active]│
│                                     │
│  ┌────────┐     ┌────────────────┐ │
│  │ Pause  │     │   End Session  │ │
│  └────────┘     └────────────────┘ │
└─────────────────────────────────────┘
```

### Appendix E: Glossary

| Term | Definition |
|------|------------|
| **Dyadic** | Involving two participants |
| **Facilitation** | Helping a conversation flow without directing content |
| **Diarization** | Identifying which speaker said what |
| **Balance** | Distribution of talk-time between participants |
| **Intervention** | AI action that affects conversation (visual or voice) |
| **Trigger** | Condition that may cause an intervention |
| **Blocker** | Condition that prevents an intervention |
| **Kill switch** | User control to immediately disable AI |
| **Session-only** | Data that is discarded when conversation ends |
| **Symmetric visibility** | Both participants see identical information |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2025 | Product Strategy | Initial unified alpha strategy |
| 1.1 | January 2026 | Product Strategy | Consolidated from DYADIC_ALPHA_MASTER_STRATEGY.md |
