// Box states: 0 = empty, 1 = crossed, 2 = revealed (cat)
export type CellState = 0 | 1 | 2;

export const CELL_STATE = {
  EMPTY: 0 as CellState,
  CROSSED: 1 as CellState,
  REVEALED: 2 as CellState,
} as const;
export interface LevelData {
  id?: number;
  size: number;
  seed: number;
  regionMap: number[][]; // size x size, region index for each cell
  solution: number[]; // size length array: solution[row] = col of the cat
  r?: number; // rank/tier (1..5)
  steps?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  r4?: number;
  r5?: number;
  _pid_h?: string;
  _pid_s?: number[];
  isChainedStrategy?: boolean;
  bankName?: string;
  bankIndex?: number;
  transform?: number; // 0..7 rotation/reflection
}

export type CellCoord = { r: number; c: number };

export interface TargetMark {
  r: number;
  c: number;
  mark: 'cross' | 'cat';
}

export interface LogicHint {
  strategy: 'R1_single' | 'R2_confinement' | 'R3_subset' | 'cat_placement';
  title: string;
  description: string; // e.g. "Orange candidates all in row 1 — exclude other colors"
  colorName?: string;
  highlightCells: CellCoord[]; // cells to highlight (e.g. orange region in row 1)
  targetMarks: TargetMark[];   // cells to mark when "Apply" is clicked
}

export interface BankManifestEntry {
  type: string;
  count: number;
  tiers?: Record<string, number>;
}

export interface DayProgress {
  dayLabel: string; // e.g. 'WED', 'THU'
  date: string; // 'YYYY-MM-DD'
  checked: boolean;
  isToday: boolean;
}

export interface StreakData {
  checked_in_today: boolean;
  current_streak: number;
  best_streak: number;
  week_days: DayProgress[];
}

export interface UserProfile {
  id: number;
  telegram_id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  country_code?: string;
  current_level: number;
  fish_balance: number;
  cat_hints: number;
  cross_hints: number;
  daily_streak?: number;
  current_streak?: number;
  best_streak?: number;
  checked_in_today?: boolean;
  week_days?: DayProgress[];
  tutorial_completed?: boolean;
  is_new?: boolean;
  avatar_id?: number;
  frame_id?: number;
  display_name?: string;
  unlocked_avatars?: number[];
  unlocked_frames?: number[];
}

export interface ShopBundle {
  id: string;
  item_type: 'cat_hint' | 'cross_hint';
  quantity: number;
  star_price: number;
  badge?: string;
  is_popular?: boolean;
}
