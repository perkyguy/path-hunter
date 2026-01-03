import { useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle } from "./game/generator";
import {
  Cell,
  Difficulty,
  Mode,
  PlayerState,
  cellKey
} from "./game/types";
import { clearPlayerState, loadDailyStats, loadPlayerState, saveDailyStats, savePlayerState } from "./game/storage";
import { canExtendPath, getNextExpectedNumber, isAdjacent, isSolved } from "./game/validation";

const GRID_SIZE = 6;
const HINTS_PER_PUZZLE = 3;

const todaySeed = () => new Date().toISOString().slice(0, 10);

const randomSeed = () => {
  if ("crypto" in window && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildEmptyPlayerState = (seedValue: string, difficultyValue: Difficulty): PlayerState => ({
  seed: seedValue,
  difficulty: difficultyValue,
  path: [],
  moves: 0,
  hintsUsed: 0
});

const stateKey = (mode: Mode, difficulty: Difficulty, seed: string) =>
  `${mode}:${difficulty}:${seed}`;

const buzz = (duration = 10) => {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
};

const samePath = (a: Cell[], b: Cell[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (cellKey(a[i]) !== cellKey(b[i])) return false;
  }
  return true;
};

export default function App() {
  const [mode, setMode] = useState<Mode>("daily");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [seed, setSeed] = useState<string>(todaySeed());
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(seed, GRID_SIZE, difficulty));
  const [player, setPlayer] = useState<PlayerState>(() => {
    const saved = loadPlayerState(stateKey("daily", "easy", todaySeed()));
    return saved ?? buildEmptyPlayerState(todaySeed(), "easy");
  });
  const [drawingPath, setDrawingPath] = useState<Cell[] | null>(null);
  const [hintCells, setHintCells] = useState<Set<string>>(new Set());
  const [highlightNumber, setHighlightNumber] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [dailyStats, setDailyStats] = useState(loadDailyStats());
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nextSeed = mode === "daily" ? todaySeed() : randomSeed();
    const nextPuzzle = generatePuzzle(nextSeed, GRID_SIZE, difficulty);
    const saved = loadPlayerState(stateKey(mode, difficulty, nextSeed));
    setPuzzle(nextPuzzle);
    setSeed(nextSeed);
    setPlayer(saved ?? buildEmptyPlayerState(nextSeed, difficulty));
    setHintCells(new Set());
    setHighlightNumber(null);
    setDrawingPath(null);
  }, [mode, difficulty]);

  useEffect(() => {
    savePlayerState(stateKey(mode, difficulty, seed), player);
  }, [mode, difficulty, seed, player]);

  useEffect(() => {
    const handlePointerUp = () => {
      if (drawingPath) {
        setPlayer((prev) => {
          if (samePath(prev.path, drawingPath)) {
            return prev;
          }
          const shouldCountMove = drawingPath.length < prev.path.length;
          return {
            ...prev,
            path: drawingPath,
            moves: shouldCountMove ? prev.moves + 1 : prev.moves
          };
        });
        setDrawingPath(null);
        buzz();
      }
    };
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [drawingPath]);

  const activePath = drawingPath ?? player.path;

  const occupancy = useMemo(() => {
    const map = new Set<string>();
    for (const cell of activePath) {
      map.add(cellKey(cell));
    }
    return map;
  }, [activePath]);

  const indexMap = useMemo(() => {
    const map = new Map<string, number>();
    activePath.forEach((cell, index) => {
      map.set(cellKey(cell), index);
    });
    return map;
  }, [activePath]);

  const solved = useMemo(() => isSolved(player.path, puzzle), [player.path, puzzle]);

  useEffect(() => {
    if (!solved || mode !== "daily") return;
    const today = todaySeed();
    if (dailyStats.lastSolvedDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const nextStreak = dailyStats.lastSolvedDate === yesterdayStr ? dailyStats.streak + 1 : 1;
    const nextStats = { lastSolvedDate: today, streak: nextStreak };
    setDailyStats(nextStats);
    saveDailyStats(nextStats);
  }, [dailyStats, mode, solved]);

  const startNewPuzzle = () => {
    if (mode === "daily") {
      clearPlayerState(stateKey(mode, difficulty, seed));
      setPlayer(buildEmptyPlayerState(seed, difficulty));
      setHintCells(new Set());
      setHighlightNumber(null);
      setDrawingPath(null);
      return;
    }
    const nextSeed = randomSeed();
    const nextPuzzle = generatePuzzle(nextSeed, GRID_SIZE, difficulty);
    setSeed(nextSeed);
    setPuzzle(nextPuzzle);
    setPlayer(buildEmptyPlayerState(nextSeed, difficulty));
    setHintCells(new Set());
    setHighlightNumber(null);
    setDrawingPath(null);
  };

  const resetPuzzle = () => {
    setPlayer((prev) => ({
      ...prev,
      path: [],
      moves: 0
    }));
    setHintCells(new Set());
    setHighlightNumber(null);
    setDrawingPath(null);
  };

  const handlePointerDown = (cell: Cell) => {
    const key = cellKey(cell);
    const existingIndex = activePath.findIndex((step) => cellKey(step) === key);
    if (existingIndex >= 0) {
      setDrawingPath(activePath.slice(0, existingIndex + 1));
      return;
    }
    if (activePath.length === 0) {
      const number = puzzle.waypointMap.get(key);
      if (number === 1) {
        setDrawingPath([cell]);
      }
      return;
    }
    if (canExtendPath(activePath, cell, puzzle)) {
      setDrawingPath([...activePath, cell]);
      return;
    }
    const last = activePath[activePath.length - 1];
    if (cellKey(last) === key) {
      setDrawingPath(activePath);
    }
  };

  const handlePointerEnter = (cell: Cell) => {
    if (!drawingPath) return;
    const last = drawingPath[drawingPath.length - 1];
    if (cellKey(cell) === cellKey(last)) return;
    if (!isAdjacent(cell, last)) return;

    const existingIndex = drawingPath.findIndex((step) => cellKey(step) === cellKey(cell));
    if (existingIndex >= 0) {
      if (existingIndex === drawingPath.length - 2) {
        setDrawingPath(drawingPath.slice(0, existingIndex + 1));
      }
      return;
    }

    if (!canExtendPath(drawingPath, cell, puzzle)) return;
    setDrawingPath([...drawingPath, cell]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drawingPath) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cellElement = element?.closest<HTMLButtonElement>("[data-cell]");
    if (!cellElement) return;
    const row = Number(cellElement.dataset.row);
    const col = Number(cellElement.dataset.col);
    if (Number.isNaN(row) || Number.isNaN(col)) return;
    handlePointerEnter({ row, col });
  };

  const hintsLeft = Math.max(0, HINTS_PER_PUZZLE - player.hintsUsed);

  const handleHint = () => {
    if (hintsLeft <= 0) return;
    const nextExpected = getNextExpectedNumber(player.path, puzzle) ?? 1;
    setHighlightNumber(nextExpected <= puzzle.waypointCount ? nextExpected : null);
    const nextCell = puzzle.path[player.path.length];
    if (nextCell) {
      setHintCells((prev) => new Set(prev).add(cellKey(nextCell)));
    }

    setPlayer((prev) => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1
    }));
    buzz(12);
  };

  const handleShare = async () => {
    const tag = mode === "daily" ? `Daily ${todaySeed()}` : "Random";
    const text = `Path Hunter ${tag} • Moves ${player.moves} • Hints ${player.hintsUsed} • ${solved ? "Solved" : "In progress"}`;
    try {
      await navigator.clipboard.writeText(text);
      buzz(15);
    } catch {
      // Ignore clipboard errors silently.
    }
  };

  const renderGrid = () => {
    const size = puzzle.size;
    const cells = [];
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const cell = { row, col };
        const key = cellKey(cell);
        const number = puzzle.waypointMap.get(key) ?? null;
        const occupied = occupancy.has(key);
        const index = indexMap.get(key);
        const progress = index !== undefined && activePath.length > 1
          ? index / (activePath.length - 1)
          : 0;
        const isHint = hintCells.has(key);
        const highlight = highlightNumber !== null && number === highlightNumber;
        const isHead = index === activePath.length - 1 && activePath.length > 0;
        const isTail = index === 0 && activePath.length > 0;
        const prevCell = index !== undefined && index > 0 ? activePath[index - 1] : null;
        const nextCell =
          index !== undefined && index < activePath.length - 1 ? activePath[index + 1] : null;
        const connectsUp =
          (prevCell && prevCell.row === row - 1 && prevCell.col === col) ||
          (nextCell && nextCell.row === row - 1 && nextCell.col === col);
        const connectsDown =
          (prevCell && prevCell.row === row + 1 && prevCell.col === col) ||
          (nextCell && nextCell.row === row + 1 && nextCell.col === col);
        const connectsLeft =
          (prevCell && prevCell.row === row && prevCell.col === col - 1) ||
          (nextCell && nextCell.row === row && nextCell.col === col - 1);
        const connectsRight =
          (prevCell && prevCell.row === row && prevCell.col === col + 1) ||
          (nextCell && nextCell.row === row && nextCell.col === col + 1);
        const pathColor = `hsl(28 90% ${45 + progress * 20}%)`;

        cells.push(
          <button
            key={key}
            type="button"
            className={`cell ${number !== null ? "endpoint" : ""} ${occupied ? "filled" : ""} ${highlight ? "highlight" : ""} ${isHead ? "head" : ""} ${isTail ? "tail" : ""}`}
            style={{
              ["--path-color" as never]: pathColor
            }}
            data-cell="true"
            data-row={row}
            data-col={col}
            onPointerDown={(event) => {
              event.preventDefault();
              handlePointerDown(cell);
            }}
            onPointerEnter={() => handlePointerEnter(cell)}
          >
            {occupied && (
              <>
                {connectsUp && <span className="path-link up" />}
                {connectsDown && <span className="path-link down" />}
                {connectsLeft && <span className="path-link left" />}
                {connectsRight && <span className="path-link right" />}
                <span className="path-node" />
              </>
            )}
            {number !== null && <span className="number">{number}</span>}
            {isHint && <span className="hint-dot" />}
          </button>
        );
      }
    }
    return cells;
  };

  return (
    <div className="app">
      <header className="top-bar">
        <div className="brand">
          <div className="logo">PH</div>
          <div>
            <div className="title">Path Hunter</div>
            <div className="subtitle">
              {mode === "daily" ? `Daily ${todaySeed()}` : "Random"} · {difficulty}
            </div>
          </div>
        </div>
        <div className="stats">
          <div>Moves: {player.moves}</div>
          <div>Hints: {player.hintsUsed}/{HINTS_PER_PUZZLE}</div>
          {mode === "daily" && <div>Streak: {dailyStats.streak}</div>}
        </div>
      </header>

      <section className="controls">
        <div className="control-group">
          <button
            type="button"
            className={mode === "daily" ? "active" : ""}
            onClick={() => setMode("daily")}
          >
            Daily
          </button>
          <button
            type="button"
            className={mode === "random" ? "active" : ""}
            onClick={() => setMode("random")}
          >
            Random
          </button>
        </div>
        <div className="control-group">
          {(["easy", "medium", "hard"] as Difficulty[]).map((level) => (
            <button
              key={level}
              type="button"
              className={difficulty === level ? "active" : ""}
              onClick={() => setDifficulty(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="control-group">
          <button type="button" onClick={startNewPuzzle}>New</button>
          <button type="button" onClick={resetPuzzle}>Reset</button>
          <button type="button" onClick={handleHint}>Hint</button>
        </div>
        <div className="control-group">
          <button type="button" onClick={handleShare}>Share</button>
          <button type="button" onClick={() => setShowHelp(true)}>Help</button>
        </div>
      </section>

      <main className="board-wrap">
        <div
          className={`board ${solved ? "solved" : ""}`}
          ref={gridRef}
          onPointerMove={handlePointerMove}
          style={{
            gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`
          }}
        >
          {renderGrid()}
        </div>
        {solved && (
          <div className="solved-banner">Trail complete! Nice work.</div>
        )}
      </main>

      {showHelp && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>How to Play</h2>
            <p>
              Draw one continuous path that starts at 1 and visits every numbered waypoint in
              order. Every cell must be used exactly once, with no diagonals or revisits.
            </p>
            <ul>
              <li>Drag from the 1 tile to extend the trail one cell at a time.</li>
              <li>Drag backward to undo the last step.</li>
              <li>Tap any occupied cell to rewind the trail to that point.</li>
              <li>Hints reveal a future trail cell or highlight the next number.</li>
            </ul>
            <button type="button" onClick={() => setShowHelp(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
