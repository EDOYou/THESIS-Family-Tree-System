import type { Partnership, Person, TreeSnapshot } from "./types";

// Small, pure edits on a snapshot. Each one changes the snapshot in place
// and keeps relationships consistent (no links to people who don't exist).

export function newId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function emptySnapshot(): TreeSnapshot {
  return { version: 1, people: [], parentLinks: [], partnerships: [] };
}

const samePair = (p: Partnership, a: string, b: string) => (p.aId === a && p.bId === b) || (p.aId === b && p.bId === a);

export function addPerson(snapshot: TreeSnapshot, person: Partial<Person> = {}): string {
  const id = person.id ?? newId();
  snapshot.people.push({ displayName: "New person", ...person, id });
  return id;
}

export function updatePerson(snapshot: TreeSnapshot, id: string, patch: Partial<Person>) {
  const person = snapshot.people.find((p) => p.id === id);
  if (!person) return;
  Object.assign(person, patch, { id });
  // Keep given/family names in step with the display name.
  if (patch.displayName !== undefined) {
    const [given, ...rest] = patch.displayName.trim().split(/\s+/);
    person.givenName = given || undefined;
    person.familyName = rest.length ? rest.join(" ") : undefined;
  }
}

export function linkParent(snapshot: TreeSnapshot, parentId: string, childId: string) {
  if (parentId === childId) return;
  if (snapshot.parentLinks.some((l) => l.parentId === parentId && l.childId === childId)) return;
  snapshot.parentLinks.push({ parentId, childId });
}

export function linkPartners(snapshot: TreeSnapshot, aId: string, bId: string, extra: Partial<Partnership> = {}) {
  if (aId === bId || snapshot.partnerships.some((p) => samePair(p, aId, bId))) return;
  snapshot.partnerships.push({ aId, bId, ...extra });
}

/** Adds a child to one parent, or to a couple when `otherParentId` is given. */
export function addChild(snapshot: TreeSnapshot, parentId: string, otherParentId?: string, person: Partial<Person> = {}) {
  const id = addPerson(snapshot, person);
  linkParent(snapshot, parentId, id);
  if (otherParentId) linkParent(snapshot, otherParentId, id);
  return id;
}

export function addPartner(snapshot: TreeSnapshot, personId: string, person: Partial<Person> = {}) {
  const id = addPerson(snapshot, person);
  linkPartners(snapshot, personId, id);
  return id;
}

/**
 * Adds a parent. If the child already has one parent, the two parents are
 * joined as partners, which is almost always what's wanted.
 */
export function addParent(snapshot: TreeSnapshot, childId: string, person: Partial<Person> = {}) {
  const existing = snapshot.parentLinks.filter((l) => l.childId === childId).map((l) => l.parentId);
  if (existing.length >= 2) return undefined;
  const id = addPerson(snapshot, person);
  linkParent(snapshot, id, childId);
  if (existing.length === 1) linkPartners(snapshot, existing[0], id);
  return id;
}

export function updatePartnership(snapshot: TreeSnapshot, aId: string, bId: string, patch: Partial<Partnership>) {
  const partnership = snapshot.partnerships.find((p) => samePair(p, aId, bId));
  if (partnership) Object.assign(partnership, patch);
}

export function unlinkPartners(snapshot: TreeSnapshot, aId: string, bId: string) {
  snapshot.partnerships = snapshot.partnerships.filter((p) => !samePair(p, aId, bId));
}

export function removePerson(snapshot: TreeSnapshot, id: string) {
  snapshot.people = snapshot.people.filter((p) => p.id !== id);
  snapshot.parentLinks = snapshot.parentLinks.filter((l) => l.parentId !== id && l.childId !== id);
  snapshot.partnerships = snapshot.partnerships.filter((p) => p.aId !== id && p.bId !== id);
}
