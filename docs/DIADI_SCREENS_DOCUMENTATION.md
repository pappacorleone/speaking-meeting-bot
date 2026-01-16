# Diadi Screens Documentation

## Scope
This document catalogs the UI screens found under `docs/Diadi screens`. Each folder is summarized, and every screenshot is described by state, intent, and UI elements. The final section captures the overall design system observed across the screens.

## Overall Design System
- Tone and voice: Calm, facilitative, and neutral. Copy emphasizes safety, balance, and clarity with short directives and supportive prompts.
- Typography: Large editorial serif for primary headings paired with a clean sans-serif for body, labels, and UI controls. Section labels often use uppercase, letterspaced microcopy.
- Color system: Warm neutrals (cream, off-white) dominate surfaces. Primary actions lean toward muted sage/olive green. Dark charcoal and near-black are used for call bars, modals, and nav. Amber/gold appears for warnings or tension cues. Brick red tones signal safety-critical or termination states.
- Layout: Card-first design with generous whitespace. Desktop views use left vertical nav plus large content cards; mobile stacks cards with tall padding. Split compositions show mobile and desktop side-by-side for comparative states.
- Shape language: Large radii on cards, modals, and buttons. Pill and capsule buttons appear frequently. Soft drop shadows add depth.
- Imagery: Mix of soft photography (video call scenes) and hand-drawn illustration portraits. Backgrounds are often blurred or desaturated to keep overlays readable.
- Iconography: Minimal line icons and filled badges. Status dots and small circular badges indicate activity states.
- Data visualization: Circular progress rings, balance meters, small progress bars, and numeric badges for neutrality or talk-time.
- Interaction patterns: Modal overlays, bottom sheets on mobile, stepper progress for multi-step setup, toggle switches for agent settings, segmented controls for time selection.
- Safety and escalation: Tiered intervention screens are color coded and progressively more direct, with large, high-contrast CTA buttons and emergency resources.

## Folder: active session (diadi)
Purpose: In-session UI for Diadi native experience, including openers, readiness, interventions, and milestone recognition.

- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 044207.png` (1439x765, landscape): Initialization state. Left mobile frame shows "Waiting for David..." with an agent pre-check indicator. Right desktop panel reads "You are Ready." with status dots for mic, agent, and partner.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 171135.png` (1044x740, landscape): Dual mobile states. Left shows active call with timer, talk balance pill, and small complication chips. Right shows expanded facilitator settings sheet with toggles for sentiment, tension, and prompts, plus "Apply Configuration."
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 172756.png` (855x644, landscape): Desktop in-call overlay with participant label, talk balance bar, remaining time, and a bottom control bar (mic, camera, agent status, settings, end call). PIP video card sits on the left.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 175050.png` (1220x657, landscape): Direct intervention for grounding. Mobile shows "Pause & Breathe" with a 60-second timer. Desktop shows "Neutral Grounding Active" with observation/subject/status chips and a "Resume Session Early" button.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 175056.png` (1201x589, landscape): Resolution recognition. Mobile shows "Alignment Reach" card; desktop overlay announces "Milestone Captured" with a "Continue Talk" CTA.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 180318.png` (1012x618, landscape): Dynamic intervention prompt. Mobile "Bridge Insight" card asks a pivot question with "Yes, Pause & Pivot" and "Not Yet." Desktop overlay flags "Neutral Grounding" with escalation alert and accept/decline actions.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 180330.png` (1019x620, landscape): Opening welcome. Mobile shows "Welcome Maya & David" with "Start Conversation." Desktop modal "Setting the Space" includes a "Ready" CTA and a settings gear.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 180515.png` (434x690, portrait): Full-screen mobile welcome with wave background, primary intention card, and a large "Start Conversation" button.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 180519.png` (870x583, landscape): Desktop readiness split. Left text panel shows duration and privacy cards plus "Open the Line" CTA. Right image pane displays a partner readiness pill.
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 180545.png` (770x715, landscape): Two mobile intervention variants. Left shows "Bridge Recommendation" with "Pull Bridge" and dismiss. Right shows "Tension Detected" with a strong amber CTA "Yes, Take a Beat."
- `docs/Diadi screens/active session (diadi)/Screenshot 2026-01-01 183104.png` (1374x739, landscape): Initialization and readiness. Mobile welcome on left; desktop shows "Ready to connect?" with mic/camera verified checks, AI mode status, and "Start Session."

