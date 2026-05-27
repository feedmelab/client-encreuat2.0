
## Goal

Redesign your word-deduction game (description → guess the word, letter slots, timer, 2 players, 5 rounds, end summary) with a polished, modern visual layer. Keep all working React logic from your repo intact — only the presentation changes.

## Visual direction

- **Palette — Warm Sand**: ivory background `#faf8f5`, soft beige cards `#f0ebe3`, sand accent `#c9b99a`, deep cocoa text/CTA `#8b7355`. Cozy, paper-like, approachable.
- **Type — Space Grotesk / DM Sans**: Space Grotesk for headings, scores, big letter slots; DM Sans for descriptions, buttons, meta. Tabular numerals for timers/scores.
- **Tone**: warm minimal, generous whitespace, gentle rounded corners (12–16px), soft shadows, subtle paper texture optional. No harsh neons. Restrained motion: letter-tile flip on reveal, timer ring countdown, smooth round transitions.

## Screens to redesign

1. **Lobby / Start** — title, solo vs 2-player toggle, player name inputs, "Start game" CTA.
2. **Round / Play screen**
   - Header: round X / 5, current player badge, score chips for P1 / P2.
   - Circular timer ring around remaining seconds.
   - Description card (the clue) — large, centered, serif-weight headline.
   - Letter slot row: one box per letter, monospace-aligned, focus highlight on active slot, on-screen + physical keyboard input, backspace, submit.
   - Subtle "waiting for other player…" state after submit.
3. **Round result** — both players' answers side by side, correct word revealed, points awarded this round, animated score update.
4. **End screen (after round 5)** — winner banner, final scores, full table of all 5 rounds (description, correct word, P1 answer, P2 answer, points), "Play again" CTA.
5. **Responsive**: mobile-first layout for the play screen (single column, large tap targets), desktop gets wider description card and side-by-side scoreboards.

## Process

1. **You paste the code** — share the key files from `feedmelab/encreuat-client`: main App / router, game state (round logic, timer, scoring), components (board/slots, keyboard, lobby, results), and any types or constants. Styles/CSS not needed.
2. **I port the logic into this Lovable project** unchanged — same state shape, same functions, same flow.
3. **I rebuild the UI layer** with the Warm Sand + Space Grotesk/DM Sans design system, wired into `src/styles.css` as semantic tokens (no hard-coded colors in components).
4. **Route structure** (TanStack Start): `/` lobby, `/play` round screen, `/results` end summary — or single-page state machine if your current code works that way; I'll match your existing flow.

## Technical notes

- Design tokens defined in `src/styles.css` as oklch CSS variables (`--background`, `--card`, `--primary`, `--accent`, `--muted-foreground`, plus a `--ring-timer` accent).
- Components built on shadcn primitives already in the project (Button, Card, Dialog, Input) re-skinned via tokens + variants — no raw `bg-white` / `text-black`.
- Animations via Tailwind + `tw-animate-css` (already installed): tile flip, score count-up, timer pulse under 10s.
- Game logic stays in plain TS modules; no backend / Lovable Cloud needed unless you want multiplayer over the network later (not in scope here).

## What I need from you next

Paste the contents of your repo's key files (App, game state/hook, round logic, components). Once I have them, I'll switch to build mode and ship the redesign.
