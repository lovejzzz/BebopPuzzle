# Bebop Puzzle

A jazz music theory game that teaches bebop vocabulary through tactile puzzle-solving. Drag melodic pattern pieces onto a grid, connect them, and hear your bebop line come alive.

**[Play it now](https://lovejzzz.github.io/BebopPuzzle/)** — runs entirely in the browser, no install needed.

---

## How to Play

Each puzzle gives you a chord progression and a target note. Your job is to fill in the missing columns by dragging pieces from the tray into the grid so every piece connects to the next.

### The Grid

The grid has one column per chord, plus a target column on the right. Some columns are pre-filled; the empty ones are yours to solve. When every piece is placed and the chain connects, the puzzle is solved — hit play to hear your bebop line.

### Pieces

Each piece is a 4-note melodic pattern (an arpeggio, neighbor tone, approach, or enclosure). Every piece has an **entry point** on the left and an **exit point** on the right. You win by placing pieces so each exit flows into the next entry.

Think of it like connecting pipes — the heights have to line up.

### Snap Positions

Pieces can sit at 4 vertical positions in each column (0, 0.5, 1.0, 1.5). Dragging a piece over a column shows a preview of where it will snap. If the connection math works, it locks in.

### The Craft Table

The craft table sits to the right of the tray. Drag any piece from the tray onto it to:

- **Flip** — mirror the piece horizontally (e.g. Ascending becomes Descending)
- **Duplicate** — make a copy so you can use the same piece type twice

You can also drag the result piece directly from the craft table onto the grid.

### Hints

Each level gives you a limited number of hints:

- **1st hint** — a tempo slider that lets you slow down the melody playback (60–90 BPM) so you can hear the target line more clearly
- **2nd hint** — highlights which column needs a piece and what position it should be at

### Stars

Earn 1–3 stars per level based on speed, hint usage, and wrong placements. Stars unlock new chapters.

---

## Chapters

The game has 6 chapters with 80 levels total. Each chapter introduces a new piece type or challenge:

**Chapter 1 — Arpeggios**
Start with ascending and descending arpeggios. Learn the grid, snapping, and connection rules.

**Chapter 2 — Neighbors**
Unlock neighbor tones (upper and lower). These stay close to the target — great for smooth lines.

**Chapter 3 — Approaches**
Unlock chromatic approach patterns. Walk into the target note from above or below — a bebop classic.

**Chapter 4 — Enclosures**
Unlock enclosures that surround the target from both sides. The bebop secret weapon.

**Chapter 5 — All Mixed**
All four piece types in play. True improvisation territory.

**Chapter 6 — Jam Session**
The ultimate challenge. Extra distractor pieces in the tray and a limited number of listens (12 down to 1). You need sharp ears and fast thinking.

---

## Composer Mode

Unlock Composer Mode by completing all 6 chapters. This is your free-play sandbox:

- **Empty canvas** — start with a blank grid and all 4 piece types
- **Editable chords** — type any chord symbol (Dm7, G7alt, Cmaj7, etc.) directly into the chord row
- **Randomize** — generate a fresh chord progression with one tap
- **Adjustable length** — 2 to 8 chords
- **No rules** — place pieces anywhere, flip and duplicate freely
- **Playback** — hear your composed bebop line through the Rhodes EP

---

## Sound Design

Open the sound panel (🎛️) during any puzzle to customize the Rhodes EP tone:

- **Tone / Drive / Reverb** — shape your sound with rotary knobs
- **Tremolo** — adjust depth and speed
- **Swing** — vintage gauge from 50% (straight) to 75% (hard shuffle)
- **Presets** — Clean, Warm, Driven, Dreamy, Classic

All settings persist across sessions.

---

## Piece Reference

| Piece | Variant | Entry | Exit | What it sounds like |
|-------|---------|-------|------|---------------------|
| Arpeggio | Ascending | 1.0 | 0.0 | Chord tones going up |
| Arpeggio | Descending | 0.0 | 1.0 | Chord tones going down |
| Neighbor | From Above | 0.5 | 0.5 | Steps down to target, returns |
| Neighbor | From Below | 0.5 | 0.5 | Steps up to target, returns |
| Approach | Ascending | 1.0 | 0.0 | Chromatic walk up to target |
| Approach | Descending | 0.0 | 1.0 | Chromatic walk down to target |
| Enclosure | From Above | 0.0 | 0.5 | Surrounds target, starts above |
| Enclosure | From Below | 1.0 | 0.5 | Surrounds target, starts below |

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
- `playground.html` — sandbox for testing piece connections

---

Vanilla HTML/CSS/JS. Made by Tian Xing.