## Folder: active session (zoom_meet)
Purpose: In-session UI overlays and facilitator prompts inside Zoom-style meetings.

- `docs/Diadi screens/active session (zoom_meet)/Screenshot 2025-12-30 230744.png` (357x714, portrait): Mobile Zoom tile view with four illustrated participants. Overlays include a talk balance meter, "Calm" sentiment tag, facilitator tile, and bottom call controls.
- `docs/Diadi screens/active session (zoom_meet)/Screenshot 2026-01-04 103921.png` (2178x1209, landscape): Desktop multi-tile view with a facilitator analysis panel. "Active Analysis" label sits atop a right-side tile with metric buttons and a mediation nudge card.
- `docs/Diadi screens/active session (zoom_meet)/Screenshot 2026-01-04 103935.png` (1383x1205, landscape): Mobile split view. Left tile shows participant with a "Nudge Trigger" card and prompt CTA. Right column contains smaller tiles and a "Converge Hub" control bar.
- `docs/Diadi screens/active session (zoom_meet)/Screenshot 2026-01-04 104525.png` (632x1042, portrait): Mobile participant tile with a bottom "Dialogue Equity" card that flags extended speaking time and suggests inviting the partner.
- `docs/Diadi screens/active session (zoom_meet)/Screenshot 2026-01-04 104556.png` (731x1209, portrait): Expanded version of the dialogue equity prompt, emphasizing the message and a "Skip" action.
- `docs/Diadi screens/active session (zoom_meet)/Screenshot 2026-01-04 104611.png` (2173x1208, landscape): Desktop Zoom view with "Converge AI" overlay, balanced turn-taking prompt card, metric buttons, and the standard call control bar with a red "End Call" button.

## Folder: complications
Purpose: Micro-widgets and metrics surfaced as live complications inside call UI.

- `docs/Diadi screens/complications/Screenshot 2025-12-30 231126.png` (123x135, portrait): Circular talk balance ring labeled "Talk Balance" with a 55/45 split.
- `docs/Diadi screens/complications/Screenshot 2025-12-30 231131.png` (162x138, landscape): Sentiment badge showing "Calm" inside a dark circular chip.
- `docs/Diadi screens/complications/Screenshot 2025-12-30 231135.png` (142x132, landscape): Tension meter with vertical color bar and a numeric level label "L01."
- `docs/Diadi screens/complications/Screenshot 2025-12-30 231138.png` (117x126, portrait): Goal alignment bar showing 75 percent.
- `docs/Diadi screens/complications/Screenshot 2025-12-30 231141.png` (124x124, square): Keywords complication showing "Equity Pivot Risk."
- `docs/Diadi screens/complications/Screenshot 2025-12-30 231144.png` (139x124, landscape): Session clock with small dot icon and time "12:34."
- `docs/Diadi screens/complications/Screenshot 2025-12-30 231159.png` (1180x533, landscape): "Facilitator Participant" layout for Zoom, showing a dedicated facilitator tile overlaid with complications and notes on integration logic.

## Folder: hub
Purpose: Home hub and library views for sessions and artifacts.

- `docs/Diadi screens/hub/Screenshot 2025-12-31 013921.png` (1373x721, landscape): Mobile and desktop hub overview. Mobile shows "Talk." header, session card, artifact library, and recent sessions. Desktop shows "The Hub." with search bar, session card, and left nav.
- `docs/Diadi screens/hub/Screenshot 2025-12-31 013934.png` (1436x730, landscape): Hub detail view. Mobile shows recent sessions list and artifact tiles. Desktop shows session artifact library grid and recent sessions archive cards.

## Folder: interventions
Purpose: Automated and manual intervention states across the session lifecycle, from gentle nudges to safety termination.

