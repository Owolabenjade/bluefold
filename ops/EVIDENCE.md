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

## E-003: Demo path runs end to end in the IWER emulator with hand input
Date (UTC): 2026-11-18T00:50Z
Commit: 68cdc8c (gallery and hints added in 8548a8a)
Environment: IWSDK dev server, managed Chromium, IWER 2.8 metaQuest3 device, sunlit_living_room synthetic environment, hand input mode, headset seated at the dining table (-0.95, 1.18, 2.05)
Method: scripted with `npx @iwsdk/cli xr run-sequence` / `xr select` (scratch flow.sh): grab fold-tab-0 and lay it across; ray-pinch the bundle; grab lift-loop and release over the vat; grab unfold-tab and pull; screenshots after each step
Result: Workspace placed on the detected `table` plane at y 0.74 (log "[bluefold] placed on plane -0.95 0.74 1.63 head 1.18"); fold completed (half-width bundle, new tabs); tie knot placed (log "cloth pointerdown fold false -1.051,0.747,1.554"); bundle dipped and dyed indigo with a white tie sunburst; unfold produced the reveal (log "[bluefold] reveal score 83"); finished cloths appear in the gallery after reload.
Label: OBSERVED
Limits: Emulated hands and room only. Not run on a Quest headset, so real hand-tracking jitter, Quest Browser plane permissions and frame rate are unverified. Audio was not heard.

## E-004: Public build on GitHub Pages loads and renders
Date (UTC): 2026-11-18T08:44Z
Commit: ab0567c
Environment: GitHub Actions (ubuntu-latest, Node 22) build; desktop Chrome on Windows 11 (no XR device)
Method: Pages workflow run 44268746961; `curl` of https://owolabenjade.github.io/bluefold/ and its assets; opened the URL in Chrome and read the console
Result: Workflow success. Page 200; main bundle 200 (2,432,920 bytes); ui/welcome.uikitml 200; scenes/main.iwsdk.scene.json 200. Chrome renders the welcome panel, today's cloth and the workspace; console shows no errors (one ANGLE shader precision warning).
Label: OBSERVED
Limits: Desktop only; the immersive session on a Quest Browser is not verified.

## E-005: Dress rehearsal of the full loop with two folds, a tie and a clamp
Date (UTC): 2026-11-18T09:10Z to 09:12Z
Commit: 1e77da0 (layout fix applied after the run)
Environment: IWER 2.8 metaQuest3, sunlit_living_room, hand input, seated head pose (-0.95, 1.2, 2.08); scripted with scratch film.mjs (animate-to and set-select-value)
Method: two folds (half x, then half z), ray-pinch tie, clamp block dropped on the bundle, carried to the vat, unfolded; screenshots after each step
Result: docs/tied.png (quarter bundle with knot and clamp), docs/dyed.png (indigo bundle with tie sunburst and clamp square), docs/reveal.png (unfolded cloth with four mirrored sunbursts and four clamp squares, label "68% match"). The recorded film run at 09:17:49Z to 09:19:21Z repeated the same loop in 92 seconds.
Label: OBSERVED
Limits: Emulator; scripted hand motion, not a person.

## E-006: Repository contains no third-party art or audio
Date (UTC): 2026-11-18T09:30Z
Commit: ff27aed
Environment: local clone
Method: `git ls-files | grep -iE '\.(mp3|wav|ogg|glb|gltf|jpg|jpeg|ktx2|hdr|png)$'`; read src/bluefold/audio.ts and props.ts
Result: Only docs/*.png screenshots of Bluefold itself are tracked. Sounds are oscillators and filtered noise in audio.ts; all geometry is procedural Three.js primitives in props.ts and cloth.ts. The starter's chime.mp3 was removed.
Label: OBSERVED
Limits: Does not cover npm dependencies (IWSDK, Three.js, UIKit), which are MIT or Apache licensed packages.

## E-007: Demo video recorded and public on YouTube
Date (UTC): 2026-11-18T09:53Z
Commit: b30d28c
Environment: Recorded by the human with Xbox Game Bar on Windows 11 from the managed Chromium window (IWER, Quest 3 profile) while scratch film.mjs drove the hands; captions are dev-only and advance on game events
Method: file `Videos\Captures\Bluefold 2026-11-18 10-31-55.mp4` (duration read from Windows file properties); YouTube oEmbed request for https://youtu.be/_0fn1PQe8d0 without login
Result: Local file 1:40, 92.3 MB; recording window 09:31:55Z to 09:33:35Z matches the scripted run log 09:31:52Z to 09:33:37Z. oEmbed returns HTTP 200 with title "Bluefold", so the video is public.
Label: OBSERVED
Limits: Claude did not watch the video; the human reviewed it. Audio content not checked.

## E-008: Meta VR Start membership active
Date (UTC): 2026-11-18T10:31Z
Commit: 8b8355e
Environment: Human's browser, communityforums.atmeta.com profile page
Method: Screenshot shared by the human of their forum profile
Result: Profile shows the flair "Start Member" and "Member since November 18, 2026".
Label: OBSERVED (screenshot)
Limits: Seen through the human's screenshot, not checked independently.
