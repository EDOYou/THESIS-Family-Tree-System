import { t } from "../i18n";

// The tree snapshot is the single document the viewer renders.
// See docs/3d-family-tree-plan.md, section 6.

export interface LifeEvent {
  /** ISO date with optional precision: "1950", "1950-06" or "1950-06-14". */
  date?: string;
  place?: string;
}

export interface Residence {
  city?: string;
  country?: string;
  /** Coordinates for the globe pin. */
  lat?: number;
  lng?: number;
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
  /** Where the person lives now (or lived last). */
  residence?: Residence;
  /** Plain text; blank lines separate paragraphs. */
  biography?: string;
  /** Short lines shown as a list under the biography. */
  achievements?: string[];
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
  /** "former" draws a broken stick, e.g. after a divorce. Defaults to "current". */
  status?: "current" | "former";
  /** Year or ISO date; used to order several marriages of one person. */
  start?: string;
  end?: string;
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
  /** Partners in marriage order (earliest first). */
  partners: Map<string, string[]>;
  partnership: (aId: string, bId: string) => Partnership | undefined;
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
  const byPair = new Map<string, Partnership>();
  const pairKey = (a: string, b: string) => [a, b].sort().join("|");
  // Stable sort by start date keeps the listed order when dates are missing.
  const ordered = [...snapshot.partnerships].sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  for (const p of ordered) {
    if (!people.has(p.aId) || !people.has(p.bId) || p.aId === p.bId) continue;
    push(partners, p.aId, p.bId);
    push(partners, p.bId, p.aId);
    byPair.set(pairKey(p.aId, p.bId), p);
  }
  return { people, parents, children, partners, partnership: (a, b) => byPair.get(pairKey(a, b)) };
}

/** "1932 – 2011", "b. 1990", or "" when nothing is known. */
export function lifespan(person: Person): string {
  const born = person.birth?.date?.slice(0, 4);
  const died = person.death?.date?.slice(0, 4);
  if (born && died) return `${born} – ${died}`;
  if (born) return t("born", { year: born });
  if (died) return t("died", { year: died });
  return "";
}
