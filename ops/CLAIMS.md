# CLAIMS

Every claim made in public (README, video, deck, submission form, UI copy, posts) gets a row with its exact wording.
Status: verified (evidence shows it) | estimated (the public copy says "estimated") | mocked (the public copy says it is simulated or seeded) | planned (must not appear in public copy as present fact) | retracted
A `verified` row cites at least one evidence ID that exists in EVIDENCE.

| ID | Claim (exact public wording) | Where it appears | Evidence | Status |
|---|---|---|---|---|
| C-001 | Bluefold turns the table in front of a seated player into an indigo resist-dye workshop: fold and tie a cloth with bare hands, dip it in the vat, and unfold a pattern their own folds made. | README, video, Devpost | E-003 | verified (emulator only; README says not tested on a headset) |
| C-002 | Every step is done with bare hands / hands-only from the first frame: there is no controller path | README, Devpost hand field, video caption | E-003 (hand input mode only; no controller code in src/bluefold) | verified (emulator) |
| C-003 | Finds your table with plane detection and lays a white cloth on it; if no table is found, it brings a small virtual one | README, Devpost | E-003 (log "placed on plane"); fallback DERIVED from game.ts placeWorkspace | verified (emulator synthetic room) |
| C-004 | It comes out yellow-green and turns blue in the air (oxidises over three seconds) | README, Devpost, video | E-003 screenshots; DERIVED from game.ts / pattern.ts | verified |
| C-005 | One tie on a twice-folded cloth becomes four mirrored sunbursts | README, Devpost | docs/reveal.png (dress rehearsal 2026-11-18T09:12Z) | verified |
| C-006 | Scored against today's target; new target every day, the same for everyone (UTC date seed) | README, Devpost, video | E-003 log "reveal score"; DERIVED from fold.ts dailyRecipe(todayKey) | verified |
| C-007 | All sound is synthesised with Web Audio; no third-party art or audio | README, Devpost | DERIVED from src/bluefold/audio.ts and repo contents (public/audio/chime.mp3 from the IWSDK starter is unused) | verified |
| C-008 | One cloth takes about two minutes | README, video caption | Film run 2026-11-18T09:17:49Z to 09:19:21Z: fold x2, tie, clamp, dip, unfold in 92 s scripted | estimated (scripted pace; wording says "about") |
| C-009 | Not yet tested on a headset / recorded in the Immersive Web Emulator (Quest 3) | README, Devpost, video caption | Fact of process | verified |
| C-010 | Inspired by adire oniko (Yoruba, tied with raffia) and itajime shibori (Japanese, folded and clamped) | README, Devpost, video caption | Framing only; README states it is a simplified game model | verified (as framing) |
