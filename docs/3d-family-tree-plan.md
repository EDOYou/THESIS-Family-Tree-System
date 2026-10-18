# 3D Family Tree: Plan

A new, touch-first 3D family tree that runs on a wall-mounted screen in each relative's home. People can spin the tree, pinch into a branch, tap a relative to read their biography, and leave the screen idling as a slowly rotating "living portrait" of the family.

This document covers what the current system does, what the new one should be, and how to get there in phases.

---

## 1. What exists today

The current project (`backend/` + `frontend/family-tree/`) is a thesis-era web app for the family:

| Area | Today |
|---|---|
| Backend | Spring Boot (Java), PostgreSQL, JWT auth, WebSocket/STOMP chat |
| Frontend | React 18 (CRA + rewired), `family-chart` (D3-based 2D tree), Formik forms |
| Roles | `ADMIN` edits the tree, `USER` views it |
| Features | 2D tree, add/edit relatives, memory box (avatar), notable records, family events and memorials, family quiz, real-time chat |

**Data model (the part worth keeping):**

- `Person`: `id` (string), `name`, `gender` (M/F), `occupation`, `age`, `birthDate`, `deathDate`, `birthPlace`, `deathPlace`, `fatherId`, `motherId`, `spouses[]`, `children[]`, `memoryBox`.
- `MemoryBox`: currently only an `avatar` (image URL or data URI).
- `NotableRecord`: titled, typed, dated story attached to a person (the closest thing to a biography today).
- `FamilyEvent`: dated event per person, optionally a memorial, with a reminder date.
- `User`, `Message`, `Quiz`: accounts, chat, quiz questions.

**Gaps relative to the new goal:**

- No real biography field; stories are scattered across notable records.
- Dates are free-text strings; `age` is stored rather than derived.
- Relationships are stored redundantly (both `children[]` and `fatherId/motherId`), which can drift out of sync.
- Single gender enum, single pair of parents: no room for adoption, step-parents, or divorce/remarriage dates.
- Everything requires login; there is no read-only "display device" concept and no offline mode.

## 2. What we are building

**Product goals**

1. A 3D tree that is beautiful at rest and obvious to use with one finger, for every age from kids to grandparents.
2. Tap a person → biography card (photo, dates, places, story, photo gallery, notable records).
3. Pinch/spread to zoom into a branch; drag to rotate; double-tap to fly to a person; "Home" button to reset.
4. Works on a cheap, always-on wall screen in many homes, including when the home internet is down.
5. A small number of family editors keep the tree up to date from a phone or laptop; changes appear on every wall screen within minutes.
6. Private: the tree is only visible to the family.

**Non-goals for v1:** chat, quiz, and event reminders. They stay in the old app (or come back later as modules), so the new app can focus on the tree.

## 3. Architecture

```
            ┌───────────────────────────┐
            │  Family server (cloud)    │
            │  - API + auth             │
            │  - PostgreSQL             │
            │  - photo storage (S3-ish) │
            │  - publishes tree snapshot│
            └──────────┬────────────────┘
       HTTPS (pull)    │        HTTPS (edit)
     ┌─────────────────┼────────────────────┐
     │                 │                    │
┌────▼─────┐     ┌─────▼────┐         ┌─────▼─────┐
│ Wall      │     │ Wall     │   ...   │ Editor    │
│ screen A  │     │ screen B │         │ (phone /  │
│ kiosk app │     │ kiosk app│         │  laptop)  │
│ + offline │     │ + offline│         │ web app   │
│   cache   │     │   cache  │         └───────────┘
└───────────┘     └──────────┘
```

Three pieces:

1. **Viewer (kiosk app):** a static web app (Vite + TypeScript + Three.js) that renders the 3D tree. Runs fullscreen in Chromium kiosk mode on the wall screen. Also works in any browser, so relatives can open it on a phone too.
2. **Server:** owns the data. Phase 1 reuses the existing Spring Boot backend (`GET /api/persons/all`) through an adapter; later it gains a read-only "snapshot" endpoint, device tokens, biographies and media.
3. **Editor:** where admins add people, write biographies, and upload photos. Initially the old React app keeps this role; later an editor mode is added to the new app (touch-friendly forms on a phone).

