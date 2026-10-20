# Bebop Puzzle v1.7 — Audit Implementation Plan

Branch: `v1.7-audit-improvements` (from `main` @ 996eeab). One commit per phase; each phase is
verified in the browser preview (audio muted) before moving on. PR to `main` at the end.

Goal of the release: turn the game from a shape-fitting puzzle into a real ear-training game,
and fix every bug found in the October 2026 audit.

---

## Phase A — Correctness bugs (18)

| # | Bug | Fix |
|---|-----|-----|
| A1 | Leaving during win celebration leaves skip handler armed | `cancelCelebration()` called from `goToMap` / `startLevel` / Daily / Composer; track the 400 ms timer |
| A2 | Touch tap on placed piece shifts it half a row | Movement threshold (~8 px) before a touch becomes a drag; tap restores piece |
| A3 | No `touchcancel`, second finger hijacks drag | `touchcancel` → cancel drag & restore; ignore new touchstart while dragging |
| A4 | Craft table accepts drops mid Dupe/Flip animation | `craftBusy` flag guarding all craft entry points; track/cancel timers |
| A5 | Music volume 0 → `exponentialRampToValueAtTime(0)` RangeError | Early-return in `playNote` / clamp ramp targets |
| A6 | Shortcuts + secret code fire while typing in inputs | Ignore keys from inputs; reset secret buffer on non-digits; secret code only via `?dev` |
| A7 | Dupe button stays hidden in Daily/Composer | Reset in `showCraftTable()` |
| A8 | Tray hover preview plays the real answer for free | Preview from a neutral chord/target |
| A9 | Guided mode timers survive self-completion | Clear in `clearCompletionGuidance`, lock input while guiding |
| A10 | Keyboard players can't use craft table | Focusable drop zone; Enter places held piece |
| A11 | Re-drag during wrong-placement shake duplicates piece | Lock column during shake; guard timeout by state identity |
| A12 | Grid → craft drag loses flip state | Derive flip from label |
| A13 | Retry scaffolding never triggers | Count failed attempts (leave/restart unsolved), persist |
| A14 | `bestListens` of 0 treated as no record | `??` / `!= null` |
| A15 | Warm-up timer survives Skip | Track & clear; restore hidden elements |
| A16 | Connection flash never fires on drag | Capture column before timeout |
| A17 | Reset Progress clears wrong keys | Clear the real keys + in-memory flags |
| A18 | Sound knobs rebuild drive curve every pointer move | Rebuild only on drive change; save on drag end |

## Phase B — Copy & docs correctness (audit #2, #15)

- Neighbor directions: rename to **Upper First / Lower First** (display labels only; internal
  names kept so saved progress / library still work), fix every description table.
- Approach: description matches behaviour after Phase E (final step always a half step).
- Enclosure: fix From Below/From Above entry heights in PIECE-RULES.md and README.
- "Right piece — try a different height" → "That shape fits at another height in this column."
- Single source for tutorial copy; drop the regex rewriter's 58-char truncation.
- README hint & star sections brought up to date.

## Phase C — Load size & hosting (audit #13)

- Render piece thumbnails as inline SVG from each piece's vector `elements` instead of the
  ~240 KB of base64 PNGs; strip the PNGs from `library-data.js`.
- Delete the unused duplicate `default-library.json` (and its fetch path).
- Self-host the Rhodes samples in `samples/` (currently hot-linked from gleitz.github.io);
  keep the CDN as a fallback.

## Phase D — Mobile & accessibility (audit #14)

- Remove `user-scalable=no` / `maximum-scale`.
- On-screen text no smaller than 10 px (tray piece labels 11 px); print-kit styles unchanged.
- Non-colour cue: checked — tray cards already print the piece name and variant, and grid
  pieces differ by shape, so no extra badge was added.
- Empty band above the grid: checked — it is the grid being vertically centred; layout kept.
- `touch-action: manipulation` so pinch-zoom works without double-tap zoom.

## Phase E — Ear-training core (audit #1, #3, #4, #5, #6, #7)

- **E1 Ear-required puzzles.** Generator scores each removed column by how many tray
  pieces/directions fit geometrically. Outside each chapter's first tutorial level, at least one
  column must be "ambiguous" (≥2 tray options fit), retrying generation otherwise. Distractors
  are chosen to fit like a needed piece (Arpeggio ↔ Approach, Neighbor Upper ↔ Lower).
- **E2 Idiomatic lines.** Approach: last step into the target is always a half step, other steps
  from the chord scale. Enclosure: scale step above + chromatic half step below. Generator
  prefers chains whose column downbeats are chord tones. From Chapter 4, targets may be the 3rd
  or 7th as well as root/5th.
- **E3 Hear the harmony.** Soft comping (bass root + 3rd/7th shell) on beat 1 of each column
  during melody playback. Toggle in the Sound panel, on by default.
- **E4 Line breakdown.** Success modal gains a "Your line" strip: note names (correct
  sharp/flat spelling per key) and chord-tone role (R/3/5/7/♭9/chromatic) under each column,
  plus a slow-loop "Play it on your instrument" button.
- **E5 Hear your mistake.** Wrong placement → one targeted message, then audio "yours" vs
  "the melody" for that column. Remove the double toast.
- **E6 Hint ladder.** 1) loop that column slowly, 2) choose between pieces that fit the same way,
  3) reveal. Hint hotkey `H` asks for confirmation.

## Phase F — Progression, scoring & flow (audit #8, #9, #10, #11, #12)

- **F1 Stable levels.** Puzzles seeded from level id (retry = same puzzle); "Remix" button for a
  fresh variation. Named levels use real progression snippets (Rhythm Changes I–vi–ii–V,
  Autumn Leaves minor ii–V with m7♭5, etc.); rename the duplicate "Giant Steps".
- **F2 Difficulty curve.** Smooth Chapter 5; difficulty driven by ambiguous-column count;
  Jam Session distractors respect the tray size and are always same-fit decoys.
- **F3 Fair stars.** 3★ listen allowance scales with empty columns; remove unused `time` field.
- **F4 Daily Challenge.** Locked until Chapter 1 cleared; only uses unlocked chapters;
  rotating skill-based missions.
- **F5 Flip in the tray.** Flip button on each flippable tray card (and `F` while held);
  Craft Table kept for Dupe and the flip lesson.

## Phase G — Release

- Full playthrough sweep (desktop + mobile viewport) with console error check.
- README "What's New in v1.7", version bump, update PIECE-RULES.md.
- PR to `main`.

## Out of scope / not touched

- `wooden-piece-textures` branch (unmerged skin assets) — left as is.
- `maker.html` puzzle maker beyond what the library format change requires.
- Untracked `Listen_Sing_Play_Thesis-S1.docx` and `PIECE-RULES.md` stay out of git unless asked
  (PIECE-RULES.md edits are made in place).
