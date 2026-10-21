import "./style.css";
import sample from "./data/sample-family.json";
import { toSnapshot } from "./data/legacy";
import { indexTree, type TreeSnapshot } from "./data/types";
import { layoutTree } from "./layout";
import { FamilyTreeScene } from "./scene";
import { t } from "./i18n";
import { BioPanel } from "./ui/bioPanel";

/** After this long without a touch, the screen resets and slowly rotates. */
const IDLE_MS = 60_000;
/** How often a screen checks the shared tree file for changes. */
const REFRESH_MS = 5 * 60_000;

const params = new URLSearchParams(location.search);
/**
 * Data source:
 *   ?data=<url>  a snapshot JSON or the old backend's /api/persons/all array;
 *                checked again every few minutes so every screen stays in sync
 *   otherwise    the bundled sample family
 */
const dataUrl = params.get("data");

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  return response.text();
}

async function loadSnapshot(): Promise<{ snapshot: TreeSnapshot; text?: string }> {
  if (!dataUrl) return { snapshot: toSnapshot(sample) };
  const text = await fetchText(dataUrl);
  return { snapshot: toSnapshot(JSON.parse(text)), text };
}

async function start() {
  const app = document.getElementById("app")!;
  const { snapshot, text: loadedText } = await loadSnapshot();
  const index = indexTree(snapshot);
  const layout = layoutTree(index);

  const stage = document.createElement("div");
  stage.className = "stage";
  app.append(stage);

  let idleTimer = 0;
  let idle = true;
  let updateWaiting = false;
  const select = (id: string | null) => {
    scene.select(id);
    const person = id ? index.people.get(id) : undefined;
    if (person) panel.show(person);
    else panel.hide();
  };
  const goIdle = () => {
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

  const scene = new FamilyTreeScene(stage, index, layout, { onSelect: select, onInteract: interact });
  const panel = new BioPanel(
    index,
    (id) => {
      interact();
      select(id);
      scene.flyTo(id);
    },
    () => {
      interact();
      select(null);
    },
  );

  const homeButton = document.createElement("button");
  homeButton.className = "home";
  homeButton.textContent = "⌂";
  homeButton.setAttribute("aria-label", t("home"));
  homeButton.addEventListener("click", () => {
    interact();
    select(null);
    scene.home();
  });

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = t("hint");

  app.append(panel.root, homeButton, hint);
  window.addEventListener("pointerdown", () => hint.classList.add("hidden"), { once: true });
  // Any touch anywhere (panel, globe, buttons) counts as someone using the screen.
  window.addEventListener("pointerdown", interact);
  goIdle();

  if (dataUrl && loadedText !== undefined) {
    window.setInterval(async () => {
      try {
        if ((await fetchText(dataUrl)) === loadedText) return;
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
