# Family Tree 3D

A touch-first 3D family tree for wall-mounted screens. It is the successor to the 2D app in `../frontend` and `../backend`; the full plan is in [`../docs/3d-family-tree-plan.md`](../docs/3d-family-tree-plan.md).

Stack: Vite + TypeScript + Three.js. No backend is needed to try it.

## Run it

```bash
cd tree3d
npm install
npm run dev        # http://localhost:5173 (also reachable from a tablet on the same Wi-Fi)
npm test           # layout and data adapter tests
npm run build      # static build in dist/
```

## Using it

| Gesture | Action |
|---|---|
| One-finger drag | Rotate the tree |
| Pinch / spread (or mouse wheel) | Zoom |
| Two-finger drag (or right-drag) | Pan |
| Tap a person | Open their biography and highlight their close family |
| Double-tap a person, or tap a relative in the panel | Fly to them |
| ⌂ button | Back to the whole tree |
| No touch for 60 seconds | Reset and slowly rotate |

## Data

By default the bundled fictional family in `src/data/sample-family.json` is shown. To show other data, pass a URL:

```
http://localhost:5173/?data=/my-family.json
```

The file can be either a tree snapshot (see `src/data/types.ts`) or the array returned by the old backend's `GET /api/persons/all`, which is converted by `src/data/legacy.ts`. Put files in `public/` to serve them from the dev server.

## Code map

| File | What it does |
|---|---|
| `src/data/types.ts` | Snapshot types and relationship index |
| `src/data/legacy.ts` | Converts the old backend's person list |
| `src/layout.ts` | Generations, sibling and couple placement, wrapping onto a cylinder |
| `src/scene.ts` | Three.js scene, touch controls, tap/double-tap picking, camera fly-to |
| `src/labels.ts` | Name cards drawn on canvas textures |
| `src/ui/bioPanel.ts` | Biography side panel |
| `src/main.ts` | Wiring, data loading, idle mode |

## Kiosk quick start

On a Raspberry Pi or mini-PC with a touch monitor, serve `dist/` and launch Chromium fullscreen:

```bash
chromium --kiosk --noerrdialogs --disable-pinch --overscroll-history-navigation=0 http://localhost:4173
```

Provisioning, offline caching and sync between homes are covered in phases 1 and 2 of the plan.
