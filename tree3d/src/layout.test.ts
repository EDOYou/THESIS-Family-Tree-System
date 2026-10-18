import { describe, expect, it } from "vitest";
import sample from "./data/sample-family.json";
import { toSnapshot } from "./data/legacy";
import { indexTree } from "./data/types";
import { assignGenerations, defaultLayoutOptions, layoutTree } from "./layout";

const index = indexTree(toSnapshot(sample));

describe("assignGenerations", () => {
  const gens = assignGenerations(index);

  it("puts children one level below their parents", () => {
    expect(gens.get("walter")).toBe(0);
    expect(gens.get("margaret")).toBe(1);
    expect(gens.get("thomas")).toBe(2);
    expect(gens.get("james")).toBe(3);
    expect(gens.get("leo")).toBe(4);
  });

  it("keeps partners who married in on their partner's level", () => {
    expect(gens.get("arthur")).toBe(gens.get("margaret"));
    expect(gens.get("mark")).toBe(gens.get("grace"));
  });

  it("pulls a lone parent down to just above their child", () => {
    const solo = indexTree(
      toSnapshot({
        people: [
          { id: "a", displayName: "A" },
          { id: "b", displayName: "B" },
          { id: "c", displayName: "C" },
          { id: "d", displayName: "D" },
        ],
        parentLinks: [
          { parentId: "a", childId: "b" },
          { parentId: "d", childId: "c" },
        ],
        partnerships: [{ aId: "b", bId: "c" }],
      }),
    );
    const g = assignGenerations(solo);
    expect(g.get("d")).toBe(g.get("a"));
  });
});

describe("layoutTree", () => {
  const layout = layoutTree(index);
  const { spacing } = defaultLayoutOptions;

  it("places everyone", () => {
    expect(layout.nodes.size).toBe(index.people.size);
    expect(layout.generations).toBe(5);
  });

  it("never overlaps people on the same level", () => {
    for (let g = 0; g < layout.generations; g++) {
      const xs = [...layout.nodes.values()].filter((n) => n.generation === g).map((n) => n.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(spacing - 1e-9);
    }
  });

  it("seats partners next to each other", () => {
    for (const [a, b] of [["arthur", "margaret"], ["peter", "anna"], ["grace", "mark"]]) {
      expect(Math.abs(layout.nodes.get(a)!.x - layout.nodes.get(b)!.x)).toBeCloseTo(spacing);
    }
  });

  it("keeps the tree on a cylinder that does not wrap all the way round", () => {
    for (const node of layout.nodes.values()) {
      const [x, , z] = node.position;
      expect(Math.hypot(x, z)).toBeCloseTo(layout.radius);
      expect(Math.abs(node.angle)).toBeLessThanOrEqual(Math.PI * defaultLayoutOptions.maxWrap + 1e-9);
    }
  });
});
