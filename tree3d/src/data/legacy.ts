import type { ParentLink, Partnership, Person, TreeSnapshot } from "./types";

/**
 * Shape returned by the old Spring Boot backend at GET /api/persons/all
 * (backend/src/main/java/com/familytree/model/dto/PersonDTO.java).
 */
export interface LegacyPerson {
  id: string;
  name?: string | null;
  gender?: "M" | "F" | null;
  occupation?: string | null;
  age?: number | null;
  birthDate?: string | null;
  deathDate?: string | null;
  birthPlace?: string | null;
  deathPlace?: string | null;
  fatherId?: string | null;
  motherId?: string | null;
  spouses?: string[] | null;
  children?: string[] | null;
  avatar?: string | null;
}

const clean = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Converts the old flat person list into a normalized snapshot.
 * Relationships are stored redundantly in the old system (fatherId/motherId
 * and children[], spouses on one or both sides), so they are merged and
 * de-duplicated here; links to unknown ids are dropped.
 */
export function fromLegacy(list: LegacyPerson[]): TreeSnapshot {
  const ids = new Set(list.map((p) => p.id));
  const parentKeys = new Set<string>();
  const partnerKeys = new Set<string>();
  const parentLinks: ParentLink[] = [];
  const partnerships: Partnership[] = [];

  const addParent = (parentId: string | null | undefined, childId: string) => {
    if (!parentId || !ids.has(parentId) || !ids.has(childId) || parentId === childId) return;
    const key = `${parentId}>${childId}`;
    if (parentKeys.has(key)) return;
    parentKeys.add(key);
    parentLinks.push({ parentId, childId, kind: "biological" });
  };
  const addPartner = (aId: string, bId: string) => {
    if (!ids.has(aId) || !ids.has(bId) || aId === bId) return;
    const key = [aId, bId].sort().join("|");
    if (partnerKeys.has(key)) return;
    partnerKeys.add(key);
    partnerships.push({ aId, bId, kind: "married" });
  };

  const people: Person[] = list.map((p) => {
    addParent(p.fatherId, p.id);
    addParent(p.motherId, p.id);
    for (const childId of p.children ?? []) addParent(p.id, childId);
    for (const spouseId of p.spouses ?? []) addPartner(p.id, spouseId);

    const displayName = clean(p.name) ?? "Unknown";
    const [givenName, ...rest] = displayName.split(/\s+/);
    const birthDate = clean(p.birthDate);
    const birthPlace = clean(p.birthPlace);
    const deathDate = clean(p.deathDate);
    const deathPlace = clean(p.deathPlace);
    return {
      id: p.id,
      displayName,
      givenName,
      familyName: rest.length ? rest.join(" ") : undefined,
      gender: p.gender ?? undefined,
      occupation: clean(p.occupation),
      birth: birthDate || birthPlace ? { date: birthDate, place: birthPlace } : undefined,
      death: deathDate || deathPlace ? { date: deathDate, place: deathPlace } : undefined,
      photoUrl: clean(p.avatar),
    };
  });

  return { version: 1, generatedAt: new Date().toISOString(), people, parentLinks, partnerships };
}

/** Accepts either a snapshot or the old backend's array and returns a snapshot. */
export function toSnapshot(data: unknown): TreeSnapshot {
  if (Array.isArray(data)) return fromLegacy(data as LegacyPerson[]);
  const snapshot = data as Partial<TreeSnapshot>;
  if (snapshot && Array.isArray(snapshot.people)) {
    return {
      version: snapshot.version ?? 1,
      generatedAt: snapshot.generatedAt,
      people: snapshot.people,
      parentLinks: snapshot.parentLinks ?? [],
      partnerships: snapshot.partnerships ?? [],
    };
  }
  throw new Error("Unrecognized tree data: expected a snapshot or a person array");
}
