import { describe, expect, it } from "vitest";
import { generatePuzzle, validatePuzzle } from "../generator";

const seeds = ["alpha", "beta", "2024-01-01"];

describe("generatePuzzle", () => {
  it("creates valid puzzles across difficulties", () => {
    for (const seed of seeds) {
      for (const difficulty of ["easy", "medium", "hard"] as const) {
        const puzzle = generatePuzzle(seed, 6, difficulty);
        expect(validatePuzzle(puzzle)).toBe(true);
        expect(puzzle.path).toHaveLength(36);
        expect(puzzle.waypoints).toHaveLength(puzzle.waypointCount);
        expect(puzzle.waypoints[0].number).toBe(1);
        expect(puzzle.waypoints[puzzle.waypoints.length - 1].number).toBe(puzzle.waypointCount);
      }
    }
  });
});
