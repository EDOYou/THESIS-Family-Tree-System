import { describe, expect, it } from "vitest";
import {
  addChild,
  addParent,
  addPartner,
  addPerson,
  emptySnapshot,
  removePerson,
  unlinkPartners,
  updatePartnership,
  updatePerson,
} from "./edit";

describe("tree edits", () => {
  it("builds a family with two marriages and children from each", () => {
    const tree = emptySnapshot();
    const dad = addPerson(tree, { displayName: "Dad" });
    const first = addPartner(tree, dad, { displayName: "First wife" });
    const second = addPartner(tree, dad, { displayName: "Second wife" });
    updatePartnership(tree, dad, first, { status: "former" });
    const a = addChild(tree, dad, first);
    const me = addChild(tree, dad, second);

    expect(tree.people).toHaveLength(5);
    expect(tree.partnerships.find((p) => p.bId === first)?.status).toBe("former");
    expect(tree.parentLinks.filter((l) => l.childId === a).map((l) => l.parentId).sort()).toEqual([dad, first].sort());
    expect(tree.parentLinks.filter((l) => l.childId === me).map((l) => l.parentId).sort()).toEqual([dad, second].sort());
  });

  it("joins a second parent to the first as partners, and refuses a third", () => {
    const tree = emptySnapshot();
    const kid = addPerson(tree);
    const mum = addParent(tree, kid)!;
    const dad = addParent(tree, kid)!;
    expect(tree.partnerships).toEqual([{ aId: mum, bId: dad }]);
    expect(addParent(tree, kid)).toBeUndefined();
  });

  it("removes a person together with every link to them", () => {
    const tree = emptySnapshot();
    const mum = addPerson(tree);
    const dad = addPartner(tree, mum);
    const kid = addChild(tree, mum, dad);
    removePerson(tree, dad);
    expect(tree.people.map((p) => p.id)).toEqual([mum, kid]);
    expect(tree.partnerships).toEqual([]);
    expect(tree.parentLinks).toEqual([{ parentId: mum, childId: kid }]);
  });

  it("keeps given and family names in step with the display name", () => {
    const tree = emptySnapshot();
    const id = addPerson(tree);
    updatePerson(tree, id, { displayName: "Leyla Aliyeva Hasanova" });
    expect(tree.people[0]).toMatchObject({ givenName: "Leyla", familyName: "Aliyeva Hasanova" });
  });

  it("unlinks a couple without touching their children", () => {
    const tree = emptySnapshot();
    const a = addPerson(tree);
    const b = addPartner(tree, a);
    addChild(tree, a, b);
    unlinkPartners(tree, b, a);
    expect(tree.partnerships).toEqual([]);
    expect(tree.parentLinks).toHaveLength(2);
  });
});
