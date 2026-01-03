export type Cell = {
  row: number;
  col: number;
};

export type Waypoint = {
  number: number;
  cell: Cell;
};

export type Puzzle = {
  seed: string;
  size: number;
  waypointCount: number;
  path: Cell[];
  waypoints: Waypoint[];
  waypointMap: Map<string, number>;
};

export type Difficulty = "easy" | "medium" | "hard";

export type Mode = "daily" | "random";

export type PlayerState = {
  seed: string;
  difficulty: Difficulty;
  path: Cell[];
  moves: number;
  hintsUsed: number;
  elapsedSeconds: number;
  timerStartMs: number | null;
};

export type DailyStats = {
  lastSolvedDate: string | null;
  streak: number;
};

export const cellKey = (cell: Cell) => `${cell.row},${cell.col}`;

export const parseCellKey = (key: string): Cell => {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
};
