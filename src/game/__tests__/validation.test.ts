import { describe, expect, it } from "vitest";
import { canExtendPath, isSolved } from "../validation";
import { Puzzle } from "../types";

const puzzle: Puzzle = {
  seed: "validate",
  size: 2,
  waypointCount: 3,
  path: [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 1, col: 0 }
  ],
  waypoints: [
    { number: 1, cell: { row: 0, col: 0 } },
    { number: 2, cell: { row: 0, col: 1 } },
    { number: 3, cell: { row: 1, col: 0 } }
  ],
  waypointMap: new Map<string, number>([
    ["0,0", 1],
    ["0,1", 2],
    ["1,0", 3]
  ])
};

const start = { row: 0, col: 0 };
const pathWithStart = [start];
const diagonal = { row: 1, col: 1 };
const futureNumberCell = { row: 1, col: 0 };

describe("validation", () => {
  it("rejects diagonal moves", () => {
    expect(canExtendPath(pathWithStart, diagonal, puzzle)).toBe(false);
  });

  it("rejects revisiting a cell", () => {
    expect(canExtendPath(pathWithStart, start, puzzle)).toBe(false);
  });

  it("rejects stepping on a future number", () => {
    expect(canExtendPath(pathWithStart, futureNumberCell, puzzle)).toBe(false);
  });

  it("requires ending on the final number to solve", () => {
    const notEndingOnFinal: Puzzle = {
      ...puzzle,
      size: 2,
      waypointCount: 3,
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 1 },
        { row: 1, col: 0 }
      ],
      waypoints: [
        { number: 1, cell: { row: 0, col: 0 } },
        { number: 2, cell: { row: 0, col: 1 } },
        { number: 3, cell: { row: 1, col: 1 } }
      ],
      waypointMap: new Map<string, number>([
        ["0,0", 1],
        ["0,1", 2],
        ["1,1", 3]
      ])
    };
    expect(isSolved(notEndingOnFinal.path, notEndingOnFinal)).toBe(false);
  });
});
