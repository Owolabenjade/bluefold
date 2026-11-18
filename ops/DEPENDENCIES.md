# DEPENDENCIES

Fail closed: nothing goes on the critical path until its row here is `verified` with evidence.
Status: verified | unverified | failed | dropped
Role: critical (the demo path breaks without it) | optional

| Dependency | Pinned version | Role | Verified (UTC) | Evidence | Status | Limits, keys, gotchas |
|---|---|---|---|---|---|---|
| @iwsdk/core, @iwsdk/create, @iwsdk/vite-plugin-dev (Immersive Web SDK) | 1.1.0 (published 2026-11-14) | critical | 2026-11-18T00:00Z | E-001 | verified | Released 4 days before the deadline; the deploy guide was verified against v0.5.3. Pin 1.1.0, no upgrades. Import Three only from @iwsdk/core. |
| IWER emulator (metaQuest3 device, sunlit_living_room synthetic environment) | iwer 2.8.0 via the vite plugin | critical (testing and video, no headset) | | | unverified | Finger-level poses are not emulated; pinch and grab are. Verify hand pinch and plane detection in the tracer bullet. |
| WebXR hand tracking and plane detection in the Quest Browser | Quest 3/3S browser | critical | | | unverified | Cannot be verified on device (no headset). DERIVED from IWSDK docs only. Fallback table and wall when no planes arrive. |
| GitHub Pages via GitHub Actions | actions/deploy-pages@v4 | critical (judge access) | | | unverified | Repo github.com/Owolabenjade/bluefold must be created by the human; Pages source = GitHub Actions. vite `base` is './' (relative), so the /bluefold/ subpath works. |
| Node.js | v22.20.0 local | critical (build) | 2026-11-18T00:00Z | E-001 | verified | Engines allow >=22.12 <23. |
| @meta-quest/metavr (scaffold dev dependency) | ^1.8.1 | optional | | | unverified | Collects usage data per its license; not used on the demo path. |
