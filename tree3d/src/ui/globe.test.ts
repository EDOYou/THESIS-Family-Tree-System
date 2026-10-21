import { describe, expect, it } from "vitest";
import { latLngToVector } from "./globe";

describe("latLngToVector", () => {
  it("maps the poles and the prime meridian", () => {
    expect(latLngToVector(90, 0).y).toBeCloseTo(1);
    expect(latLngToVector(-90, 0).y).toBeCloseTo(-1);
    const greenwich = latLngToVector(0, 0);
    // three.js puts the middle of an equirectangular texture (longitude 0) on +x.
    expect(greenwich.x).toBeCloseTo(1);
    expect(greenwich.z).toBeCloseTo(0);
    expect(latLngToVector(0, 90).z).toBeCloseTo(-1);
  });
});
