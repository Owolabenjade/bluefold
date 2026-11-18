# PLAN

Project: Bluefold
Thesis: Bluefold turns the table in front of a seated player into an indigo resist-dye workshop: fold and tie a cloth with bare hands, dip it in the vat, and unfold a pattern their own folds made.
Tagline: Fold, tie and dip cloth with bare hands, then unfold the indigo pattern you made.
Track / division: Gaming / New Experience (Meta VR Start Developer Competition 2026)
Timebox: hackathon. Deadline and gates: see ops/CLOCK.md

Change this plan only through a DECISION entry. Keep it to one screen.

## Demo path
1. Open https://owolabenjade.github.io/bluefold/ in the Quest Browser and enter mixed reality; no controllers.
2. A white cloth lies on the real table (detected plane; fallback: a virtual table at seated height). Today's target cloth hangs on the wall.
3. Pinch a glowing edge tab and drag it across: the cloth folds (half, quarter, triangle). Pinch the folded bundle to tie a binding.
4. Grab the bundle and lower it into the indigo vat; lift it out and watch it oxidize from green to blue.
5. Pull the corner to unfold: the pattern your folds and ties made appears, is scored against today's cloth, and joins your gallery on the wall.

## Milestones
| ID | Milestone | Done when (observable) | Gate | Status |
|---|---|---|---|---|
| M1 | Tracer bullet | One fold, one tie, one dip, unfold reveal, in the emulator and on the public URL; typecheck + build pass | Tracer bullet | todo |
| M2 | Core | Fold types (half x/y, diagonal, accordion), tie + clamp, multi-dip, table/wall placement from planes, daily target + score, gallery persists | Feature freeze | todo |
| M3 | Hardened | No-text onboarding cues, audio, landing page, fallback without planes, frame budget checked in emulator | Video recorded | todo |
| M4 | Shipped | README, video and Devpost form done; presubmit passes; Devpost shows submitted | Submitted | todo |

Status: todo | doing | done | cut

## Targeted tracks and prizes
| Track or prize | Requirement (verbatim, with source) | Where we meet it | Status |
|---|---|---|---|
| Best New Gaming Experience | "Games designed for hands-first (required) or eyes and hands. Puzzle, strategy, casual, social, narrative" (Official Rules s.4) | Daily cloth puzzle, hands only | todo |
| Best First Five Minutes | "teaches controller-free interaction without a wall of text, and delivers a payoff before the user takes the headset off" (Official Rules s.7) | First cloth taught by glowing tabs and motion cues; reveal within 2 minutes | todo |
| Best Reason to Come Back | "something to work toward, visible growth between sessions, and a loop that pulls the user back tomorrow" (Official Rules s.7) | Daily target cloth, streak, gallery wall | todo |
| Boldest Original Concept | "Judged on originality and on whether the experience would fall apart on any other platform" (Official Rules s.7) | Hands fold, tie and dip; real table and wall | todo |

## Out of scope
- Multiplayer, AI or agentic features, Meta VR Glasses tuning, controller-specific features, store packaging (PWA), cloth physics simulation (folds are rigid flat folds).
