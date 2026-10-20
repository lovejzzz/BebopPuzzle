# Bebop Puzzle

A jazz music theory game that teaches bebop vocabulary through tactile puzzle-solving. Drag melodic pattern pieces onto a grid, connect them, and hear your bebop line come alive.

**[Play it now](https://lovejzzz.github.io/BebopPuzzle/)** — runs entirely in the browser, no install needed.

---

## What's New in v1.7

### Ear Training First
- **Puzzles now need your ears.** Every generated level has at least one spot where several pieces fit by shape, so only listening tells you which one belongs (bigger levels have two). Same-shape decoys (an Approach when you need an Arpeggio, and vice versa) join the tray.
- **Hear the harmony.** Soft shell-voiced chords play under the melody (root, 7th, 3rd). Switch them off in the Sound panel.
- **Hear your mistake.** A wrong placement plays your piece, then the melody's notes for that spot, so you can compare.
- **Your line.** The success screen spells out every note with its role over the chord (R, 3, 5, 7, 9, chromatic…), plus slow playback to try on your instrument.
- **New hint ladder.** 1) loop the spot slowly, 2) choose between the pieces that fit the same way, 3) reveal. Pressing H asks for confirmation.

### Better Bebop Lines
- Approaches walk through the chord's scale and slide in by a half step; Neighbors use the upper scale tone and the lower half step; Enclosures pair a scale tone above with a half step below.
- Column downbeats favour chord tones; from Chapter 4 the line can resolve to the 3rd or 7th.
- Levels named after tunes use real snippets of their changes (Giant Steps, Autumn Leaves, Rhythm Changes, Donna Lee, Cherokee, Countdown…).
- Neighbor directions renamed **Upper First / Lower First** (the old names described the opposite of what played).

### Progression & Scoring
- Each level is a stable puzzle: Retry replays it, **Remix** deals a fresh one.
- The 3-star listen allowance scales with the number of empty columns.
- Chapter 5's opening is smoother; Jam Session decoys always fit like a real piece.
- Daily Challenge unlocks with Chapter 2 and only uses chapters you have reached; daily missions rotate.
- Flippable tray cards have their own ⇄ button (after the Chapter 1 flip lesson).

### Fixes & Performance
- 18 bugs fixed (celebration skip, touch taps moving pieces, craft-table races, muted-volume crash, shortcuts while typing, and more).
- Piece art is drawn as SVG (library: 252 KB → 8 KB); Rhodes samples are self-hosted (17 files instead of 37 hot-linked).
- Pinch-zoom allowed; no on-screen text below 10px.

## What's New in v1.6

### Gameplay & Audio
- Empty-column previews now count as listens, closing a shortcut around Jam Session limits and star scoring
- Zero-hint levels honor their intended budgets, and limited-listen levels no longer spend a listen during intro playback
- Generated melodies stay within the Rhodes sampler's playable register and sound the same each time a puzzle loads
- Puzzle generation now respects each level's Flip and Duplicate capabilities so every tray is solvable

### Reliability & Feedback
- Fixed the Jam Session intro breaking later piece introductions
- Fixed Composer Mode map crashes and transition wipes that could leave the game behind a black screen
- Rejected drops now explain whether the piece, direction, or height is wrong
- Tutorial prompts, star info, titles, and completion stats now clean up and display correctly

### Responsive & Accessibility
- Landscape phone layouts now keep every grid row reachable, with scrollable short-viewport panels
- Added keyboard piece placement with clear focus states and screen-reader announcements
- Added accessible labels and alt text to piece images and icon-only controls
- Improved tooltip placement around the Tempo panel and other floating UI

## What's New in v1.5

### Boardgame Kit
- **Landscape single-page print** — board and pieces sized as large as possible on a US letter page
- **Cut pieces match the grid** — cards are sized to fit the board cells exactly
- **Minimalist board** — clean light background with thin gray cell outlines
- **Grid range** — choose 2 to 6 chord columns; target column always included
- **No clutter** — printed rules and labels removed for a ready-to-cut sheet

## What's New in v1.45

### Boardgame Kit
- **Printable offline mode** — print an empty grid, cut-out pieces, and rules from the main menu
- **Table options** — choose grid length, starter/full piece set, and per-piece copies before printing

### Goals & Missions
- **Daily Missions** — unlock from Chapter 2 with progress and completion badges on the chapter page
- **Mission complete badge** — fulfilled missions now show a compact badge at the top of the screen
- **Next goals** — chapter pages show the next best goal so players always have a clear target

### Solve Feedback
- **Minimal Complete screen** — success feedback is now cleaner, faster, and less crowded
- **Richer resolution juice** — solved melodies get stronger visual and audio resolution feedback
- **Updated star copy** — star criteria now matches listen-based scoring
- **Chapter hierarchy** — chapter pages now read from identity to focus goal, missions, and levels without repeated progress text

### Performance & Polish
- Drag snap checks are throttled and cached to reduce jank during mouse and touch dragging
- Auto-play, tutorial, and screen-transition timers now clean up more reliably
- Melody playback uses lighter playhead DOM updates

---

## How to Play

Each puzzle gives you a chord progression and a target note. Your job is to fill in the missing columns by dragging pieces from the tray into the grid so every piece connects to the next.

### The Grid

