import "./style.css";
import sample from "./data/sample-family.json";
import * as edit from "./data/edit";
import { toSnapshot } from "./data/legacy";
import { indexTree, type Person, type TreeSnapshot } from "./data/types";
import { t } from "./i18n";
import { layoutTree } from "./layout";
import { FamilyTreeScene } from "./scene";
import { BioPanel } from "./ui/bioPanel";
import { EditPanel } from "./ui/editPanel";

/** After this long without a touch, the screen resets and slowly rotates. */
const IDLE_MS = 60_000;
/** How often a screen checks the shared tree file for changes. */
const REFRESH_MS = 5 * 60_000;
/** Where the dev server keeps the family file (see familyFilePlugin.ts). */
const FAMILY_API = "/api/family";

/**
 * Data source:
 *   ?data=<url>   a snapshot JSON or the old backend's /api/persons/all array
 *   /api/family   the family file, when the app runs from `npm run dev`
 *   otherwise     the bundled sample family
 * Whichever file is used is checked again every few minutes so every screen
 * stays in sync. Editing is only offered on the computer running the dev server.
 */
async function loadSnapshot(): Promise<{ snapshot: TreeSnapshot; url?: string; text?: string; canEdit: boolean }> {
  const requested = new URLSearchParams(location.search).get("data");
  if (requested) {
    const text = await fetchText(requested);
    return { snapshot: toSnapshot(JSON.parse(text)), url: requested, text, canEdit: false };
  }
  try {
    const response = await fetch(FAMILY_API, { cache: "no-store" });
    const canEdit = response.headers.get("X-Family-Editor") === "1";
    if (response.ok) {
      const text = await response.text();
      return { snapshot: toSnapshot(JSON.parse(text)), url: FAMILY_API, text, canEdit };
    }
    return { snapshot: toSnapshot(structuredClone(sample)), canEdit };
  } catch {
    return { snapshot: toSnapshot(structuredClone(sample)), canEdit: false };
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  return response.text();
}

function button(className: string, label: string, onClick: () => void, title?: string) {
  const node = document.createElement("button");
  node.className = className;
  node.textContent = label;
  if (title) node.setAttribute("aria-label", title);
  node.addEventListener("click", onClick);
  return node;
}

async function start() {
  const app = document.getElementById("app")!;
  const loaded = await loadSnapshot();
  let snapshot = loaded.snapshot;
  let index = indexTree(snapshot);
  let layout = layoutTree(index);
  let usingSample = loaded.url === undefined;
  /** Last version of the shared file this screen knows about. */
  let known = loaded.text;

  const stage = document.createElement("div");
  stage.className = "stage";
  app.append(stage);

  let idleTimer = 0;
  let idle = true;
  let updateWaiting = false;
  let editing = false;

  const select = (id: string | null, focusName = false) => {
    scene.select(id);
    const person = id ? index.people.get(id) : undefined;
    if (!person) {
      viewPanel.hide();
      editPanel.hide();
    } else if (editing) {
      viewPanel.hide();
      editPanel.show(person, focusName);
    } else {
      editPanel.hide();
      viewPanel.show(person);
    }
  };
  const goIdle = () => {
    if (editing) return;
    idle = true;
    // Apply a tree update only when nobody is using the screen.
    if (updateWaiting) location.reload();
    select(null);
    scene.home();
    scene.setAutoRotate(true);
  };
  const interact = () => {
    idle = false;
    scene.setAutoRotate(false);
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(goIdle, IDLE_MS);
  };

  const scene = new FamilyTreeScene(stage, index, layout, { onSelect: (id) => select(id), onInteract: interact });
  const viewPanel = new BioPanel(
    index,
    (id) => {
      select(id);
      scene.flyTo(id);
    },
    () => select(null),
  );

  // ---- Editing -------------------------------------------------------------
  const history: string[] = [];
  const toolbar = document.createElement("div");
  toolbar.className = "edit-bar";
  const status = document.createElement("span");
  status.className = "edit-status";
  const undoButton = button("btn", "↶ Undo", () => undo());
  const firstPerson = button("btn primary", "+ Add the first person", () =>
    change((s) => {
      const id = edit.addPerson(s);
      return () => openNew(id);
    }),
  );
  toolbar.append(
    Object.assign(document.createElement("strong"), { textContent: "✎ Editing" }),
    status,
    firstPerson,
    undoButton,
    button("btn", "Done", () => setEditing(false)),
  );

  let saving = Promise.resolve();
  const save = () => {
    const body = JSON.stringify({ ...snapshot, generatedAt: new Date().toISOString() });
    status.textContent = "Saving…";
    saving = saving.then(async () => {
      try {
        const response = await fetch(FAMILY_API, { method: "PUT", body, headers: { "Content-Type": "application/json" } });
        if (!response.ok) throw new Error(await response.text());
        status.textContent = "Saved ✓";
        // Match the server's formatting so our own save doesn't look like someone else's change.
        known = `${JSON.stringify(JSON.parse(body), null, 2)}\n`;
        usingSample = false;
      } catch (error) {
        status.textContent = `⚠ Not saved: ${String(error)}`;
      }
    });
  };

  const refreshToolbar = () => {
    undoButton.disabled = history.length === 0;
    firstPerson.hidden = snapshot.people.length > 0;
  };

  /** Rebuilds the scene from the current snapshot, keeping the camera where it is. */
  const rerender = () => {
    index = indexTree(snapshot);
    layout = layoutTree(index);
    scene.setTree(index, layout, snapshot.people.length <= 1);
    editPanel.setIndex(index);
    viewPanel.setIndex(index);
    refreshToolbar();
  };

  /** One undoable edit. The mutator may return a follow-up to run after redrawing. */
  const change = (mutate: (s: TreeSnapshot) => (() => void) | void, refreshPanel = true) => {
    history.push(JSON.stringify(snapshot));
    if (history.length > 100) history.shift();
    const after = mutate(snapshot);
    rerender();
    save();
    if (after) after();
    else if (refreshPanel) select(editPanel.openId);
  };

  const undo = () => {
    const previous = history.pop();
    if (!previous) return;
    snapshot = JSON.parse(previous);
    rerender();
    save();
    select(editPanel.openId && index.people.has(editPanel.openId) ? editPanel.openId : null);
  };

  const openNew = (id: string) => {
    select(id, true);
    scene.flyTo(id);
  };

  const editPanel = new EditPanel(index, {
    update: (id, patch: Partial<Person>, refresh) => change((s) => edit.updatePerson(s, id, patch), refresh ?? false),
    addChild: (id, other) => change((s) => {
      const child = edit.addChild(s, id, other);
      return () => openNew(child);
    }),
    addPartner: (id) => change((s) => {
      const partner = edit.addPartner(s, id);
      return () => openNew(partner);
    }),
    addParent: (id) => change((s) => {
      const parent = edit.addParent(s, id);
      return parent ? () => openNew(parent) : undefined;
    }),
    setPartnership: (a, b, patch) => change((s) => edit.updatePartnership(s, a, b, patch), false),
    unlinkPartners: (a, b) => change((s) => edit.unlinkPartners(s, a, b)),
    remove: (id) => change((s) => {
      edit.removePerson(s, id);
      return () => select(null);
    }),
    open: (id) => {
      select(id);
      scene.flyTo(id);
    },
    close: () => select(null),
  });

  const setEditing = (on: boolean) => {
    if (on && usingSample) {
      const fresh = window.confirm(
        "Start your own family tree?\n\nThe example family will be replaced by an empty tree that you fill in. " +
          "It is saved in tree3d/family-data/family.json on this computer.",
      );
      if (!fresh) return;
      history.length = 0;
      snapshot = edit.emptySnapshot();
      rerender();
      save();
      scene.home();
    }
    editing = on;
    document.body.classList.toggle("editing", on);
    scene.setAutoRotate(false);
    window.clearTimeout(idleTimer);
    if (!on) interact();
    refreshToolbar();
    select(editPanel.openId ?? null);
  };

  // ---- Chrome ----------------------------------------------------------------
  const homeButton = button("home", "⌂", () => {
    select(null);
    scene.home();
  }, t("home"));
  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = t("hint");
  app.append(viewPanel.root, editPanel.root, homeButton, hint);
  if (loaded.canEdit) {
    app.append(button("edit-toggle", "✎ Edit", () => setEditing(true), "Edit the family tree"), toolbar);
  }
  window.addEventListener("pointerdown", () => hint.classList.add("hidden"), { once: true });
  // Any touch anywhere (panel, globe, buttons) counts as someone using the screen.
  window.addEventListener("pointerdown", () => {
    if (!editing) interact();
  });
  goIdle();

  const { url } = loaded;
  if (url && known !== undefined) {
    window.setInterval(async () => {
      if (editing) return;
      try {
        const latest = await fetchText(url);
        if (latest === known) return;
        known = latest;
        updateWaiting = true;
        if (idle) location.reload();
      } catch {
        // Offline or server down: keep showing the tree we have.
      }
    }, REFRESH_MS);
  }
}

start().catch((error) => {
  const message = document.createElement("pre");
  message.className = "error";
  message.textContent = String(error);
  document.body.append(message);
});
