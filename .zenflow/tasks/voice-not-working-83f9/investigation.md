# Investigation: Voice Not Working in Diadi Sessions

## Bug Summary

Bot gets added to the meeting but doesn't have voice (TTS is not working) when using Diadi facilitation personas (neutral_mediator, deep_empath, decision_catalyst).

## Root Cause Analysis

The voice ID (`cartesia_voice_id`) is not being passed correctly from the parent process to the Pipecat subprocess. The resolved voice ID is lost in the subprocess handoff.

### Detailed Breakdown

1. **Voice ID Resolution (Parent Process)**
   - In `app/routes.py:266-272` and `app/services/session_service.py:352-358`, the voice ID is correctly resolved using `VoiceUtils.match_voice_to_persona()` and stored in `persona_data["cartesia_voice_id"]`
   - This `persona_data` dict is passed to `start_pipecat_process()` in `core/process.py`

2. **Subprocess Invocation (core/process.py)**
   - The `persona_data` is JSON-serialized and passed via `--persona-data-json` command line argument (lines 49-50, 74-75)
   - This correctly serializes the voice ID

3. **Subprocess Parsing (scripts/meetingbaas.py:617-638)**
   - The `--persona-data-json` is parsed back to a dict
   - However, it's only used to **look up the persona folder name by display name** (lines 631-636)
   - The actual `cartesia_voice_id` from the parsed persona_data is **never used**

4. **Voice ID Usage in main() (scripts/meetingbaas.py:394-402)**
   - The `main()` function signature does NOT accept `persona_data` as a parameter
   - It re-loads the persona from disk: `persona = persona_manager.get_persona(persona_name)` (line 382)
   - The voice ID is read from **environment variable**: `voice_id = os.getenv("CARTESIA_VOICE_ID")` (line 394)
   - The `cartesia_voice_id` from persona_data is completely ignored

5. **Diadi Personas Have TBD Voice IDs**
   - `config/personas/neutral_mediator/README.md` line 20: `cartesia_voice_id: TBD`
   - `config/personas/deep_empath/README.md` line 20: `cartesia_voice_id: TBD`
   - `config/personas/decision_catalyst/README.md` line 20: `cartesia_voice_id: TBD`
   - Since these say "TBD", the runtime-resolved voice ID from VoiceUtils is essential

## Affected Components

| File | Line(s) | Issue |
|------|---------|-------|
| `scripts/meetingbaas.py` | 280-300 | `main()` function signature doesn't accept persona_data |
| `scripts/meetingbaas.py` | 381-386 | Re-loads persona from disk, losing resolved voice_id |
| `scripts/meetingbaas.py` | 394-402 | Uses `os.getenv("CARTESIA_VOICE_ID")` instead of persona_data |
| `scripts/meetingbaas.py` | 617-650 | Parses persona_data but doesn't pass it to main() |
| `config/personas/*/README.md` | Diadi personas | Have `cartesia_voice_id: TBD` requiring runtime resolution |

## Proposed Solution

Modify `scripts/meetingbaas.py` to use the `cartesia_voice_id` from the persona_data passed via command line, with fallback to environment variable if not present.

### Option A: Pass voice_id via command line argument (Simpler)
Add a new `--cartesia-voice-id` command line argument and use it in main().

### Option B: Use persona_data in main() (More complete)
1. Add `persona_data: Optional[Dict] = None` parameter to `main()`
2. If `persona_data` is provided and contains `cartesia_voice_id`, use it
3. Otherwise, fall back to `os.getenv("CARTESIA_VOICE_ID")`
4. Pass the parsed `persona_data` from `__main__` to `main()`

**Recommended: Option B** - This is more complete and allows other persona-specific data to be used correctly.

## Test Plan

1. Create a Diadi session with `skip_consent=true`
2. Start the session with a meeting URL
3. Verify Pipecat subprocess logs show correct voice_id being used
4. Verify TTS audio is being generated and sent to the meeting
5. Test all three Diadi personas: neutral_mediator, deep_empath, decision_catalyst

## Implementation Notes

- The fix requires changes only to `scripts/meetingbaas.py`
- No API changes or database changes needed
- Backward compatible: existing behavior preserved when no persona_data is provided
- The `--persona-data-json` argument already exists and is being passed correctly
