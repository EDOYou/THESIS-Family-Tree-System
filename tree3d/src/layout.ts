import type { Person, TreeIndex } from "./data/types";

export interface LayoutOptions {
  /** Arc distance between partners and between siblings, in world units. */
  spacing: number;
  /** Extra arc distance between unrelated family blocks. */
  blockGap: number;
  /** Vertical distance between generations. */
  levelHeight: number;
  /** Smallest cylinder radius, so tiny trees still look round. */
  minRadius: number;
  /** Largest share of the full circle the widest generation may cover. */
  maxWrap: number;
}

export const defaultLayoutOptions: LayoutOptions = {
  spacing: 2.6,
  blockGap: 1.2,
  levelHeight: 4,
  minRadius: 11,
  maxWrap: 0.8,
};

export interface LayoutNode {
  id: string;
  generation: number;
  /** Position along the unrolled cylinder (arc length). */
  x: number;
  angle: number;
  position: [number, number, number];
}

export interface TreeLayout {
  nodes: Map<string, LayoutNode>;
  radius: number;
  generations: number;
  levelY: (generation: number) => number;
}

/**
 * Assigns every person a generation number. Children sit one level below
 * their lowest parent, partners share a level, and people without recorded
 * parents are pulled down to sit just above their children.
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
 * Lays the tree out generation by generation on a vertical cylinder.
 * Couples are kept side by side, siblings are grouped into a block centred
 * under their parents, and blocks are pushed apart so nobody overlaps.
 */
export function layoutTree(index: TreeIndex, options: LayoutOptions = defaultLayoutOptions): TreeLayout {
  const gens = assignGenerations(index);
  const generations = gens.size ? Math.max(...gens.values()) + 1 : 0;
  const x = new Map<string, number>();

  const byGen: string[][] = Array.from({ length: generations }, () => []);
  for (const [id, g] of gens) byGen[g].push(id);

  const parentCenter = (id: string): number | undefined => {
    const placed = (index.parents.get(id) ?? []).filter((p) => x.has(p));
    if (!placed.length) return undefined;
    return placed.reduce((sum, p) => sum + x.get(p)!, 0) / placed.length;
  };

  const rows: string[][][] = [];
  for (let g = 0; g < generations; g++) {
    const ids = byGen[g].sort((a, b) => birthKey(index.people.get(a)).localeCompare(birthKey(index.people.get(b))));

    // Couples (a person plus their partners on the same level).
    const grouped = new Set<string>();
    const couples: string[][] = [];
    for (const id of ids) {
      if (grouped.has(id)) continue;
      const members = [id, ...(index.partners.get(id) ?? []).filter((p) => gens.get(p) === g && !grouped.has(p))];
      members.forEach((m) => grouped.add(m));
      // Blood relatives first, so they sit on the side nearer their siblings.
      members.sort((a, b) => (parentCenter(a) === undefined ? 1 : 0) - (parentCenter(b) === undefined ? 1 : 0));
      couples.push(members);
    }

    // Sibling blocks: couples whose members descend from the same place.
    const blocks = new Map<string, { key?: number; couples: string[][] }>();
    let orphanBlock = 0;
    for (const couple of couples) {
      const centers = couple.map(parentCenter).filter((c): c is number => c !== undefined);
      const key = centers.length ? centers.reduce((a, b) => a + b, 0) / centers.length : undefined;
      const blockId = key === undefined ? `orphan-${orphanBlock++}` : key.toFixed(3);
      const block = blocks.get(blockId) ?? { key, couples: [] };
      block.couples.push(couple);
      blocks.set(blockId, block);
    }

    const ordered = [...blocks.values()].sort((a, b) => (a.key ?? Infinity) - (b.key ?? Infinity));
    rows.push(ordered.flatMap((block) => block.couples));
    let cursor = -Infinity;
    for (const block of ordered) {
      const people = block.couples.reduce((n, c) => n + c.length, 0);
      const width = (people - 1) * options.spacing;
      const desiredLeft = block.key === undefined ? cursor : block.key - width / 2;
      let left = Math.max(desiredLeft, cursor);
      if (!Number.isFinite(left)) left = 0;
      for (const couple of block.couples) {
        for (const id of couple) {
          x.set(id, left);
          left += options.spacing;
        }
      }
      cursor = left + options.blockGap;
    }
  }

  // Bottom-up: slide each couple towards the middle of their children,
  // as far as their neighbours on the same level allow.
  for (let g = generations - 2; g >= 0; g--) {
    const row = rows[g];
    for (let i = 0; i < row.length; i++) {
      const couple = row[i];
      const kids = [...new Set(couple.flatMap((id) => index.children.get(id) ?? []))].filter((c) => x.has(c));
      if (!kids.length) continue;
      const left = x.get(couple[0])!;
      const width = (couple.length - 1) * options.spacing;
      const desiredLeft = kids.reduce((sum, c) => sum + x.get(c)!, 0) / kids.length - width / 2;
      const prev = row[i - 1];
      const next = row[i + 1];
      const minLeft = prev ? x.get(prev[prev.length - 1])! + options.spacing : -Infinity;
      const maxLeft = next ? x.get(next[0])! - options.spacing - width : Infinity;
      const shift = Math.min(Math.max(desiredLeft, minLeft), maxLeft) - left;
      couple.forEach((id) => x.set(id, x.get(id)! + shift));
    }
  }

  // Wrap the unrolled layout around a cylinder centred on the front (+z).
  const xs = [...x.values()];
  const minX = xs.length ? Math.min(...xs) : 0;
  const maxX = xs.length ? Math.max(...xs) : 0;
  const mid = (minX + maxX) / 2;
  const extent = maxX - minX + options.spacing;
  const radius = Math.max(options.minRadius, extent / (2 * Math.PI * options.maxWrap));
  const levelY = (generation: number) => ((generations - 1) / 2 - generation) * options.levelHeight;

  const nodes = new Map<string, LayoutNode>();
  for (const [id, rawX] of x) {
    const generation = gens.get(id)!;
    const arc = rawX - mid;
    const angle = arc / radius;
    nodes.set(id, {
      id,
      generation,
      x: arc,
      angle,
      position: [radius * Math.sin(angle), levelY(generation), radius * Math.cos(angle)],
    });
  }
  return { nodes, radius, generations, levelY };
}
