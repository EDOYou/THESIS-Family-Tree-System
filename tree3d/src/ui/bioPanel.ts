import { lifespan, type Person, type TreeIndex } from "../data/types";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatEvent(label: string, date?: string, place?: string): string | null {
  if (!date && !place) return null;
  return [label, date, place && `in ${place}`].filter(Boolean).join(" ");
}

/** Slide-in biography card. All person text is set via textContent. */
export class BioPanel {
  readonly root = el("aside", "bio");
  private body = el("div", "bio-body");

  constructor(
    private index: TreeIndex,
    private onNavigate: (id: string) => void,
    onClose: () => void,
  ) {
    const close = el("button", "bio-close", "×");
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", onClose);
    this.root.append(close, this.body);
  }

  show(person: Person) {
    this.body.replaceChildren();

    const header = el("header", "bio-header");
    const portrait = el("div", `bio-portrait ${person.gender === "F" ? "female" : person.gender === "M" ? "male" : ""}`);
    if (person.photoUrl) {
      const img = el("img");
      img.src = person.photoUrl;
      img.alt = person.displayName;
      portrait.append(img);
    } else {
      portrait.textContent = person.displayName
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join("");
    }
    const titles = el("div");
    titles.append(el("h2", undefined, person.displayName), el("p", "bio-years", lifespan(person)));
    if (person.occupation) titles.append(el("p", "bio-occupation", person.occupation));
    header.append(portrait, titles);
    this.body.append(header);

    const facts = [
      formatEvent("Born", person.birth?.date, person.birth?.place),
      formatEvent("Died", person.death?.date, person.death?.place),
    ].filter((f): f is string => Boolean(f));
    if (facts.length) {
      const list = el("ul", "bio-facts");
      for (const fact of facts) list.append(el("li", undefined, fact));
      this.body.append(list);
    }

    const story = el("section", "bio-story");
    const paragraphs = (person.biography ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length) {
      for (const text of paragraphs) story.append(el("p", undefined, text));
    } else {
      story.append(el("p", "bio-empty", "No biography yet. Ask a family editor to add one."));
    }
    this.body.append(story);

    this.appendRelatives("Parents", this.index.parents.get(person.id));
    this.appendRelatives("Partner", this.index.partners.get(person.id));
    this.appendRelatives("Children", this.index.children.get(person.id));

    this.root.classList.add("open");
    this.root.scrollTop = 0;
  }

  hide() {
    this.root.classList.remove("open");
  }

  private appendRelatives(label: string, ids: string[] | undefined) {
    if (!ids?.length) return;
    const section = el("section", "bio-relatives");
    section.append(el("h3", undefined, label));
    const row = el("div", "chips");
    for (const id of ids) {
      const relative = this.index.people.get(id);
      if (!relative) continue;
      const chip = el("button", "chip", relative.displayName);
      chip.addEventListener("click", () => this.onNavigate(id));
      row.append(chip);
    }
    section.append(row);
    this.body.append(section);
  }
}