- `docs/Diadi screens/interventions/Screenshot 2025-12-30 1801217.png` (450x889, portrait): State 02.1 High Tension. "Intensity Detected" modal invites a 2-minute breath pause with "Pause Session" and "We're okay."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 180210.png` (430x898, portrait): State 01.1 Balance Drift. "Perspective Shift" modal prompts a partner response; includes 70/30 balance widget and "Got it" or "Skip."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 1802101.png` (462x898, portrait): State 01.2 Goal Drift. "Goal Alignment" modal reminds the goal and asks to redirect; buttons "Redirect" and "Stay here."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 1802117.png` (452x889, portrait): State 02.3 Crisis Support. Full-screen pause with safety resources (Crisis Text Line, Domestic Violence Hotline) and "End Session Immediately."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 180217.png` (461x889, portrait): State 02.2 Manual Kill Switch. "Pause AI Facilitation?" modal with explanation and "Pause AI" or "Cancel."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 1810210.png` (454x898, portrait): State 01.3 Alignment Reached. "Breakthrough" modal asks to save an action item; "Save Action" and "Dismiss."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 2010948.png` (446x885, portrait): Tier 1 Relational Friction. "Constructive Pause" with recommended support card and "End & Archive" CTA.
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 2100948.png` (511x885, portrait): Tier 2 Emotional Distress. "Take a Moment" with crisis and therapist access options plus "Close Room."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 230514.png` (279x517, portrait): Start step 02 Icebreaker. Small modal offers an opening script with "I'll Start."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 230526.png` (287x533, portrait): Start step 03 Goal Sync. "Ready to align?" with the proposed session goal and "Confirm" or "Edit."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 230610.png` (302x538, portrait): Mid-session Tension Escalation. "Breathe Moment" with a timed pause CTA and "We're okay."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 230628.png` (289x543, portrait): Utility Kill Switch. "Mute Agent?" with participant readiness labels and "Pause AI Facilitation."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 231018.png` (324x184, landscape): Compact overlay "Emotional Intensity High" with "Pause Session" and "Continue," plus "AI Intervention Active" badge.
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 231042.png` (242x134, landscape): Compact overlay for remaining time: "5 Minutes Remaining" with facilitator label.
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 232647.png` (385x204, landscape): Compact overlay showing "Re-syncing with Goal..." and a spinner.
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 232656.png` (379x195, landscape): Compact overlay "Time for a reflection" with a guiding quote and "AI Prompting..." tag.
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 233249.png` (410x862, portrait): Termination High Friction. "Human Intervention" screen lists professional referrals and "Review Talk Artifacts."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 233254.png` (437x865, portrait): Termination Safety/Violence. "Peace & Protection" with DV resources and "Exit to Home."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 233258.png` (430x864, portrait): Termination Self-harm/Crisis. "Priority: Safety" with hotline and crisis text line, plus "Close Room Now."
- `docs/Diadi screens/interventions/Screenshot 2025-12-30 233334.png` (335x715, portrait): Mediation Suggested prompt with "Enable Mediation" and "Skip."
- `docs/Diadi screens/interventions/Screenshot 2025-12-310 200948.png` (424x885, portrait): Tier 3 Safety Crisis. Red screen "Priority: Human Safety" with 988 call CTA and DV hotline, session disconnected.

## Folder: navigation
Purpose: Navigation components for mobile and desktop.

- `docs/Diadi screens/navigation/Screenshot 2025-12-30 232335.png` (328x126, landscape): Mobile bottom nav with home and people icons and a center "No Image" icon, selected state highlighted in green.
- `docs/Diadi screens/navigation/Screenshot 2025-12-30 232345.png` (172x593, portrait): Desktop vertical sidebar, collapsed state with minimal icons.
- `docs/Diadi screens/navigation/Screenshot 2025-12-30 232404.png` (287x605, portrait): Desktop sidebar expanded state showing account info, "Dashboard," "Partners," and a collapse control.
- `docs/Diadi screens/navigation/Screenshot 2025-12-30 232717.png` (208x311, portrait): Account menu popover listing profile, agent studio, integrations, settings, and sign out.

## Folder: partner invitation
Purpose: Invite flow for partners with intent, pulse, and prep.

