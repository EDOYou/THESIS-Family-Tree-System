import { describe, expect, it } from "vitest";
import { fromLegacy, toSnapshot } from "./legacy";

describe("fromLegacy", () => {
  const snapshot = fromLegacy([
    { id: "dad", name: "John Smith", gender: "M", birthDate: "1950", spouses: ["mum"], children: ["kid"] },
    { id: "mum", name: "Jane Smith", gender: "F", birthDate: " ", spouses: ["dad"] },
    { id: "kid", name: "Sam Smith", fatherId: "dad", motherId: "mum", avatar: "data:image/png;base64,xyz" },
    { id: "lost", name: "", fatherId: "missing", spouses: ["also-missing"] },
  ]);

  it("merges redundant parent links and keeps both parents", () => {
    const kidParents = snapshot.parentLinks.filter((l) => l.childId === "kid").map((l) => l.parentId).sort();
    expect(kidParents).toEqual(["dad", "mum"]);
    expect(snapshot.parentLinks).toHaveLength(2);
  });

  it("records each partnership once and drops links to unknown people", () => {
    expect(snapshot.partnerships).toHaveLength(1);
    expect(snapshot.parentLinks.some((l) => l.parentId === "missing")).toBe(false);
  });

  it("maps names, blank fields and avatars", () => {
    const [dad, mum, kid, lost] = snapshot.people;
    expect(dad).toMatchObject({ givenName: "John", familyName: "Smith", birth: { date: "1950" } });
    expect(mum.birth).toBeUndefined();
    expect(kid.photoUrl).toBe("data:image/png;base64,xyz");
    expect(lost.displayName).toBe("Unknown");
  });
});

describe("toSnapshot", () => {
  it("passes snapshots through and rejects anything else", () => {
    expect(toSnapshot({ people: [] }).parentLinks).toEqual([]);
    expect(() => toSnapshot({ nope: true })).toThrow();
  });
});
