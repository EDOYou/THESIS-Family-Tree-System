import type { Person, TreeIndex } from "../data/types";
import { Globe } from "./globe";

/** What the editor can ask the app to do. Each call is one undoable step. */
export interface EditActions {
  /** `refresh` redraws the form, for changes it shows (photo, globe pin). */
  update: (id: string, patch: Partial<Person>, refresh?: boolean) => void;
  addChild: (id: string, otherParentId?: string) => void;
  addPartner: (id: string) => void;
  addParent: (id: string) => void;
  setPartnership: (a: string, b: string, patch: { status?: "current" | "former"; start?: string; end?: string }) => void;
  unlinkPartners: (a: string, b: string) => void;
  remove: (id: string) => void;
  open: (id: string) => void;
  close: () => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const clean = (value: string) => value.trim() || undefined;

/** Shrinks a photo to a small square JPEG so the family file stays light. */
async function photoToDataUrl(file: File, size = 320): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const side = Math.min(img.width, img.height);
    canvas
      .getContext("2d")!
      .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The editing form shown in the side panel when edit mode is on. */
export class EditPanel {
  readonly root = el("aside", "bio edit");
  private body = el("div", "bio-body");
  private globe = new Globe();
  private personId: string | null = null;

  constructor(
    private index: TreeIndex,
    private actions: EditActions,
  ) {
    const close = el("button", "bio-close", "×");
    close.setAttribute("aria-label", "Close");
    close.addEventListener("click", () => actions.close());
    this.root.append(close, this.body);
  }

  setIndex(index: TreeIndex) {
    this.index = index;
  }

  get openId() {
    return this.root.classList.contains("open") ? this.personId : null;
  }

  show(person: Person, focusName = false) {
    const { actions } = this;
    const id = person.id;
    const keepScroll = this.personId === id ? this.root.scrollTop : 0;
    this.personId = id;
    this.body.replaceChildren();
    // Always read the latest saved values; fields save one by one without redrawing.
    const now = () => this.index.people.get(id) ?? person;

    const field = (label: string, input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, hint?: string) => {
      const wrap = el("label", "field");
      wrap.append(el("span", "field-label", label), input);
      if (hint) wrap.append(el("span", "field-hint", hint));
      return wrap;
    };
    const text = (value: string | undefined, onChange: (v: string) => void, placeholder = "") => {
      const input = el("input");
      input.type = "text";
      input.value = value ?? "";
      input.placeholder = placeholder;
      input.addEventListener("change", () => onChange(input.value));
      return input;
    };
    const area = (value: string | undefined, onChange: (v: string) => void, rows: number, placeholder = "") => {
      const input = el("textarea");
      input.rows = rows;
      input.value = value ?? "";
      input.placeholder = placeholder;
      input.addEventListener("change", () => onChange(input.value));
      return input;
    };

    this.body.append(el("h2", "edit-title", "Edit person"));

    // Photo
    const photoRow = el("div", "edit-photo");
    const portrait = el("div", `bio-portrait ${person.gender === "F" ? "female" : person.gender === "M" ? "male" : ""}`);
    if (person.photoUrl) {
      const img = el("img");
      img.src = person.photoUrl;
      portrait.append(img);
    } else {
      portrait.textContent = "+";
    }
    const fileInput = el("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.hidden = true;
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (file) actions.update(id, { photoUrl: await photoToDataUrl(file) }, true);
    });
    const choose = el("button", "btn", person.photoUrl ? "Change photo" : "Add photo");
    choose.addEventListener("click", () => fileInput.click());
    portrait.addEventListener("click", () => fileInput.click());
    photoRow.append(portrait, choose, fileInput);
    if (person.photoUrl) {
      const removePhoto = el("button", "btn subtle", "Remove photo");
      removePhoto.addEventListener("click", () => actions.update(id, { photoUrl: undefined }, true));
      photoRow.append(removePhoto);
    }
    this.body.append(photoRow);

    const name = text(person.displayName, (v) => actions.update(id, { displayName: v.trim() || "Unknown" }));
    this.body.append(field("Full name", name));

    const gender = el("select");
    for (const [value, label] of [["", "—"], ["F", "Female"], ["M", "Male"]]) {
      const option = el("option", undefined, label);
      option.value = value;
      option.selected = (person.gender ?? "") === value;
      gender.append(option);
    }
    gender.addEventListener("change", () =>
      actions.update(id, { gender: (gender.value || undefined) as Person["gender"] }, true),
    );
    this.body.append(field("Gender", gender));

    const row = el("div", "field-row");
    row.append(
      field(
        "Born",
        text(person.birth?.date, (v) => actions.update(id, { birth: { ...now().birth, date: clean(v) } }), "1950 or 1950-06-14"),
      ),
      field(
        "Died",
        text(person.death?.date, (v) => {
          const date = clean(v);
          actions.update(id, { death: date || now().death?.place ? { ...now().death, date } : undefined });
        }, "leave empty if alive"),
      ),
    );
    this.body.append(row);
    this.body.append(
      field("Birthplace", text(person.birth?.place, (v) => actions.update(id, { birth: { ...now().birth, place: clean(v) } }))),
      field("Occupation", text(person.occupation, (v) => actions.update(id, { occupation: clean(v) }))),
    );

