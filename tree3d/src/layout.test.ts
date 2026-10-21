import { describe, expect, it } from "vitest";
import sample from "./data/sample-family.json";
import { toSnapshot } from "./data/legacy";
import { indexTree, type TreeSnapshot } from "./data/types";
import { assignGenerations, defaultLayoutOptions, familyUnit, layoutTree } from "./layout";

const index = indexTree(toSnapshot(sample));

const tree = (snapshot: Partial<TreeSnapshot>) => indexTree(toSnapshot({ parentLinks: [], partnerships: [], ...snapshot }));
const people = (...ids: string[]) => ids.map((id) => ({ id, displayName: id }));

describe("assignGenerations", () => {
  const gens = assignGenerations(index);

  it("puts the grandparents at the root and children one level above their parents", () => {
    expect(gens.get("arthur")).toBe(0);
    expect(gens.get("margaret")).toBe(0);
    expect(gens.get("peter")).toBe(1);
    expect(gens.get("max")).toBe(2);
    expect(gens.get("ivy")).toBe(3);
  });

  it("keeps partners who married in on their partner's level", () => {
    expect(gens.get("helen")).toBe(gens.get("peter"));
    expect(gens.get("anna")).toBe(gens.get("peter"));
    expect(gens.get("mark")).toBe(gens.get("grace"));
  });

  it("pulls a lone parent up to just below their child", () => {
    const g = assignGenerations(
      tree({
        people: people("a", "b", "c", "d"),
        parentLinks: [
          { parentId: "a", childId: "b" },
          { parentId: "d", childId: "c" },
        ],
        partnerships: [{ aId: "b", bId: "c" }],
      }),
    );
    expect(g.get("d")).toBe(g.get("a"));
  });
});

describe("familyUnit", () => {
  it("puts someone married twice between their two partners, first marriage on the left", () => {
    const unit = familyUnit(index, "anna", () => true);
    expect(unit).toEqual(["helen", "peter", "anna"]);
  });

  it("keeps a single person on their own", () => {
    expect(familyUnit(index, "sarah", () => true)).toEqual(["sarah"]);
  });
});

describe("layoutTree", () => {
  const layout = layoutTree(index);
  const { spacing } = defaultLayoutOptions;
  const arc = (a: string, b: string) => {
    const na = layout.nodes.get(a)!;
    const nb = layout.nodes.get(b)!;
    return (nb.angle - na.angle) * na.radius;
  };

  it("places everyone, root at the bottom and growing upward", () => {
    expect(layout.nodes.size).toBe(index.people.size);
    expect(layout.generations).toBe(4);
    expect(layout.nodes.get("ivy")!.position[1]).toBeGreaterThan(layout.nodes.get("arthur")!.position[1]);
  });

  it("widens the crown towards the top", () => {
    expect(layout.radiusAt(3)).toBeGreaterThan(layout.radiusAt(0));
  });

  it("never overlaps people on the same level", () => {
    for (let g = 0; g < layout.generations; g++) {
      const row = [...layout.nodes.values()].filter((n) => n.generation === g).sort((a, b) => a.angle - b.angle);
      for (let i = 1; i < row.length; i++) {
        expect((row[i].angle - row[i - 1].angle) * row[i].radius).toBeGreaterThanOrEqual(spacing - 1e-9);
      }
    }
  });

  it("seats partners next to each other", () => {
    for (const [a, b] of [["arthur", "margaret"], ["helen", "peter"], ["peter", "anna"], ["grace", "mark"]]) {
      expect(Math.abs(arc(a, b))).toBeCloseTo(spacing);
    }
  });

  it("puts each marriage's children on that marriage's side", () => {
    const first = (layout.nodes.get("max")!.angle + layout.nodes.get("lina")!.angle) / 2;
    const second = (layout.nodes.get("oliver")!.angle + layout.nodes.get("grace")!.angle) / 2;
    expect(first).toBeLessThan(second);
    expect(layout.nodes.get("helen")!.angle).toBeLessThan(layout.nodes.get("anna")!.angle);
  });

  it("keeps every level within the allowed wrap", () => {
    for (const node of layout.nodes.values()) {
      const [x, , z] = node.position;
      expect(Math.hypot(x, z)).toBeCloseTo(node.radius);
      expect(Math.abs(node.angle)).toBeLessThanOrEqual(Math.PI * defaultLayoutOptions.maxWrap + 1e-9);
    }
  });

  it("copes with a single person", () => {
    const solo = layoutTree(tree({ people: people("only") }));
    expect(solo.nodes.get("only")!.position).toEqual([0, 0, defaultLayoutOptions.minTopRadius]);
  });
});
