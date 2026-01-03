# Path Hunter — Repo Agent Notes

## Project-specific commands
- Dev: `npm run dev`
- Tests: `npm test` (vitest run)
- Build: `npm run build`
- Preview: `npm run preview`

## Required checks before committing
Run:
- `npm test`
- `npm run build`

If either fails, fix before committing or explain why it cannot be fixed.

## Suggested commit scopes
Use these scopes when applicable:
- game            (core rules, state, win condition)
- generator       (seeded generation, Hamiltonian paths, waypoint placement)
- validation      (move legality, ordering rules, win checks)
- input           (pointer/touch handling, undo/truncate behavior)
- ui              (layout, App.tsx, styles, copy)
- components      (src/components/*)
- storage         (localStorage, streaks, migrations/resets)
- tests           (src/game/__tests__/*)
- build           (vite config, deps)
- pwa             (manifest, service worker if present)

If scope is unclear, use `core`.

## Key code locations
- App bootstrap / shell: `src/main.tsx`, `src/App.tsx`
- UI components: `src/components/`
- Game logic (state, rules, generator): `src/game/`
- Tests: `src/game/__tests__/`
- Styles: `src/*.css`
- Static assets / PWA: `public/`

## Repo-specific conventions
- Grid moves are orthogonal only (no diagonals).
- Numbered cells must be visited strictly in order.
- Win condition requires filling all cells exactly once.
- Generator must be deterministic for a given seed.
- If persistence schema changes, either migrate or reset explicitly and document it in commit Notes.