The grid has one column per chord, plus a target column on the right. Some columns are pre-filled; the empty ones are yours to solve. When every piece is placed and the chain connects, the puzzle is solved — hit play to hear your bebop line.

### Pieces

Each piece is a 4-note melodic pattern (an arpeggio, neighbor tone, approach, or enclosure). Every piece has an **entry point** on the left and an **exit point** on the right. You win by placing pieces so each exit flows into the next entry.

Think of it like connecting pipes — the heights have to line up.

### Snap Positions

Pieces can sit at several vertical positions in each column (0, 0.5, 1.0, 1.5, 2.0). Dragging a piece over a column shows a preview of where it will snap. If the connection math works, it locks in.

Shapes alone do not decide every spot: an Arpeggio and an Approach have the same shape, and so do the two Neighbor directions. That is where your ears come in.

### The Craft Table

The craft table sits to the right of the tray. Drag any piece from the tray onto it to:

- **Flip** — mirror the piece horizontally (e.g. Ascending becomes Descending). After the Chapter 1 flip lesson, tray cards also have their own ⇄ flip button (or press F while holding a piece with the keyboard)
- **Duplicate** — make a copy so you can use the same piece type twice

You can also drag the result piece directly from the craft table onto the grid.

### Hints

Each level gives you a limited number of hints:

- **1st hint** — loops one empty spot slowly so you can hear its shape
- **2nd hint** — shows the height and lets you choose between the pieces that fit there the same way
- **3rd hint** — places the right piece

The tempo slider is always available to slow the melody down.

### Stars

Earn 1-3 stars per level based on listen count, hint usage, and mistakes. Stars unlock new chapters.

- 3 stars: no hints, no mistakes, and at most (empty columns + 1) listens
- 2 stars: at most (empty columns + 3) listens, and at most 1 hint or mistake
- 1 star: completed

---

## Chapters

The game has 6 chapters with 80 levels total. Each chapter introduces a new piece type or challenge:

**Chapter 1 — Arpeggios**
Start with ascending and descending arpeggios. Learn the grid, snapping, and connection rules.

**Chapter 2 — Neighbors**
Unlock neighbor tones (upper and lower). These stay close to the target — great for smooth lines.

**Chapter 3 — Approaches**
Unlock approach patterns: walk through the scale and slide into the target by a half step, from above or below — a bebop classic.

**Chapter 4 — Enclosures**
Unlock enclosures that surround the target from both sides. The bebop secret weapon.

**Chapter 5 — All Mixed**
All four piece types in play. True improvisation territory.

**Chapter 6 — Jam Session**
The ultimate challenge. Extra distractor pieces in the tray and a limited number of listens (12 down to 1). You need sharp ears and fast thinking.

---

## Composer Mode

Unlock Composer Mode by completing Chapters 1-3. This is your free-play sandbox:

- **Empty canvas** — start with a blank grid and all 4 piece types
- **Editable chords** — type any chord symbol (Dm7, G7alt, Cmaj7, etc.) directly into the chord row
- **Randomize** — generate a fresh chord progression with one tap
- **Adjustable length** — 2 to 8 chords
- **No rules** — place pieces anywhere, flip and duplicate freely
- **Playback** — hear your composed bebop line through the Rhodes EP

---

## Sound Design

Open the sound panel (EQ) during any puzzle to customize the Rhodes EP tone:

- **Tone / Drive / Reverb** — shape your sound with rotary knobs
- **Tremolo** — adjust depth and speed
- **Swing** — vintage gauge from 50% (straight) to 75% (hard shuffle)
- **Presets** — Clean, Warm, Driven, Dreamy, Classic
- **Chords under melody** — toggle the soft comping that plays the harmony

All settings persist across sessions.

---

## Piece Reference

| Piece | Variant | Entry | Exit | What it sounds like |
|-------|---------|-------|------|---------------------|
| Arpeggio | Ascending | 1.0 | 0.0 | Chord tones going up |
| Arpeggio | Descending | 0.0 | 1.0 | Chord tones going down |
| Neighbor | Upper First | 0.5 | 0.5 | Steps up from the note, returns, then steps below |
| Neighbor | Lower First | 0.5 | 0.5 | Steps below the note, returns, then steps above |
| Approach | Ascending | 1.0 | 0.0 | Walks up by step, half step into the target |
| Approach | Descending | 0.0 | 1.0 | Walks down by step, half step into the target |
| Enclosure | From Below | 1.0 | 0.5 | Starts below target, leaps above, resolves |
| Enclosure | From Above | 0.0 | 0.5 | Starts above target, dips below, resolves |

**Connection rule:** pieces connect when `posA + exitA = posB + entryB`

---

## Randomized Puzzles

Every non-tutorial level generates a fresh puzzle each time you play. The generator respects each level's difficulty constraints — chain length, number of missing pieces, available piece types — while randomizing the actual piece choices, positions, and chords. No two playthroughs are the same.

---

## Running Locally

```
git clone https://github.com/lovejzzz/BebopPuzzle.git
cd BebopPuzzle
open index.html
```

Single-file game. No build step, no dependencies, no server. Just open `index.html` in any modern browser.

## Dev Tools

- `maker.html` — visual piece editor for creating and modifying puzzle piece shapes
- `library-data.js` — piece visual data (thumbnails, drawing paths, interval patterns)

---

Vanilla HTML/CSS/JS. Made by Tian Xing.