- `docs/Diadi screens/partner invitation/Screenshot 2025-12-31 135823.png` (1269x745, landscape): Step 01 Invitation. Mobile invite card with aim, time, and link. Desktop invite with Accept/Decline and session context card.
- `docs/Diadi screens/partner invitation/Screenshot 2025-12-31 135832.png` (1204x692, landscape): Step 02 Strategic Intent. Mobile shows session goal and facilitator tips. Desktop emphasizes confirmed goal and guidance tiles.
- `docs/Diadi screens/partner invitation/Screenshot 2025-12-31 135840.png` (1361x732, landscape): Step 03 Emotional Pulse. Mobile emotion selector grid. Desktop uses large selection tiles, nudge bar, and "Continue" CTA.
- `docs/Diadi screens/partner invitation/Screenshot 2025-12-31 150015.png` (368x719, portrait): Mobile session detail view with AI prep card, objective, mediator status, artifact count, and "Launch Session."
- `docs/Diadi screens/partner invitation/Screenshot 2025-12-31 150019.png` (1051x805, landscape): Desktop session detail and prep hub with objective, mediator config, deep prep lab, room link, and launch button.
- `docs/Diadi screens/partner invitation/Screenshot 2025-12-31 150025.png` (1030x793, landscape): Desktop deep prep detail showing modules (Simulate Rehearsal, Draft Opener, Friction Audit, Strategic Advice) with "Start Deep Prep Session."

## Folder: partner profiles
Purpose: Partner management, history, and next-goal proposals.

- `docs/Diadi screens/partner profiles/Screenshot 2025-12-30 1815105.png` (360x788, portrait): Partner actions menu with invite, edit context, and remove partner options.
- `docs/Diadi screens/partner profiles/Screenshot 2025-12-30 204653.png` (504x880, portrait): Goal evolution proposal with AI suggested goal card, adopt CTA, manual entry, and confirm.
- `docs/Diadi screens/partner profiles/Screenshot 2025-12-30 225626.png` (1042x767, landscape): Desktop partner perspective dashboard with dyad health, active goal, recommendations, and journey history.
- `docs/Diadi screens/partner profiles/Screenshot 2025-12-30 232021.png` (346x691, portrait): Mobile partner overview with AI recommendation card and journey history list.
- `docs/Diadi screens/partner profiles/Screenshot 2025-12-30 232118.png` (356x694, portrait): Mobile partner profile header with AI dyad summary and shared artifacts.

## Folder: session creation
Purpose: Session setup flow across desktop and mobile, plus deep prep entry points.

- `docs/Diadi screens/session creation/Screenshot 2025-12-31 143620.png` (1010x721, landscape): Desktop step 00 Identity and Bond. Partner name and relationship context fields; progress indicator; CTA to continue.
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 143623.png` (1065x727, landscape): Desktop step 01 Session Goal. Goal text area, time selection (now/later), duration chips, and "Next: Calibration."
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 143628.png` (1032x720, landscape): Desktop step 02 Facilitator Calibration. Persona cards (neutral selected) and parameter toggles; "Review & Connect."
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 143631.png` (1030x725, landscape): Desktop step 03 Penultimate Confirmation. Center modal summarizing partner, facilitator, and goal; CTA to initialize room.
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 143635.png` (1015x705, landscape): Desktop step 04 Launch Hub. Connection link, platform choice, encryption badge, and "Launch Facilitated Session."
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 144126.png` (365x697, portrait): Mobile step 00 Identity and Bond with partner and relationship fields.
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 144128.png` (377x752, portrait): Mobile step 01 Session Context with now/later and duration chips; CTA to calibration.
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 144131.png` (352x720, portrait): Mobile step 02 Facilitator Calibration with persona and toggles; "Review & Connect."
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 144134.png` (360x708, portrait): Mobile step 03 Penultimate Confirmation bottom sheet with "Accept & Initialize."
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 144137.png` (366x718, portrait): Mobile step 04 Launch Hub with connection link, platform selection, encryption badge, and "Launch Session."
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 145032.png` (1041x775, landscape): Desktop session detail and deep prep entry. Title, session goal, facilitator card, and deep prep lab panel.
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 145037.png` (1040x789, landscape): Desktop deep prep panel with module cards and "Deep Prep with AI" CTA.
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 145040.png` (431x783, portrait): Mobile session detail and deep prep card with goal preview.
- `docs/Diadi screens/session creation/Screenshot 2025-12-31 145044.png` (390x728, portrait): Mobile session detail showing goal, facilitator, documents, and "Launch Session."

