import { LevelData, CellState, TargetMark, CellCoord } from './types';

export class HintEngine {
  /**
   * Cat Hint:
   * Finds the next unrevealed cat position directly from the solution.
   */
  static findNextCat(board: CellState[][], level: LevelData): TargetMark | null {
    const size = level.size;
    for (let r = 0; r < size; r++) {
      const correctCol = level.solution[r];
      if (correctCol !== undefined && board[r][correctCol] !== 2) {
        return { r, c: correctCol, mark: 'cat' };
      }
    }
    return null;
  }

  /**
   * Cross Hint:
   * Auto-crosses up to `maxCount` (default 3) non-cat boxes.
   *
   * Logic:
   * - Only crosses empty boxes (board[r][c] === 0) that are NOT the cat (level.solution[r] !== c).
   * - Never crosses a cat cell!
   * - If there are only 3 boxes left in a unit/board (1 cat, 2 non-cat), crosses at most 2.
   * - If there are only 2 boxes left (1 cat, 1 non-cat), crosses 1.
   * - If there is only 1 box left (the cat), crosses 0.
   *
   * Priority:
   * 1. Obvious exclusions from already placed/revealed cats (same row, col, region, 8 neighbors).
   * 2. Units (regions) with fewest candidates left (crossing non-cats isolates the cat!).
   * 3. Any other non-cat empty boxes.
   */
  static findBoxesToCross(board: CellState[][], level: LevelData, maxCount: number = 3): CellCoord[] {
    const size = level.size;
    const targets: CellCoord[] = [];
    const targetSet = new Set<string>();

    // 1. First Priority: Obvious invalid cells around already placed/revealed cats (state 2)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 2) {
          const reg = level.regionMap[r][c];

          // 8 adjacent neighbors (including diagonals)
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < size && nc >= 0 && nc < size && (dr !== 0 || dc !== 0)) {
                if (board[nr][nc] === 0 && level.solution[nr] !== nc) {
                  const key = `${nr},${nc}`;
                  if (!targetSet.has(key)) {
                    targetSet.add(key);
                    targets.push({ r: nr, c: nc });
                    if (targets.length >= maxCount) return targets;
                  }
                }
              }
            }
          }

          // Same row
          for (let col = 0; col < size; col++) {
            if (col !== c && board[r][col] === 0 && level.solution[r] !== col) {
              const key = `${r},${col}`;
              if (!targetSet.has(key)) {
                targetSet.add(key);
                targets.push({ r, c: col });
                if (targets.length >= maxCount) return targets;
              }
            }
          }

          // Same col
          for (let row = 0; row < size; row++) {
            if (row !== r && board[row][c] === 0 && level.solution[row] !== c) {
              const key = `${row},${c}`;
              if (!targetSet.has(key)) {
                targetSet.add(key);
                targets.push({ r: row, c });
                if (targets.length >= maxCount) return targets;
              }
            }
          }

          // Same color region
          for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
              if ((row !== r || col !== c) && level.regionMap[row][col] === reg && board[row][col] === 0 && level.solution[row] !== col) {
                const key = `${row},${col}`;
                if (!targetSet.has(key)) {
                  targetSet.add(key);
                  targets.push({ r: row, c: col });
                  if (targets.length >= maxCount) return targets;
                }
              }
            }
          }
        }
      }
    }

    // 2. Second Priority: Regions with fewest remaining empty cells
    const regionEmptyCells: { reg: number; cells: CellCoord[] }[] = [];
    for (let reg = 0; reg < size; reg++) {
      const cells: CellCoord[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (level.regionMap[r][c] === reg && board[r][c] === 0) {
            cells.push({ r, c });
          }
        }
      }
      if (cells.length > 0) {
        regionEmptyCells.push({ reg, cells });
      }
    }

    // Sort regions by fewest empty cells
    regionEmptyCells.sort((a, b) => a.cells.length - b.cells.length);

    for (const group of regionEmptyCells) {
      for (const cell of group.cells) {
        if (level.solution[cell.r] !== cell.c) {
          const key = `${cell.r},${cell.c}`;
          if (!targetSet.has(key)) {
            targetSet.add(key);
            targets.push(cell);
            if (targets.length >= maxCount) return targets;
          }
        }
      }
    }

    // 3. Third Priority: Any other empty non-cat cells
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === 0 && level.solution[r] !== c) {
          const key = `${r},${c}`;
          if (!targetSet.has(key)) {
            targetSet.add(key);
            targets.push({ r, c });
            if (targets.length >= maxCount) return targets;
          }
        }
      }
    }

    return targets;
  }

  // Alias for compatibility
  static findAutoCrosses(board: CellState[][], level: LevelData): TargetMark[] {
    return HintEngine.findBoxesToCross(board, level, 3).map(pt => ({
      r: pt.r,
      c: pt.c,
      mark: 'cross',
    }));
  }
}
