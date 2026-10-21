import type { Person, TreeIndex } from "./data/types";

export interface LayoutOptions {
  /** Distance between neighbouring cards on the same level, in world units. */
  spacing: number;
  /** Extra distance between unrelated families on the same level. */
  blockGap: number;
  /** Vertical distance between generations. */
  levelHeight: number;
  /** Radius of the root level relative to the top level, so the crown widens upward. */
  rootShape: number;
  /** Smallest radius of the top level, so small trees still look round. */
  minTopRadius: number;
  /** Largest share of the full circle any level may cover. */
  maxWrap: number;
}

export const defaultLayoutOptions: LayoutOptions = {
  spacing: 3.0,
  blockGap: 1.4,
  levelHeight: 4.2,
  rootShape: 0.6,
  minTopRadius: 10,
  maxWrap: 0.7,
};

export interface LayoutNode {
  id: string;
  generation: number;
  angle: number;
  radius: number;
  position: [number, number, number];
}

export interface TreeLayout {
  nodes: Map<string, LayoutNode>;
  generations: number;
  /** Height of a generation; the root generation is 0 and the tree grows upward. */
  levelY: (generation: number) => number;
  radiusAt: (generation: number) => number;
  /** Family units per level, left to right: a person with their partners. */
  units: string[][][];
}

/**
 * Assigns every person a generation number. Children sit one level above
 * their highest parent, partners share a level, and people without recorded
 * parents are pulled up to sit just below their children.
 */
export function assignGenerations(index: TreeIndex): Map<string, number> {
  const gen = new Map<string, number>();
  for (const id of index.people.keys()) gen.set(id, 0);

  const limit = index.people.size + 2;
  for (let pass = 0; pass < limit; pass++) {
    let changed = false;
    const raise = (id: string, value: number) => {
      if (value > gen.get(id)!) {
        gen.set(id, value);
        changed = true;
      }
    };
    for (const [childId, parentIds] of index.parents) {
      raise(childId, Math.max(...parentIds.map((p) => gen.get(p)!)) + 1);
    }
    for (const [id, partnerIds] of index.partners) {
      for (const partnerId of partnerIds) raise(id, gen.get(partnerId)!);
    }
    for (const [parentId, childIds] of index.children) {
      if (index.parents.has(parentId)) continue;
      raise(parentId, Math.min(...childIds.map((c) => gen.get(c)!)) - 1);
    }
    if (!changed) break;
  }

  const min = Math.min(...gen.values());
  for (const [id, g] of gen) gen.set(id, g - min);
  return gen;
}

const birthKey = (p: Person | undefined) => p?.birth?.date ?? "9999";

/**
 * Orders one person and their partners so each couple sits side by side:
 * one partner → [person, partner]; two → [first, person, second];
 * more alternate outward. The person with the most partners is the centre.
 */
export function familyUnit(index: TreeIndex, id: string, sameLevel: (other: string) => boolean): string[] {
  const partnersOf = (p: string) => (index.partners.get(p) ?? []).filter(sameLevel);
  const score = (p: string) => partnersOf(p).length * 10 + (index.parents.has(p) ? 1 : 0);
  const center = [id, ...partnersOf(id)].reduce((best, p) => (score(p) > score(best) ? p : best), id);
  const unit = [center];
  partnersOf(center).forEach((partner, i) => {
    if (i % 2 === 1 || partnersOf(center).length === 1) unit.push(partner);
    else unit.unshift(partner);
  });
  return unit;
}

/**
 * Lays the family out as a tree growing upward from the root generation.
 * Each level sits on a circle that widens with height, like a crown.
 * Children are grouped above the couple they come from, and every couple is
 * nudged towards the middle of its children so branches stay short.
 */
