// The tree snapshot is the single document the viewer renders.
// See docs/3d-family-tree-plan.md, section 6.

export interface LifeEvent {
  /** ISO date with optional precision: "1950", "1950-06" or "1950-06-14". */
  date?: string;
  place?: string;
}

export interface Person {
  id: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
  gender?: "M" | "F";
  birth?: LifeEvent;
  death?: LifeEvent;
  occupation?: string;
  /** Plain text; blank lines separate paragraphs. */
  biography?: string;
  photoUrl?: string;
}

export interface ParentLink {
  parentId: string;
  childId: string;
  kind?: "biological" | "adoptive" | "step";
}

export interface Partnership {
  aId: string;
  bId: string;
  kind?: "married" | "partner";
}

export interface TreeSnapshot {
  version: number;
  generatedAt?: string;
  people: Person[];
  parentLinks: ParentLink[];
  partnerships: Partnership[];
}

/** Lookup helpers built once from a snapshot. */
export interface TreeIndex {
  people: Map<string, Person>;
  parents: Map<string, string[]>;
  children: Map<string, string[]>;
  partners: Map<string, string[]>;
}

export function indexTree(snapshot: TreeSnapshot): TreeIndex {
  const people = new Map(snapshot.people.map((p) => [p.id, p]));
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const partners = new Map<string, string[]>();
  const push = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(value)) list.push(value);
    map.set(key, list);
  };

  for (const link of snapshot.parentLinks) {
    if (!people.has(link.parentId) || !people.has(link.childId)) continue;
    push(parents, link.childId, link.parentId);
    push(children, link.parentId, link.childId);
  }
  for (const p of snapshot.partnerships) {
    if (!people.has(p.aId) || !people.has(p.bId) || p.aId === p.bId) continue;
    push(partners, p.aId, p.bId);
    push(partners, p.bId, p.aId);
  }
  return { people, parents, children, partners };
}

/** "1932 – 2011", "b. 1990", or "" when nothing is known. */
export function lifespan(person: Person): string {
  const born = person.birth?.date?.slice(0, 4);
  const died = person.death?.date?.slice(0, 4);
  if (born && died) return `${born} – ${died}`;
  if (born) return `b. ${born}`;
  if (died) return `d. ${died}`;
  return "";
}
