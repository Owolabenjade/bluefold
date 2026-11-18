## Inspiration

Resist-dyeing has one of the best reveals in any craft: you fold, tie or clamp a plain cloth, dip it in indigo, and only when you open it do you see what your hands made. Yoruba *adire oniko* (tied with raffia) and Japanese *itajime shibori* (folded and clamped) both work this way. That reveal felt made for hands in mixed reality: a puzzle solved with your hands, on the table in front of you.

## What it does

Bluefold finds your table with plane detection and lays a white cloth on it beside an indigo vat, with today's target cloth above. You pinch an edge to fold the cloth, pinch the bundle to tie it with raffia, or press a wooden clamp onto it. You carry it to the vat and let go: it comes out yellow-green and turns blue in the air, as real indigo does. Pull a corner to unfold it, and one tie on a twice-folded cloth becomes four mirrored sunbursts. Your cloth is scored against today's target (the same for everyone) and joins a gallery, with a daily streak.

## How we built it

Bluefold is built with Meta's Immersive Web SDK (IWSDK 1.1.0) on WebXR and Three.js, as a mixed reality session. Hands drive everything: IWSDK pinch-to-grab for the tabs, clamp and lift loop, and ray pointer events for tying. Plane detection with semantic labels places the workspace on a real table, with a virtual table as a fallback. A fold is a line on the cloth: the CPU folds a mesh whose edges run along every crease, while a GPU shader maps every point of the flat cloth through the same folds and applies each tie or clamp at the fold stage when it was made. The score compares 64×64 dye maps. All sound is synthesised with Web Audio, with no third-party assets.

## Challenges we ran into

- Making a fold feel physical without a cloth simulation: rigid flaps that follow your hand around the crease.
- Keeping the pattern correct when ties are made between folds.
- Building with no headset: every interaction was tested in the Immersive Web Emulator (Quest 3 profile) with scripted hands, and the video is recorded there.

## Accomplishments that we're proud of

- The pattern is exact: what you unfold is precisely what your folds, ties and clamps produce.
- Hands only from the first frame, with no text tutorial: a short trail of dots shows the next gesture when you hesitate.
- A full loop (fold, tie, dip, unfold, score, gallery) that fits in about two minutes, seated.

## What we learned

Hand tracking rewards generous targets, and motion teaches better than text. A shared daily target turns a craft toy into a puzzle worth returning to.

## What's next for Bluefold

- Test and tune on Quest 3 and 3S hardware (not yet tested on a headset).
- More techniques (pleats, stitching, more colours) and shareable cloth recipes.

**Target launch:** March 2027, on the Meta Horizon Store as a web app.