    // Where they live: type the city, tap the globe for the exact spot.
    const residence = person.residence ?? {};
    const placeRow = el("div", "field-row");
    placeRow.append(
      field("Lives in (city)", text(residence.city, (v) => actions.update(id, { residence: { ...now().residence, city: clean(v) } }))),
      field("Country", text(residence.country, (v) => actions.update(id, { residence: { ...now().residence, country: clean(v) } }))),
    );
    this.body.append(placeRow);
    const globeWrap = el("div", "bio-globe");
    globeWrap.append(
      el(
        "p",
        "field-hint",
        residence.lat !== undefined ? "Tap the globe to move the pin." : "Tap the globe where they live to place a pin.",
      ),
      this.globe.element,
    );
    this.body.append(globeWrap);
    this.globe.setPicker((place) => {
      const latest = now().residence ?? {};
      actions.update(
        id,
        { residence: { ...latest, lat: place.lat, lng: place.lng, country: place.country ?? latest.country } },
        true,
      );
    });
    this.globe.show(residence);

    this.body.append(
      field("Biography", area(person.biography, (v) => actions.update(id, { biography: clean(v) }), 6, "Their story…")),
      field(
        "Achievements",
        area(
          person.achievements?.join("\n"),
          (v) => {
            const list = v.split("\n").map((line) => line.trim()).filter(Boolean);
            actions.update(id, { achievements: list.length ? list : undefined });
          },
          3,
          "One per line",
        ),
      ),
    );

    // Partners, with marriage details.
    const partners = this.index.partners.get(id) ?? [];
    const partnersSection = el("section", "edit-section");
    partnersSection.append(el("h3", undefined, "Partners"));
    for (const partnerId of partners) {
      const partner = this.index.people.get(partnerId);
      const link = this.index.partnership(id, partnerId);
      if (!partner || !link) continue;
      const line = el("div", "partner-row");
      const chip = el("button", "chip", partner.displayName);
      chip.addEventListener("click", () => actions.open(partnerId));
      const status = el("select");
      for (const [value, label] of [["current", "Married"], ["former", "Former"]]) {
        const option = el("option", undefined, label);
        option.value = value;
        option.selected = (link.status ?? "current") === value;
        status.append(option);
      }
      status.addEventListener("change", () =>
        actions.setPartnership(id, partnerId, { status: status.value as "current" | "former" }),
      );
      const since = text(link.start, (v) => actions.setPartnership(id, partnerId, { start: clean(v) }), "from");
      const until = text(link.end, (v) => actions.setPartnership(id, partnerId, { end: clean(v) }), "until");
      since.className = until.className = "year";
      const unlink = el("button", "btn subtle", "Unlink");
      unlink.title = "Remove the marriage link (both people stay in the tree)";
      unlink.addEventListener("click", () => actions.unlinkPartners(id, partnerId));
      line.append(chip, status, since, until, unlink);
      partnersSection.append(line);
    }
    if (!partners.length) partnersSection.append(el("p", "field-hint", "No partner yet."));
    this.body.append(partnersSection);

    // Relatives, to jump around the family quickly.
    for (const [label, ids] of [
      ["Parents", this.index.parents.get(id) ?? []],
      ["Children", this.index.children.get(id) ?? []],
    ] as const) {
      if (!ids.length) continue;
      const section = el("section", "edit-section");
      section.append(el("h3", undefined, label));
      const chips = el("div", "chips");
      for (const relativeId of ids) {
        const chip = el("button", "chip", this.index.people.get(relativeId)?.displayName ?? "?");
        chip.addEventListener("click", () => actions.open(relativeId));
        chips.append(chip);
      }
      section.append(chips);
      this.body.append(section);
    }

    // Adding relatives.
    const add = el("section", "edit-section");
    add.append(el("h3", undefined, "Add to the family"));
    const childRow = el("div", "add-row");
    const other = el("select");
    for (const partnerId of partners) {
      const option = el("option", undefined, `with ${this.index.people.get(partnerId)?.displayName}`);
      option.value = partnerId;
      other.append(option);
    }
    const alone = el("option", undefined, partners.length ? "other parent unknown" : "no other parent");
    alone.value = "";
    other.append(alone);
    // Default to the current marriage.
    const current = [...partners].reverse().find((p) => this.index.partnership(id, p)?.status !== "former");
    if (current) other.value = current;
    const addChild = el("button", "btn", "+ Child");
    addChild.addEventListener("click", () => actions.addChild(id, other.value || undefined));
    childRow.append(addChild, other);
    const addPartner = el("button", "btn", "+ Partner");
    addPartner.addEventListener("click", () => actions.addPartner(id));
    const addParent = el("button", "btn", "+ Parent");
    addParent.disabled = (this.index.parents.get(id)?.length ?? 0) >= 2;
    addParent.addEventListener("click", () => actions.addParent(id));
    const more = el("div", "add-row");
    more.append(addPartner, addParent);
    add.append(childRow, more);
    this.body.append(add);

    const remove = el("button", "btn danger", "Delete this person");
    remove.addEventListener("click", () => {
      if (window.confirm(`Delete ${person.displayName} from the tree? Their relatives stay.`)) actions.remove(id);
    });
    this.body.append(remove);

    this.root.classList.add("open");
    this.root.scrollTop = keepScroll;
    if (focusName) {
      name.focus();
      name.select();
    }
  }

  hide() {
    this.root.classList.remove("open");
    this.globe.stop();
    this.globe.setPicker(null);
  }
}
