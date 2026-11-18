# SUBMISSION (Devpost draft)

Form: https://start-developer-competition-26.devpost.com/ → Enter a Submission. Deadline 2026-11-18 12:00 PM PST (20:00 UTC, 21:00 WAT). Our Submitted gate: 18:00 UTC.
Every factual line here has a row in ops/CLAIMS.md.

## Submission name
Bluefold

## Tagline (max 140 characters)
Fold, tie and dip cloth with bare hands, then unfold the indigo pattern you made. A daily resist-dye puzzle on your real table.

## Track / Division
Gaming / New Experience

## Links
- Project (IWSDK / WebXR, hosted): https://owolabenjade.github.io/bluefold/
- Code: https://github.com/Owolabenjade/bluefold
- Video (YouTube, public): VIDEO_LINK

## Description (under 500 words)

**Inspiration**
Resist-dyeing has one of the best reveals in any craft. You fold a plain cloth, tie or clamp it, dip it in indigo, and only when you open it do you see what your hands made. Yoruba *adire oniko* (cloth tied with raffia) and Japanese *itajime shibori* (cloth folded and clamped between blocks) both work this way. That reveal felt made for hands in mixed reality: a puzzle you can only solve with your hands, on the table in front of you, in a few minutes.

**What it does**
Bluefold finds your table with plane detection and lays a white cloth on it, with a small indigo vat beside it. Today's target cloth hangs above. You pinch an edge and fold the cloth (it follows your hand around the crease), pinch the bundle to tie it with raffia, or press a wooden clamp onto it. You carry it by its loop to the vat, let go, and it comes out yellow-green and turns blue in the air, as real indigo does. Then you pull a corner to unfold it: one tie on a twice-folded cloth becomes four mirrored sunbursts. Your cloth is scored against today's target and joins a gallery around it, with a daily streak. A new target arrives every day, the same for everyone.

**How we built it**
Bluefold is built with Meta's Immersive Web SDK (IWSDK 1.1.0) on WebXR and Three.js, as a mixed reality session. Hands drive everything: IWSDK near-grab for the fold tabs, the clamp, the lift loop and the unfold tab, and ray pointer events for tying. Plane detection with semantic labels places the workspace on a real table, with a virtual table as a fallback. A fold is a line on the cloth: the CPU folds a mesh whose edges run along every crease, while a GPU shader maps every point of the flat cloth through the same folds and applies each tie or clamp at the fold stage when it was made, so the pattern on the unfolded cloth is exactly what the folds produced. The score compares 64×64 dye maps. All sound is synthesised with Web Audio; there are no third-party assets. We tested every step in the Immersive Web Emulator (Quest 3 profile) with scripted hand input, and the video is recorded there.

**Challenges**
Making the fold feel physical without a cloth simulation (rigid flaps that follow the hand), and keeping the pattern correct when ties are made between folds.

**What's next**
Testing and tuning on Quest 3 and 3S (we built without a headset), more techniques (accordion pleats, stitching, multiple dye colours), and shareable cloth recipes so friends can challenge each other.

**Target launch date:** TARGET_LAUNCH (human to confirm), as a Progressive Web App on the Meta Horizon Store.

## How hand interactions are implemented (optional field)
Bluefold is hands-only from the first frame: there is no controller path to fall back on. A pinch near a glowing tab grabs it (IWSDK OneHandGrabbable with pinch-to-grab), and while you hold it the flap's angle comes from where your hand is relative to the crease, so the cloth follows your hand. Ties use the hand's ray and a pinch, so you can tie anywhere on the bundle without reaching over it. The lift loop and the clamp block are near-grabbed and dropped. Every interaction is one-handed and stays within arm's reach of a seated player. When you hesitate, a short trail of dots traces the next gesture instead of showing text.

## Team
Solo: Owolabenjade (design, code, video).

## Disclosures
- New Experience: started 2026-11-17 from the `@iwsdk/create` starter; no earlier code.
- Not yet tested on a physical headset (stated in the README and the video).
