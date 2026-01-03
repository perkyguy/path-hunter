import { DailyStats, PlayerState } from "./types";

const STATE_PREFIX = "path-hunter-state";
const STATS_KEY = "path-hunter-daily-stats";

export const loadPlayerState = (key: string): PlayerState | null => {
  const raw = localStorage.getItem(`${STATE_PREFIX}:${key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PlayerState;
    if (
      !Array.isArray(parsed.path) ||
      typeof parsed.seed !== "string" ||
      typeof parsed.elapsedSeconds !== "number" ||
      (parsed.timerStartMs !== null && typeof parsed.timerStartMs !== "number") ||
      typeof parsed.isPaused !== "boolean"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const savePlayerState = (key: string, state: PlayerState) => {
  localStorage.setItem(`${STATE_PREFIX}:${key}`, JSON.stringify(state));
};

export const clearPlayerState = (key: string) => {
  localStorage.removeItem(`${STATE_PREFIX}:${key}`);
};

export const loadDailyStats = (): DailyStats => {
  const raw = localStorage.getItem(STATS_KEY);
  if (!raw) {
    return { lastSolvedDate: null, streak: 0 };
  }
  try {
    return JSON.parse(raw) as DailyStats;
  } catch {
    return { lastSolvedDate: null, streak: 0 };
  }
};

export const saveDailyStats = (stats: DailyStats) => {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};
