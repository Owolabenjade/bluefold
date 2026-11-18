# EVIDENCE

Each entry records a check that actually ran. If it did not run, it is not evidence.

## Entries

## E-001: IWSDK 1.1.0 scaffolds and builds on this machine
Date (UTC): 2026-11-17T23:50Z
Commit: none (scratch probe outside the repo; the same flags then created this repo at 2026-11-18T00:00Z)
Environment: Windows 11 Pro, Git Bash, Node v22.20.0, npm 10.9.3
Method: `npm create @iwsdk@1.1.0 probe-mr -- -y --target ar --language ts --grabbing --scene-understanding --no-physics --no-git --install`, then `npm run build`
Result: create exit 0; `vite build` "built in 16.09s", exit 0; dist/ is 3.6M with assets/, audio/, index.html, scenes/, ui/. Main chunk 2,434.83 kB (670.69 kB gzip).
Label: OBSERVED
Limits: Build only. Does not show an XR session, hand input or plane detection working.

## E-002: Saturation scan of public competition repos on GitHub
Date (UTC): 2026-11-17T23:52Z to 2026-11-17T23:58Z
Commit: none
Environment: GitHub search API, unauthenticated
Method: repository searches for the competition name, "hands-first Quest", "iwsdk mixed reality", and each candidate concept (light puzzle, shadow, origami, constellation, music, dye, puzzle box)
Result: About 75 public repos describe entries. Close matches: palm-mirror light puzzle 3 (zouhirmahjoubi/palmlight, zouhirmahjoubi/beam, W1nnnd/prism-desk); hand shadows 4; origami 2 (yy5652-hash/foldlings, pbhatti/origami_webxr); ceiling stars 2 (Evin-Saju/north-by-night, DelcastApe/Cosmoweaves-MR); music in the room 3; focus desks 6+. Resist-dye, indigo, tie-dye or shibori in XR: 0.
Label: OBSERVED
Limits: Public GitHub repos only; most entries are private or unpublished (6,817 registrants). The Devpost gallery is not published yet.