## Folder: session detail
Purpose: Pre-session prep, during-session monitoring, and post-session recap.

### During-session
- `docs/Diadi screens/session detail/during-session/Screenshot 2026-01-02 170340.png` (1693x819, landscape): Live facilitation monitor. Mobile view shows neutrality quotient ring, agent suggestion card, participant selector, and "Complete Session." Desktop view shows 8.8 active mediation ring, talk-time split, strategy insight card, and goal progress checklist.

### Post-session
- `docs/Diadi screens/session detail/post-session/Screenshot 2025-12-30 173732.png` (439x916, portrait): Full transcript view with speaker cards, AI prompt annotation, and keyword search.
- `docs/Diadi screens/session detail/post-session/Screenshot 2025-12-30 2039391.png` (470x863, portrait): Agent performance calibration with a 1-5 scale (3 selected) and next goal proposal; "Finish Calibration."
- `docs/Diadi screens/session detail/post-session/Screenshot 2025-12-30 204653.png` (504x880, portrait): Post-session "Evolve" screen offering an AI suggested next goal with adopt and confirm actions.
- `docs/Diadi screens/session detail/post-session/Screenshot 2025-12-30 205020.png` (433x871, portrait): Artifact explorer with session recording, AI consensus summary, action items, and "Download PDF."
- `docs/Diadi screens/session detail/post-session/Screenshot 2025-12-30 225213.png` (431x729, portrait): Summary view with consensus achieved card, generated assets, and "Rate this session."
- `docs/Diadi screens/session detail/post-session/Screenshot 2025-12-30 225319.png` (427x871, portrait): Feedback modal for AI calibration with presence intensity slider and connection quality selection.
- `docs/Diadi screens/session detail/post-session/Screenshot 2026-01-04 092600.png` (1268x815, landscape): Desktop recap synthesis board with AI consensus summary, action items, generated assets, and key agreements.
- `docs/Diadi screens/session detail/post-session/Screenshot 2026-01-04 092605.png` (1270x813, landscape): Desktop full transcript view with timestamps, AI prompt annotation, and keyword search.
- `docs/Diadi screens/session detail/post-session/Screenshot 2026-01-04 092614.png` (1241x807, landscape): Desktop shared artifacts library with document cards for downloadable files.

### Pre-session
- `docs/Diadi screens/session detail/pre-session/Screenshot 2025-12-31 150007.png` (354x738, portrait): Mobile session detail view showing pre-session phase, deep prep CTA, and objective section.
- `docs/Diadi screens/session detail/pre-session/Screenshot 2025-12-31 150015.png` (368x719, portrait): Mobile detail view focused on prep card, objective, mediator status, artifact count, and "Launch Session."
- `docs/Diadi screens/session detail/pre-session/Screenshot 2025-12-31 150019.png` (1051x805, landscape): Desktop session detail and prep hub with objective, mediator config, deep prep lab, and launch CTA.
- `docs/Diadi screens/session detail/pre-session/Screenshot 2025-12-31 150025.png` (1030x793, landscape): Desktop prep hub detail with module cards and "Start Deep Prep Session."
- `docs/Diadi screens/session detail/pre-session/Screenshot 2026-01-04 092056.png` (1157x760, landscape): Desktop simulation overlay for rehearsal setup with roleplay style, focus area, and "Begin Rehearsal."
- `docs/Diadi screens/session detail/pre-session/Screenshot 2026-01-04 092507.png` (1201x761, landscape): Simulation active state with minimal UI, quoted dialogue, microphone indicator, and "Exit Lab."

## Folder: user profile
Purpose: Account management, billing, and AI assistant configuration.

- `docs/Diadi screens/user profile/Screenshot 2025-12-30 192703.png` (1314x871, landscape): Desktop "Management HQ" with profile and billing, integrations, and AI assistant configuration cards.
- `docs/Diadi screens/user profile/Screenshot 2025-12-30 225714.png` (348x713, portrait): Mobile "User HQ" with account management, assistant listing, integrations, and bottom navigation.
