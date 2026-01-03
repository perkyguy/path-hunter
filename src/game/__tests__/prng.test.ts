import { describe, expect, it } from "vitest";
import { createPrng } from "../prng";

describe("createPrng", () => {
  it("produces deterministic sequences", () => {
    const a = createPrng("seed");
    const b = createPrng("seed");
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it("stays within bounds for int", () => {
    const rng = createPrng("range");
    for (let i = 0; i < 50; i += 1) {
      const value = rng.int(10);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
    }
  });
});