export function layoutTree(index: TreeIndex, options: LayoutOptions = defaultLayoutOptions): TreeLayout {
  const gens = assignGenerations(index);
  const generations = gens.size ? Math.max(...gens.values()) + 1 : 0;
  // Radius of each level before scaling: narrow at the root, 1 at the top.
  const shape = (g: number) =>
    generations > 1 ? options.rootShape + ((1 - options.rootShape) * g) / (generations - 1) : 1;

  // Positions are worked out as angles on unit-scale circles, so the gap
  // between cards is the same in world units on every level.
  const u = new Map<string, number>();
  const byGen: string[][] = Array.from({ length: generations }, () => []);
  for (const [id, g] of gens) byGen[g].push(id);

  const parentCenter = (id: string): number | undefined => {
    const placed = (index.parents.get(id) ?? []).filter((p) => u.has(p));
    if (!placed.length) return undefined;
    return placed.reduce((sum, p) => sum + u.get(p)!, 0) / placed.length;
  };

  const units: string[][][] = [];
  for (let g = 0; g < generations; g++) {
    const gap = options.spacing / shape(g);
    const blockGap = options.blockGap / shape(g);
    const ids = byGen[g].sort((a, b) => birthKey(index.people.get(a)).localeCompare(birthKey(index.people.get(b))));

    const grouped = new Set<string>();
    const rowUnits: string[][] = [];
    for (const id of ids) {
      if (grouped.has(id)) continue;
      const unit = familyUnit(index, id, (other) => gens.get(other) === g && !grouped.has(other));
      unit.forEach((m) => grouped.add(m));
      rowUnits.push(unit);
    }

    // Sibling blocks: units whose blood member shares the same parents.
    const blocks = new Map<string, { key?: number; units: string[][] }>();
    let loose = 0;
    for (const unit of rowUnits) {
      const blood = unit.find((m) => parentCenter(m) !== undefined);
      const key = blood === undefined ? undefined : parentCenter(blood);
      const blockId = blood === undefined ? `loose-${loose++}` : [...index.parents.get(blood)!].sort().join("|");
      const block = blocks.get(blockId) ?? { key, units: [] };
      block.units.push(unit);
      blocks.set(blockId, block);
    }

    const ordered = [...blocks.values()].sort((a, b) => (a.key ?? Infinity) - (b.key ?? Infinity));
    units.push(ordered.flatMap((block) => block.units));
    let cursor = -Infinity;
    for (const block of ordered) {
      const people = block.units.reduce((n, unit) => n + unit.length, 0);
      const width = (people - 1) * gap;
      let left = Math.max(block.key === undefined ? cursor : block.key - width / 2, cursor);
      if (!Number.isFinite(left)) left = 0;
      for (const unit of block.units) {
        for (const id of unit) {
          u.set(id, left);
          left += gap;
        }
      }
      cursor = left + blockGap;
    }
  }

  // Top-down pass done; now pull each unit towards the middle of its
  // children, as far as its neighbours on the same level allow.
  for (let g = generations - 2; g >= 0; g--) {
    const gap = options.spacing / shape(g);
    const row = units[g];
    for (let i = 0; i < row.length; i++) {
      const unit = row[i];
      const kids = [...new Set(unit.flatMap((id) => index.children.get(id) ?? []))].filter((c) => u.has(c));
      if (!kids.length) continue;
      const left = u.get(unit[0])!;
      const width = (unit.length - 1) * gap;
      const desiredLeft = kids.reduce((sum, c) => sum + u.get(c)!, 0) / kids.length - width / 2;
      const prev = row[i - 1];
      const next = row[i + 1];
      const minLeft = prev ? u.get(prev[prev.length - 1])! + gap : -Infinity;
      const maxLeft = next ? u.get(next[0])! - gap - width : Infinity;
      const shift = Math.min(Math.max(desiredLeft, minLeft), maxLeft) - left;
      unit.forEach((id) => u.set(id, u.get(id)! + shift));
    }
  }

  // Scale so the widest level wraps at most maxWrap of the circle, centred on +z.
  const values = [...u.values()];
  const minU = values.length ? Math.min(...values) : 0;
  const maxU = values.length ? Math.max(...values) : 0;
  const mid = (minU + maxU) / 2;
  const scale = Math.max(options.minTopRadius, (maxU - minU) / (2 * Math.PI * options.maxWrap));
  const radiusAt = (g: number) => scale * shape(g);
  const levelY = (g: number) => g * options.levelHeight;

  const nodes = new Map<string, LayoutNode>();
  for (const [id, value] of u) {
    const generation = gens.get(id)!;
    const angle = (value - mid) / scale;
    const radius = radiusAt(generation);
    nodes.set(id, {
      id,
      generation,
      angle,
      radius,
      position: [radius * Math.sin(angle), levelY(generation), radius * Math.cos(angle)],
    });
  }
  return { nodes, generations, levelY, radiusAt, units };
}
