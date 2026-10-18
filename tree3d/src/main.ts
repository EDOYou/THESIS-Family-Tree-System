import "./style.css";
import sample from "./data/sample-family.json";
import { toSnapshot } from "./data/legacy";
import { indexTree, type TreeSnapshot } from "./data/types";
import { layoutTree } from "./layout";
import { FamilyTreeScene } from "./scene";
import { BioPanel } from "./ui/bioPanel";

/** After this long without a touch, the screen resets and slowly rotates. */
const IDLE_MS = 60_000;

/**
 * Data source, in order of preference:
 *   ?data=<url>  a snapshot JSON or the old backend's /api/persons/all array
 *   otherwise    the bundled sample family
 */
async function loadSnapshot(): Promise<TreeSnapshot> {
  const url = new URLSearchParams(location.search).get("data");
  if (!url) return toSnapshot(sample);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url}: ${response.status}`);
  return toSnapshot(await response.json());
}

async function start() {
  const app = document.getElementById("app")!;
  const snapshot = await loadSnapshot();
  const index = indexTree(snapshot);
  const layout = layoutTree(index);

  const stage = document.createElement("div");
  stage.className = "stage";
  app.append(stage);

  let idleTimer = 0;
  const select = (id: string | null) => {
    scene.select(id);
    const person = id ? index.people.get(id) : undefined;
    if (person) panel.show(person);
    else panel.hide();
  };
  const goIdle = () => {
    select(null);
    scene.home();
    scene.setAutoRotate(true);
  };
  const interact = () => {
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
  homeButton.setAttribute("aria-label", "Show the whole tree");
  homeButton.addEventListener("click", () => {
    interact();
    select(null);
    scene.home();
  });

  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Drag to rotate · pinch to zoom · tap a person";

  app.append(panel.root, homeButton, hint);
  window.addEventListener("pointerdown", () => hint.classList.add("hidden"), { once: true });
  goIdle();
}

start().catch((error) => {
  const message = document.createElement("pre");
  message.className = "error";
  message.textContent = String(error);
  document.body.append(message);
});
