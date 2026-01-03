import { Cell, Difficulty, Puzzle, Waypoint, cellKey } from "./types";
import { PRNG, createPrng } from "./prng";

const difficultyConfig: Record<Difficulty, { waypoints: number; minGap: number }> = {
  easy: { waypoints: 6, minGap: 4 },
  medium: { waypoints: 8, minGap: 3 },
  hard: { waypoints: 10, minGap: 2 }
};

const neighborsOf = (cell: Cell, size: number): Cell[] => {
  const deltas = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
  ];
  return deltas
    .map((delta) => ({ row: cell.row + delta.row, col: cell.col + delta.col }))
    .filter((next) => next.row >= 0 && next.row < size && next.col >= 0 && next.col < size);
};

const generateHamiltonianPath = (size: number, rng: PRNG): Cell[] => {
  const total = size * size;
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const start = { row: rng.int(size), col: rng.int(size) };
    const path: Cell[] = [start];
    const visited = new Set<string>([cellKey(start)]);

    const step = (): boolean => {
      if (path.length === total) return true;
      const current = path[path.length - 1];
      const candidates = neighborsOf(current, size).filter(
        (cell) => !visited.has(cellKey(cell))
      );

      const ordered = candidates
        .map((cell) => ({
          cell,
          degree: neighborsOf(cell, size).filter((next) => !visited.has(cellKey(next))).length
        }))
        .sort((a, b) => (a.degree - b.degree) || (rng.next() - 0.5));

      for (const { cell } of ordered) {
        visited.add(cellKey(cell));
        path.push(cell);
        if (step()) return true;
        path.pop();
        visited.delete(cellKey(cell));
      }
      return false;
    };

    if (step()) {
      return path;
    }
  }

  throw new Error("Unable to generate Hamiltonian path");
};

const rotateCell = (cell: Cell, size: number, rotation: number): Cell => {
  const { row, col } = cell;
  if (rotation === 0) return cell;
  if (rotation === 90) return { row: col, col: size - 1 - row };
  if (rotation === 180) return { row: size - 1 - row, col: size - 1 - col };
  return { row: size - 1 - col, col: row };
};

const transformPath = (cells: Cell[], size: number, rng: PRNG): Cell[] => {
  const rotation = [0, 90, 180, 270][rng.int(4)];
  const flip = rng.next() > 0.5;
  return cells.map((cell) => {
    const rotated = rotateCell(cell, size, rotation);
    return flip
      ? { row: rotated.row, col: size - 1 - rotated.col }
      : rotated;
  });
};

const randomSplit = (total: number, parts: number, minGap: number, rng: PRNG): number[] => {
  const minimum = parts * minGap;
  if (minimum > total) {
    const adjusted = Math.max(1, Math.floor(total / parts));
    return randomSplit(total, parts, adjusted, rng);
  }
  const gaps = Array.from({ length: parts }, () => minGap);
  let remaining = total - minimum;
  while (remaining > 0) {
    const idx = rng.int(parts);
    gaps[idx] += 1;
    remaining -= 1;
  }
  return gaps;
};

const pickWaypointIndices = (
  pathLength: number,
  count: number,
  minGap: number,
  rng: PRNG
): number[] => {
  if (count <= 1) return [0];
  const total = pathLength - 1;
  const interiorCount = count - 2;
  if (interiorCount <= 0) return [0, total];

  const maxGap = Math.max(1, Math.floor(total / (interiorCount + 1)));
  const effectiveGap = Math.min(minGap, maxGap);
  const gaps = randomSplit(total, interiorCount + 1, effectiveGap, rng);
  const indices = [0];
  let cursor = 0;
  for (let i = 0; i < gaps.length; i += 1) {
    cursor += gaps[i];
    if (i < gaps.length - 1) {
      indices.push(cursor);
    }
  }
  indices.push(total);
  return indices;
};

export const generatePuzzle = (
  seed: string,
  size: number,
  difficulty: Difficulty
): Puzzle => {
  const rng = createPrng(seed);
  const config = difficultyConfig[difficulty];
  const base = transformPath(generateHamiltonianPath(size, rng), size, rng);
  const path = rng.next() > 0.5 ? base.slice().reverse() : base;
  const indices = pickWaypointIndices(path.length, config.waypoints, config.minGap, rng);
  const waypoints: Waypoint[] = indices.map((index, idx) => ({
    number: idx + 1,
    cell: path[index]
  }));

  const waypointMap = new Map<string, number>();
  waypoints.forEach((point) => {
    waypointMap.set(cellKey(point.cell), point.number);
  });

  return {
    seed,
    size,
    waypointCount: config.waypoints,
    path,
    waypoints,
    waypointMap
  };
};

export const validatePuzzle = (puzzle: Puzzle): boolean => {
  const { size, path, waypointCount, waypointMap } = puzzle;
  const occupied = new Set<string>();
  const withinBounds = (cell: Cell) =>
    cell.row >= 0 && cell.row < size && cell.col >= 0 && cell.col < size;
  if (path.length !== size * size) return false;
  let expected = 1;
  for (let i = 0; i < path.length; i += 1) {
    const cell = path[i];
    if (!withinBounds(cell)) return false;
    const key = cellKey(cell);
    if (occupied.has(key)) return false;
    occupied.add(key);
    if (i > 0) {
      const prev = path[i - 1];
      const manhattan = Math.abs(prev.row - cell.row) + Math.abs(prev.col - cell.col);
      if (manhattan !== 1) return false;
    }
    const number = waypointMap.get(key);
    if (number !== undefined) {
      if (number !== expected) return false;
      expected += 1;
    }
  }
  return expected === waypointCount + 1;
};
