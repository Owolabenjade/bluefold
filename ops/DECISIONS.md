# DECISIONS

Append only. To change a decision, add a new entry that supersedes it and mark the old one `superseded by D-00N`.

## D-001: Adopt the Foundation operating files
Date (UTC): 2026-11-18T00:01Z
Status: accepted
Context: The build is timeboxed and agents lose context between sessions.
Decision: The repository carries current truth in ops/, and every session follows the protocol in AGENTS.md.
Alternatives: Rely on chat history, or keep one notes file.
Consequences: Each session spends about 15 minutes on boot and handoff. Any agent can continue from the files.

## D-002: Build Bluefold (indigo resist-dye) with IWSDK, Gaming / New Experience
Date (UTC): 2026-11-18T00:00Z
Status: accepted (the human picked it at Gate A and locked the name at Gate B)
Context: 20 hours to the deadline, solo, no Quest headset, not yet a Start member. The saturation scan (E-002) found the first pick, a palm-mirror light puzzle, already built by another entrant under the same name.
Decision: Bluefold, a seated hands-only indigo resist-dye puzzle in mixed reality, built with IWSDK 1.1.0 and hosted on GitHub Pages. Gaming track, New Experience division.
Alternatives: Palm-mirror light puzzle (killed: 3 close matches including the same name), hand-shadow puzzle (killed: needs a headset; 4 matches), puzzle box (3.10), sound garden (2.95, crowded), origami (killed: foldlings), ceiling stars (killed: north-by-night). Unity or Unreal APK (killed: install and release-channel setup do not fit 20 hours).
Consequences: Testing and the video use the Immersive Web Emulator; public copy says it was not tested on a headset unless that changes. Cultural framing stays modest: "inspired by" adire oniko (Yoruba, tied) and itajime shibori (Japanese, folded and clamped).