### Why a web app for the wall screen

- One codebase runs on the wall, on phones, and on laptops.
- Kiosk deployment is a solved problem (Chromium `--kiosk`), and updates are just a new static build.
- Three.js gives smooth 3D on modest hardware (WebGL2), with mature touch controls.
- Alternatives considered: Unity/Godot (great 3D, but heavier deploys and per-platform builds), native Android app (good for tablets, worse for DIY screens), React Three Fiber (nice, but adds React for little gain in a single-scene app; can be adopted later if the UI grows).

## 4. Tech stack

| Concern | Choice |
|---|---|
| Language | TypeScript |
| Build/dev server | Vite |
| 3D | Three.js (WebGL2), `OrbitControls` for rotate/pinch/pan |
| Labels & cards | Canvas-texture sprites in 3D; HTML overlay for the biography panel |
| Tests | Vitest for layout and data adapters |
| Offline | Service worker + IndexedDB cache of the last tree snapshot and photos (PWA) |
| Server (phase 1) | Existing Spring Boot + PostgreSQL |
| Server (phase 2+) | Same backend, extended: snapshot endpoint, device tokens, media storage |
| Kiosk OS | Raspberry Pi OS (Pi 5) or any small x86 mini-PC with Ubuntu, Chromium in kiosk mode |

## 5. 3D layout and interaction

**Layout (prototype does this):**

- Generations become horizontal levels: ancestors at the top, descendants below, so the tree reads like a classic chart from the front.
- Each generation is wrapped around a vertical cylinder, so rotating the tree reveals other branches instead of showing the back side of a flat chart. Couples sit side by side; children sit under their parents.
- Parent–child links are curved lines; spouses are joined by a short bar.

**Later layout ideas:** a literal trunk-and-branches tree model, a spiral timeline (time as height), and "focus mode" where the tapped person moves to the center with their immediate family arranged around them.

**Touch gestures:**

| Gesture | Action |
|---|---|
| One-finger drag | Rotate |
| Pinch / spread | Zoom out / in |
| Two-finger drag | Pan |
| Tap a person | Open biography panel |
| Double-tap a person | Fly the camera to them |
| Home button | Reset view |
| No touch for 60 s | Close panel, reset view, slow auto-rotate ("attract mode") |

**Performance budget:** 60 fps for ~500 people on a Pi 5 class device. Use instanced meshes and level-of-detail labels (hide names when far away) once the family grows beyond a few hundred.

## 6. Data model (new)

Normalized, so relationships cannot drift:

```ts
Person {
  id, givenName, familyName, displayName,
  gender?, birth: { date?, place? }, death?: { date?, place? },
  occupation?, biography? (markdown), photoUrl?, gallery?: MediaRef[],
  visibility: 'family' | 'editors'      // see privacy
}
ParentLink  { parentId, childId, kind: 'biological' | 'adoptive' | 'step' }
Partnership { aId, bId, kind: 'married' | 'partner', start?, end? }
Story       { id, personId, title, date?, body }   // from NotableRecord
```

Dates are ISO strings with optional precision (`1950`, `1950-06`, `1950-06-14`), because old records are often only a year. Age is derived, never stored.

The viewer consumes a single **tree snapshot** JSON (`{ version, generatedAt, people, parentLinks, partnerships }`), which is easy to cache and diff.

## 7. Migrating from the old system

1. **Adapter first (prototype has this):** `tree3d/src/data/legacy.ts` converts the old `/api/persons/all` response into the new snapshot in the browser. No server changes needed to start.
2. **Export script:** a one-off script reads the old PostgreSQL tables (`persons`, `memory_boxes`, `notable_records`, `family_events`) and writes a snapshot JSON plus a folder of photos (avatars stored as data URIs are extracted to files).
3. **Cleanup pass:** the script reports problems: children listed on a parent but missing `fatherId/motherId`, spouses not listed on both sides, unparseable dates. An admin fixes them once.
4. **Biographies:** notable records become `Story` entries; admins can promote one into the person's main biography.
5. **Switch-over:** once the new server endpoints exist, the viewer reads snapshots from them, and the old frontend is retired (the old backend can keep serving chat/quiz until those are rebuilt or dropped).

