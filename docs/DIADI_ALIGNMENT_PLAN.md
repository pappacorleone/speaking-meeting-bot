# Diadi Alignment Plan

This plan consolidates all alignment gaps found in the review and sequences
fixes based on the current decisions:
- Session objects standardize on `id`; keep `session_id` only as a deprecated
  alias in create responses during the transition.
- Start with Google Meet; Diadi is next (keep option but do not default to it).
- Consent/start contracts align to the invite token flow already implemented.

## Step 1: Normalize session and endpoint contracts
Findings:
- Session objects return `id` but frontend expects `session_id`, breaking hub,
  detail, and live transforms.
- `GET /sessions` returns `{sessions,total,hasMore}` but docs and the API client
  expect `Session[]`.
- Create flow status is `pending_consent` in code but docs/spec show `draft`.
- Consent request uses `{invite_token,invitee_name,consented}` while docs/spec
  show `{participant_id,accepted}`.
- `meeting_url` is required in the start request, even though Diadi should not
  require a meeting URL.
Recommendations:
- Standardize session objects on `id` everywhere; update frontend types,
  transforms, and list parsing.
- Keep `session_id` only as a deprecated alias in create responses, with a
  removal target noted in docs.
- Update `docs/DIADI_TECHNICAL_SPEC.md` to match the
  `{sessions,total,hasMore}` response shape (or change the API to `Session[]`,
  but keep one canonical choice).
- Update docs/spec to match invite-token consent contract and
  `pending_consent` status at creation.
- Make `meeting_url` optional for `platform=diadi`, required for external
  platforms; if Diadi is labeled coming soon, reject `/start` with a clear
  error and keep the meeting URL requirement for Meet/Teams/Zoom.
Status: Completed.

## Step 2: Align WebSocket event schemas
Findings:
- `session_state` payload includes fields not represented in frontend types
  (for example `ai_status`, `facilitator_paused`, `time_remaining`).
- Client sends `update_settings` and `intervention_ack` without the `data`
  envelope the server expects.
- Balance events in tests use `participant_1/participant_2` while frontend
  expects `participantA/participantB`.
Recommendations:
- Define canonical event payloads (fields and units) in docs and
  `web/src/types/events.ts`.
- Standardize client and server on a `data` envelope for all messages; allow a
  short-lived compatibility path if needed.
- Update balance event payloads to `participantA/participantB` consistently.
- Update tests to the final event schema and envelope.
Status: Completed.

## Step 3: Implement real-time facilitation pipeline
Findings:
- `BalanceTracker` and `InterventionEngine` exist but are not integrated into
  the Pipecat pipeline.
- No `balance_update`, `intervention`, `time_remaining`, or `ai_status` events
  are emitted today.
Recommendations:
- Wire diarization or VAD output into `BalanceTracker` with a defined update
  cadence (for example 1-2s).
- Drive `InterventionEngine` from balance/silence/tension signals, and pause it
  when `facilitator_paused` is true.
- Emit real-time events to `/sessions/{id}/events` with the canonical payloads.
- Persist balance/intervention metrics for summary generation.
Status: Completed.

## Step 4: Make kill switch authoritative
Findings:
- Live UI toggles pause locally; it does not call pause/resume endpoints.
- `_notify_pipecat` is a placeholder and no pause/resume control reaches Pipecat.
Recommendations:
- Call `/sessions/{id}/pause` and `/sessions/{id}/resume` from the live UI and
  treat the server response as the source of truth.
- Implement Pipecat control messaging, stop interventions/timers while paused,
  and broadcast `session_state` updates with `facilitator_paused`.
Status: Completed.

## Step 5: Align wizard validation and platform defaults
Findings:
- Wizard allows 90 minutes and 500-char goals; backend enforces 200-char goals
  and the docs specify 15/30/45/60 minutes.
- Default platform is `diadi` while launch is Meet-first.
- Meeting URL validation is generic; docs call out Meet-specific validation.
Recommendations:
- Limit durations to 15/30/45/60 and cap goal length at 200 in the wizard and
  backend validation.
- Default platform to `meet` and label `diadi` as coming soon; disable meeting
  URL input when `diadi` is selected.
- Add Meet URL regex validation in frontend and backend with matching errors.
Status: Completed.

## Step 6: Remove duplicate/garbled UI code paths
Findings:
- Session creation page duplicates the launch step and contains corrupted glyphs.
- Shared `StepLaunch` component exists but is unused.
- Intervention templates contain corrupted characters.
Recommendations:
- Use the shared `StepLaunch` component and remove the duplicate.
- Replace corrupted UI strings and template text with clean ASCII; check persona
  and intervention templates for encoding issues.
Status: Completed.

## Step 7: Unify configuration keys
Findings:
- Frontend uses both `NEXT_PUBLIC_API_KEY` and
  `NEXT_PUBLIC_MEETING_BAAS_API_KEY`.
Recommendations:
- Pick one env var name and update usage, docs, and `.env.example` to match;
  keep a short-lived alias only if needed.
Status: Completed.

## Step 8: Update tests to match final contracts
Findings:
- Tests use outdated models and omit required session fields.
- WebSocket tests use outdated payload shapes.
Recommendations:
- Update fixtures to include required fields and current enums.
- Add tests for session list pagination shape, consent payloads, pause/resume,
  Meet URL validation, and event payload schemas (including the `data` envelope).
Status: Completed.
