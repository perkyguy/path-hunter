import { Cell, Puzzle, cellKey } from "./types";

export const isAdjacent = (a: Cell, b: Cell) =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;

export const getNextExpectedNumber = (
  path: Cell[],
  puzzle: Puzzle
): number | null => {
  let expected = 1;
  const visited = new Set<string>();
  for (const cell of path) {
    const key = cellKey(cell);
    if (visited.has(key)) return null;
    visited.add(key);
    const number = puzzle.waypointMap.get(key);
    if (number !== undefined) {
      if (number !== expected) return null;
      expected += 1;
    }
  }
  return expected;
};

export const canExtendPath = (
  path: Cell[],
  next: Cell,
  puzzle: Puzzle
): boolean => {
  const nextExpected = getNextExpectedNumber(path, puzzle);
  if (nextExpected === null) return false;
  const nextKey = cellKey(next);
  if (path.some((cell) => cellKey(cell) === nextKey)) return false;
  const number = puzzle.waypointMap.get(nextKey);
  if (path.length === 0) {
    return number === 1;
  }
  const last = path[path.length - 1];
  if (!isAdjacent(last, next)) return false;
  if (number !== undefined && number !== nextExpected) return false;
  return true;
};

export const validatePath = (path: Cell[], puzzle: Puzzle): boolean => {
  if (path.length === 0) return false;
  const firstKey = cellKey(path[0]);
  if (puzzle.waypointMap.get(firstKey) !== 1) return false;
  const visited = new Set<string>();
  let expected = 1;
  for (let i = 0; i < path.length; i += 1) {
    const cell = path[i];
    const key = cellKey(cell);
    if (visited.has(key)) return false;
    visited.add(key);
    if (i > 0 && !isAdjacent(path[i - 1], cell)) return false;
    const number = puzzle.waypointMap.get(key);
    if (number !== undefined) {
      if (number !== expected) return false;
      expected += 1;
    }
  }
  return true;
};

export const isSolved = (path: Cell[], puzzle: Puzzle): boolean => {
  if (path.length !== puzzle.size * puzzle.size) return false;
  if (!validatePath(path, puzzle)) return false;
  const lastKey = cellKey(path[path.length - 1]);
  if (puzzle.waypointMap.get(lastKey) !== puzzle.waypointCount) return false;
  const nextExpected = getNextExpectedNumber(path, puzzle);
  return nextExpected === puzzle.waypointCount + 1;
};
