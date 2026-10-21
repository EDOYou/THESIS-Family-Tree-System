import * as THREE from "three";
import type { TreeIndex } from "./data/types";
import { CARD_ASPECT, CARD_WIDTH } from "./labels";
import type { TreeLayout } from "./layout";

export const BARK = new THREE.Color("#7a5534");
export const BARK_FORMER = new THREE.Color("#8a7a6a");

/** A piece of the tree that lights up when one of `ids` is selected. */
export interface TreePart {
  mesh: THREE.Mesh;
  ids: string[];
  baseColor: THREE.Color;
}

const CARD_HALF_HEIGHT = (CARD_WIDTH * CARD_ASPECT) / 2;

/** A tube that narrows from `r0` at the start of the curve to `r1` at the end. */
function taperedTube(curve: THREE.Curve<THREE.Vector3>, r0: number, r1: number, segments = 24): THREE.BufferGeometry {
  const radial = 8;
  const geometry = new THREE.TubeGeometry(curve, segments, 1, radial, false);
  const pos = geometry.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(center).multiplyScalar(r).add(center);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Small seeded random generator so leaves land in the same place every time. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function leafGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.5, 0.45, 0, 1.2);
  shape.quadraticCurveTo(-0.5, 0.45, 0, 0);
  return new THREE.ShapeGeometry(shape, 6);
}

/**
 * Builds the wooden part of the tree: roots, trunk, a branch to every
 * child from the couple (or single parent) they come from, and a stick
 * joining each couple. Former marriages get a lighter, broken stick.
 */
export function buildTree(index: TreeIndex, layout: TreeLayout) {
  const group = new THREE.Group();
  const parts: TreePart[] = [];
  const leafSpots: THREE.Vector3[] = [];
  const point = (id: string) => new THREE.Vector3(...layout.nodes.get(id)!.position);
  const g = layout.generations;
  const thickness = (gen: number) => 0.06 + 0.26 * (1 - gen / Math.max(g, 1));

  const addPart = (geometry: THREE.BufferGeometry, ids: string[], color = BARK) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    parts.push({ mesh, ids, baseColor: color.clone() });
  };

  // Couples: a stick between the two cards' inner edges.
  const unionPoint = new Map<string, THREE.Vector3>();
  const pairKey = (ids: string[]) => [...ids].sort().join("|");
  for (const [id, partnerIds] of index.partners) {
    for (const partnerId of partnerIds) {
      const key = pairKey([id, partnerId]);
      if (unionPoint.has(key) || !layout.nodes.has(id) || !layout.nodes.has(partnerId)) continue;
      const a = point(id);
      const b = point(partnerId);
      unionPoint.set(key, a.clone().add(b).multiplyScalar(0.5));
      const inset = b.clone().sub(a).normalize().multiplyScalar(CARD_WIDTH / 2 - 0.05);
      const from = a.clone().add(inset);
      const to = b.clone().sub(inset);
      const former = index.partnership(id, partnerId)?.status === "former";
      const radius = thickness(layout.nodes.get(id)!.generation) * 0.7;
      const pieces = former ? [[0, 0.3], [0.4, 0.6], [0.7, 1]] : [[0, 1]];
      for (const [t0, t1] of pieces) {
        const curve = new THREE.LineCurve3(from.clone().lerp(to, t0), from.clone().lerp(to, t1));
        addPart(taperedTube(curve, radius, radius, 2), [id, partnerId], former ? BARK_FORMER : BARK);
      }
    }
  }

  // Where a child's branch starts: their parents' stick, or a single parent's card.
  const branchStart = (parentIds: string[]) => {
    const fromUnion = parentIds.length === 2 ? unionPoint.get(pairKey(parentIds)) : undefined;
    if (fromUnion) return fromUnion.clone();
    const start = parentIds.map(point).reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(parentIds.length);
    start.y += CARD_HALF_HEIGHT;
    return start;
  };

  const branch = (from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, ids: string[]) => {
    const rise = to.y - from.y;
    const curve = new THREE.CubicBezierCurve3(
      from,
      from.clone().add(new THREE.Vector3(0, rise * 0.55, 0)),
      to.clone().add(new THREE.Vector3(0, -rise * 0.45, 0)),
      to,
    );
    addPart(taperedTube(curve, r0, r1), ids);
    for (const t of [0.45, 0.65, 0.85]) leafSpots.push(curve.getPointAt(t));
  };

  for (const [childId, parentIds] of index.parents) {
    if (!layout.nodes.has(childId)) continue;
    const gen = layout.nodes.get(childId)!.generation;
    const to = point(childId).add(new THREE.Vector3(0, -CARD_HALF_HEIGHT, 0));
    branch(branchStart(parentIds), to, thickness(gen - 1), thickness(gen) * 0.8, [...parentIds, childId]);
  }

  // Trunk and roots, rising from the ground to the root generation.
  const groundY = -layout.levelY(1) * 0.9;
  const trunkTop = new THREE.Vector3(0, -1.4, 0);
  addPart(
    taperedTube(new THREE.LineCurve3(new THREE.Vector3(0, groundY, 0), trunkTop), 1.0, 0.55, 8),
    [],
  );
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const out = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, groundY + 0.8, 0),
      out.clone().multiplyScalar(1.2).setY(groundY + 0.2),
      out.clone().multiplyScalar(2.6).setY(groundY - 0.1),
      out.clone().multiplyScalar(4 + (i % 3)).setY(groundY - 0.3),
    );
    addPart(taperedTube(curve, 0.45, 0.05, 16), []);
  }

  // Root generation: one branch from the trunk to each family unit there.
  for (const unit of layout.units[0] ?? []) {
    const ids = unit.filter((id) => layout.nodes.has(id));
    if (!ids.length) continue;
    const unions = ids
      .slice(1)
      .map((id, i) => unionPoint.get(pairKey([ids[i], id])))
      .filter((p): p is THREE.Vector3 => p !== undefined);
    const targets = unions.length ? unions : [point(ids[0]).add(new THREE.Vector3(0, -CARD_HALF_HEIGHT, 0))];
    for (const target of targets) branch(trunkTop.clone(), target, 0.55, thickness(0), ids);
  }

  // Leaves along the branches.
  const random = seeded(7);
  const leaves = new THREE.InstancedMesh(
    leafGeometry(),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 }),
    leafSpots.length * 3,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const color = new THREE.Color();
  let n = 0;
  for (const spot of leafSpots) {
    for (let k = 0; k < 3; k++) {
      const p = spot.clone().add(new THREE.Vector3(random() - 0.5, random() * 0.4 - 0.2, random() - 0.5).multiplyScalar(0.9));
      e.set(random() * Math.PI, random() * Math.PI * 2, random() * Math.PI);
      const s = 0.22 + random() * 0.18;
      m.compose(p, q.setFromEuler(e), new THREE.Vector3(s, s, s));
      leaves.setMatrixAt(n, m);
      leaves.setColorAt(n, color.setHSL(0.26 + random() * 0.08, 0.55, 0.32 + random() * 0.15));
      n++;
    }
  }
  group.add(leaves);

  return { group, parts, groundY };
}
