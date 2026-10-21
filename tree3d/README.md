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
| Tap a person | Open their biography (with a globe showing where they live) and light up their branches |
| Double-tap a person, or tap a relative in the panel | Fly to them |
| ⌂ button | Back to the whole tree |
| No touch for 60 seconds | Reset and slowly rotate |

## Data

By default the bundled fictional family in `src/data/sample-family.json` is shown. To show other data, pass a URL:

```
http://localhost:5173/?data=/my-family.json
```

Screens re-check that file every 5 minutes and reload with the new tree when nobody is touching them, so every home stays in sync. The file can be a tree snapshot or the array returned by the old backend's `GET /api/persons/all` (converted by `src/data/legacy.ts`). Put files in `public/` to serve them from the dev server.

A snapshot looks like this (see `src/data/types.ts` for every field):

```json
{
  "version": 1,
  "people": [
    { "id": "dad", "displayName": "Peter Hale", "gender": "M", "birth": { "date": "1955" },
      "residence": { "city": "Berlin", "country": "Germany", "lat": 52.52, "lng": 13.40 },
      "biography": "Architect.", "achievements": ["Designed the Riverside School"] },
    { "id": "mum1", "displayName": "Helen Brandt", "gender": "F" },
    { "id": "mum2", "displayName": "Anna Hale", "gender": "F" },
    { "id": "kid", "displayName": "Max Hale" }
  ],
  "parentLinks": [{ "parentId": "dad", "childId": "kid" }, { "parentId": "mum1", "childId": "kid" }],
  "partnerships": [
    { "aId": "dad", "bId": "mum1", "status": "former", "start": "1980", "end": "1992" },
    { "aId": "dad", "bId": "mum2", "start": "1994" }
  ]
}
```

`country` must match the country names in Natural Earth (for example "United States of America") to be highlighted on the globe.

## Language

Interface text lives in `src/i18n.ts`. English is the default; `?lang=az` switches to the draft Azerbaijani translation.

## Code map

| File | What it does |
|---|---|
| `src/data/types.ts` | Snapshot types and relationship index |
| `src/data/legacy.ts` | Converts the old backend's person list |
| `src/layout.ts` | Generations, couples and multiple marriages, sibling placement, the widening crown |
| `src/treeModel.ts` | Trunk, roots, branches, marriage sticks and leaves |
| `src/scene.ts` | Three.js scene, touch controls, tap/double-tap picking, highlighting, camera fly-to |
| `src/ui/globe.ts` | Globe with a pulsing pin, map drawn from Natural Earth data (`world-atlas`) |
| `src/i18n.ts` | Interface text in English and Azerbaijani |
| `src/labels.ts` | Name cards drawn on canvas textures |
| `src/ui/bioPanel.ts` | Biography side panel |
| `src/main.ts` | Wiring, data loading and refresh, idle mode |

## Kiosk quick start

On a Raspberry Pi or mini-PC with a touch monitor, serve `dist/` and launch Chromium fullscreen:

```bash
chromium --kiosk --noerrdialogs --disable-pinch --overscroll-history-navigation=0 http://localhost:4173
```

Provisioning, offline caching and sync between homes are covered in phases 1 and 2 of the plan.