## 8. Wall screen (kiosk) deployment

**Suggested hardware per home (~€200–350):**

- 24"–32" touch monitor (USB touch, HDMI), or a large Android tablet as a lower-cost option.
- Raspberry Pi 5 (4 GB+) with active cooler, or a fanless N100 mini-PC for bigger screens.
- VESA wall mount, power and cable routing.

**Software setup (scripted, so every home is identical):**

- Raspberry Pi OS Lite + a minimal compositor (`labwc`/`cage`), auto-login, Chromium launched with `--kiosk --noerrdialogs --disable-pinch --overscroll-history-navigation=0` pointing at the viewer URL. (Browser pinch is disabled so the app owns the gesture.)
- Screen schedule: dim or turn off at night (`wlr-randr`/CEC), wake on touch.
- Watchdog: systemd restarts Chromium if it exits; nightly reboot.
- Remote management: Tailscale (or similar) so a family admin can SSH in to fix things without visiting.
- A provisioning script (`kiosk/setup.sh`, phase 2) and a device token entered once via a QR code on first boot.

## 9. Sync across homes

- The server publishes a versioned tree snapshot. Each wall screen polls `GET /api/tree/snapshot?since=<version>` every few minutes (cheap: a `304 Not Modified` most of the time). Push via WebSocket/SSE is an optional upgrade later.
- The viewer stores the last good snapshot and photos in IndexedDB/Cache Storage through a service worker, so it starts and works with no internet.
- Edits only happen through the editor (online). Wall screens are read-only in v1, which avoids conflict resolution entirely.
- App updates: the static build is versioned; the service worker picks up a new version and reloads during attract mode, never while someone is using it.

## 10. Privacy and security

- Living people's details are sensitive. Default visibility is "family only"; editors can mark fields or people as editors-only (e.g. exact birth dates of children).
- **Device tokens:** each wall screen gets its own long-lived, read-only, revocable token tied to a home. If a device is lost or a home leaves, revoke its token.
- **People:** relatives sign in (email magic link or the existing account system) to view on phones; only editors can change data.
- All traffic over HTTPS; photos served through signed URLs, not public buckets.
- No third-party analytics or trackers. Hosting in the EU (or wherever the family is) on a small VPS or managed platform.
- Regular encrypted database backups, plus an "export the whole tree" button so the family is never locked in.

## 11. Phased roadmap

| Phase | Goal | Deliverables |
|---|---|---|
| **0. Prototype** (this PR) | Prove the 3D/touch experience | `tree3d/` app: cylinder layout, rotate/pinch/pan, tap for bio, double-tap fly-to, idle attract mode, sample family, legacy-data adapter, unit tests |
| **1. Real data, one screen** | See our family on a real touchscreen | Load from old backend via adapter (or exported JSON), photos on nodes, search box, one pilot screen at home, tune gestures with real users (grandparents!) |
| **2. Server & sync** | Many homes, offline | Snapshot endpoint, device tokens, PWA offline cache, migration script, kiosk provisioning script |
| **3. Biographies & media** | Rich stories | Markdown biographies, photo galleries, stories timeline, editor mode on phone |
| **4. Delight** | Make it feel alive | Focus mode, "on this day" birthdays/memorials on the idle screen, trunk-and-branch visual theme, voice-over or recorded stories |
| **5. Scale & polish** | Hundreds of people, many homes | Instancing/LOD, fleet health page, automated updates, accessibility review |

## 12. Open questions for the family

1. How many people are in the tree today, and how many homes would get a screen?
2. Which languages should the interface support?
3. Who are the editors?
4. Budget per screen, and preference between a DIY Pi setup and an off-the-shelf tablet?
5. Should living children appear on the wall screens, and with how much detail?
