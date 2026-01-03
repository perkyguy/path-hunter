# Path Hunter

A mobile-first path-connecting puzzle game inspired by the general idea of "zip" games. Draw one continuous trail that visits numbered waypoints in order and fills the entire grid.

## Rules
- Start at 1 and visit every numbered waypoint in order.
- The trail must be orthogonal (no diagonals) and cannot revisit a cell.
- Every cell must be filled exactly once.
- Puzzle solved when the path covers the full grid and reaches the final number.

## Getting Started

```bash
npm install
npm run dev
```

## Tests

```bash
npm run test
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel/Netlify)
- Build command: `npm run build`
- Output directory: `dist`

## PWA
The app ships with a manifest and a simple service worker cache in `public/`. On iOS, use Safari's “Add to Home Screen” to install.
