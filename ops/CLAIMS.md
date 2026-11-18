# CLAIMS

Every claim made in public (README, video, deck, submission form, UI copy, posts) gets a row with its exact wording.
Status: verified (evidence shows it) | estimated (the public copy says "estimated") | mocked (the public copy says it is simulated or seeded) | planned (must not appear in public copy as present fact) | retracted
A `verified` row cites at least one evidence ID that exists in EVIDENCE.

| ID | Claim (exact public wording) | Where it appears | Evidence | Status |
|---|---|---|---|---|
| C-001 | Bluefold turns the table in front of a seated player into an indigo resist-dye workshop: fold and tie a cloth with bare hands, dip it in the vat, and unfold a pattern their own folds made. | README, video, Devpost | E-003, E-005 | verified |
| C-002 | Every step is done with bare hands; hands-only from the first frame, no controller path | README, Devpost hand field, video caption | E-003, E-005 | verified |
| C-003 | Finds your table with plane detection and lays a white cloth on it; if no table is found, it brings a small virtual one | README, Devpost | E-003 | verified |
| C-004 | It comes out yellow-green and turns blue in the air (oxidises over three seconds) | README, Devpost, video | E-003 screenshots; DERIVED from game.ts / pattern.ts | verified |
| C-005 | One tie on a twice-folded cloth becomes four mirrored sunbursts | README, Devpost | E-005 | verified |
| C-006 | Scored against today's target; new target every day, the same for everyone (UTC date seed) | README, Devpost, video | E-003 log "reveal score"; DERIVED from fold.ts dailyRecipe(todayKey) | verified |
| C-007 | All sound is synthesised with Web Audio; no third-party art or audio | README, Devpost | E-006 | verified |
| C-008 | One cloth takes about two minutes | README, video caption | E-005 (92 s scripted loop) | estimated |
| C-009 | Not yet tested on a headset; recorded in the Immersive Web Emulator (Quest 3) | README, Devpost, video caption | E-003, E-005 | verified |
| C-010 | Inspired by adire oniko (tied with raffia) and itajime shibori (folded and clamped); a simplified game model | README, Devpost, video caption | E-006 (framing stated in README) | verified |

Notes: C-001 to C-003 are verified in the emulator only; every public surface also carries C-009 (not tested on a headset). C-008 is worded with "about".
