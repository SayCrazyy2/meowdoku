import { LevelData, BankManifestEntry } from './types';

// Cached bank data files in memory to avoid refetching
const bankCache: Record<string, Record<string, unknown> | unknown[]> = {};
let manifestCache: Record<string, BankManifestEntry> | null = null;

// Exact progression from decompiled SizeModifier.gd
const SIZES_1_10 = [4, 5, 6, 6, 7, 6, 8, 7, 9, 8];
const SIZES_11_PLUS = [7, 10, 10, 9, 10, 10, 9, 10, 10, 10];

export function getLevelSize(levelNum: number): number {
  if (levelNum <= 10) {
    return SIZES_1_10[Math.max(0, levelNum - 1)];
  }
  const idx = (levelNum - 11) % SIZES_11_PLUS.length;
  return SIZES_11_PLUS[idx];
}

export function isHardLevel(levelNum: number): boolean {
  if (levelNum < 15) return false;
  return (levelNum % 6) === 0;
}

// Fetch the manifest of available banks
export async function getBankManifest(): Promise<Record<string, BankManifestEntry>> {
  if (manifestCache) return manifestCache;
  try {
    const res = await fetch('/levels/levels_manifest.json');
    if (!res.ok) throw new Error('Failed to load manifest');
    manifestCache = await res.json();
    return manifestCache!;
  } catch (err) {
    console.error('Error fetching manifest:', err);
    return {};
  }
}

// Fetch specific bank JSON
export async function fetchBank(bankFilename: string): Promise<Record<string, unknown> | unknown[] | null> {
  if (bankCache[bankFilename]) return bankCache[bankFilename];
  try {
    const res = await fetch(`/levels/${bankFilename}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    bankCache[bankFilename] = data;
    return data;
  } catch (e) {
    console.error(`Error loading bank ${bankFilename}:`, e);
    return null;
  }
}

// Apply geometric transformation (0..7: 4 rotations x 2 reflections)
export function transformPuzzle(regionMap: number[][], solution: number[], transform: number): {
  regionMap: number[][];
  solution: number[];
} {
  const size = regionMap.length;
  if (transform === 0) return { regionMap, solution };

  // Convert solution array to 2D boolean grid
  const catGrid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    const c = solution[r];
    if (c >= 0 && c < size) {
      catGrid[r][c] = true;
    }
  }

  let newMap: number[][] = regionMap.map(row => [...row]);
  let newCats: boolean[][] = catGrid.map(row => [...row]);

  // Rotations (transform % 4 times 90 deg clockwise)
  const rotations = transform % 4;
  for (let step = 0; step < rotations; step++) {
    const rotatedMap: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    const rotatedCats: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        rotatedMap[c][size - 1 - r] = newMap[r][c];
        rotatedCats[c][size - 1 - r] = newCats[r][c];
      }
    }
    newMap = rotatedMap;
    newCats = rotatedCats;
  }

  // Reflection (if transform >= 4, horizontal flip)
  if (transform >= 4) {
    for (let r = 0; r < size; r++) {
      newMap[r].reverse();
      newCats[r].reverse();
    }
  }

  // Extract new solution array
  const newSolution: number[] = new Array(size).fill(-1);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (newCats[r][c]) {
        newSolution[r] = c;
        break;
      }
    }
  }

  return { regionMap: newMap, solution: newSolution };
}

// Special handcrafted milestone levels from Meowdoku's SpecialProvider
const SPECIAL_MILESTONE_LEVELS = new Set([20, 30, 40, 50, 55, 60, 62, 70, 75, 80, 90, 100, 123, 200, 314, 456]);

// In-memory Level Preload Cache to eliminate loading screens between levels
const levelPreloadCache = new Map<number, LevelData>();
const pendingPreloads = new Map<number, Promise<LevelData | null>>();
let preloadedDailyChallenge: LevelData | null = null;
let pendingDailyPreload: Promise<LevelData | null> | null = null;

export function getCachedLevel(levelNum: number): LevelData | undefined {
  return levelPreloadCache.get(levelNum);
}

export function isLevelPreloaded(levelNum: number): boolean {
  return levelPreloadCache.has(levelNum);
}

export function getCachedDailyChallenge(): LevelData | null {
  return preloadedDailyChallenge;
}

export async function preloadLevel(levelNum: number): Promise<LevelData | null> {
  if (levelPreloadCache.has(levelNum)) {
    return levelPreloadCache.get(levelNum)!;
  }
  if (pendingPreloads.has(levelNum)) {
    return pendingPreloads.get(levelNum)!;
  }
  const promise = (async () => {
    try {
      const data = await selectLevel(levelNum);
      if (data) {
        levelPreloadCache.set(levelNum, data);
      }
      return data;
    } catch (err) {
      console.warn(`Failed to preload level ${levelNum}:`, err);
      return null;
    } finally {
      pendingPreloads.delete(levelNum);
    }
  })();
  pendingPreloads.set(levelNum, promise);
  return promise;
}

export async function preloadLevels(startLevelNum: number, count: number = 5): Promise<void> {
  const promises: Promise<LevelData | null>[] = [];
  for (let i = 0; i < count; i++) {
    const lvl = startLevelNum + i;
    if (lvl > 0) {
      promises.push(preloadLevel(lvl));
    }
  }
  if (!preloadedDailyChallenge && !pendingDailyPreload) {
    pendingDailyPreload = selectDailyChallenge()
      .then(d => {
        preloadedDailyChallenge = d;
        return d;
      })
      .catch(() => null)
      .finally(() => {
        pendingDailyPreload = null;
      });
  }
  await Promise.all(promises);
}

// Select a level using the game's exact fallback/bank-cursor mechanism
export async function selectLevel(
  levelNum: number,
  options?: { bankOverride?: string; rankTier?: string; specificIndex?: number }
): Promise<LevelData | null> {
  if (!options && levelPreloadCache.has(levelNum)) {
    return levelPreloadCache.get(levelNum)!;
  }

  const size = getLevelSize(levelNum);
  let bankFilename = options?.bankOverride;

  if (!bankFilename) {
    if (SPECIAL_MILESTONE_LEVELS.has(levelNum)) {
      // Milestone level: load from handcrafted special levels bank
      bankFilename = 'bankDataSP.json';
    } else if (levelNum > 10 && levelNum % 5 === 0 && size >= 7 && size <= 10) {
      // Every 5th level, mix in Link/Lock (LKStyle) or Grid Challenge (GC) variations
      const variantType = (levelNum / 5) % 2 === 0 ? 'GC' : 'LKStyle';
      bankFilename = `bankData${variantType}${size}x${size}.json`;
    } else {
      // Standard regular bank
      bankFilename = `bankData${size}x${size}.json`;
    }
  }
  
  let rawBank = await fetchBank(bankFilename);
  // Fallback to standard bank if special variant bank fails to load
  if (!rawBank && bankFilename !== `bankData${size}x${size}.json`) {
    bankFilename = `bankData${size}x${size}.json`;
    rawBank = await fetchBank(bankFilename);
  }
  if (!rawBank) return null;

  let rawList: Record<string, unknown>[] = [];

  if (Array.isArray(rawBank)) {
    rawList = rawBank as Record<string, unknown>[];
  } else if (typeof rawBank === 'object' && rawBank !== null) {
    if ('levels' in rawBank && Array.isArray(rawBank.levels)) {
      rawList = rawBank.levels as Record<string, unknown>[];
    } else if (options?.rankTier && (rawBank as Record<string, unknown[]>)[options.rankTier]) {
      rawList = (rawBank as Record<string, Record<string, unknown>[]>)[options.rankTier];
    } else {
      // In Meowdoku's BankSorter, all difficulty tiers are pooled sequentially
      // e.g. Tier 1, Tier 2, Tier 3, Tier 4, Tier 5
      const tiers = ['1', '2', '3', '4', '5'];
      for (const t of tiers) {
        const arr = (rawBank as Record<string, Record<string, unknown>[]>)[t];
        if (Array.isArray(arr)) {
          rawList.push(...arr);
        }
      }
      if (rawList.length === 0) {
        for (const k of Object.keys(rawBank)) {
          const arr = (rawBank as Record<string, Record<string, unknown>[]>)[k];
          if (Array.isArray(arr)) rawList.push(...arr);
        }
      }
    }
  }

  if (rawList.length === 0) return null;

  // Calculate cursor index & transformation
  const index = options?.specificIndex !== undefined 
    ? options.specificIndex % rawList.length 
    : (levelNum - 1) % rawList.length;
    
  const transform = ((levelNum - 1) * 3) % 8; // Varies rotation & reflection per level

  const rawEntry = rawList[index];
  const originalMap = rawEntry.regionMap as number[][];
  const originalSolution = rawEntry.solution as number[];

  const { regionMap, solution } = transformPuzzle(originalMap, originalSolution, transform);

  const levelData: LevelData = {
    id: levelNum,
    size: regionMap.length,
    seed: (rawEntry.seed as number) || levelNum,
    regionMap,
    solution,
    r: (rawEntry.r as number) || (rawEntry.rank as number) || 1,
    steps: (rawEntry.steps as number) || 4,
    r1: rawEntry.r1 as number,
    r2: rawEntry.r2 as number,
    r3: rawEntry.r3 as number,
    r4: rawEntry.r4 as number,
    r5: rawEntry.r5 as number,
    _pid_h: rawEntry._pid_h as string,
    _pid_s: rawEntry._pid_s as number[],
    isChainedStrategy: !!rawEntry.isChainedStrategy,
    bankName: bankFilename,
    bankIndex: index,
    transform,
  };

  if (!options) {
    levelPreloadCache.set(levelNum, levelData);
  }

  return levelData;
}

// Select deterministic daily challenge puzzle based on date YYYY-MM-DD
export async function selectDailyChallenge(dateStr?: string): Promise<LevelData | null> {
  if (!dateStr && preloadedDailyChallenge) {
    return preloadedDailyChallenge;
  }

  const targetDate = dateStr || new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < targetDate.length; i++) {
    hash = (hash << 5) - hash + targetDate.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  
  // Use 6x6 puzzle for daily challenge (accessible, engaging, fun speedrun)
  const size = 6;
  const bankFilename = `bankData${size}x${size}.json`;
  const rawBank = await fetchBank(bankFilename);
  if (!rawBank) return selectLevel(5); // fallback

  let rawList: Record<string, unknown>[] = [];
  if (Array.isArray(rawBank)) {
    rawList = rawBank as Record<string, unknown>[];
  } else if (typeof rawBank === 'object' && rawBank !== null) {
    if ('levels' in rawBank && Array.isArray(rawBank.levels)) {
      rawList = rawBank.levels as Record<string, unknown>[];
    } else {
      const tiers = ['1', '2', '3'];
      for (const t of tiers) {
        const arr = (rawBank as Record<string, Record<string, unknown>[]>)[t];
        if (Array.isArray(arr)) rawList.push(...arr);
      }
    }
  }

  if (rawList.length === 0) return selectLevel(5);

  const index = positiveHash % rawList.length;
  const transform = positiveHash % 8;

  const rawEntry = rawList[index];
  const originalMap = rawEntry.regionMap as number[][];
  const originalSolution = rawEntry.solution as number[];

  const { regionMap, solution } = transformPuzzle(originalMap, originalSolution, transform);

  const dailyResult: LevelData = {
    id: 9999,
    size: regionMap.length,
    seed: positiveHash,
    regionMap,
    solution,
    r: (rawEntry.r as number) || (rawEntry.rank as number) || 2,
    steps: (rawEntry.steps as number) || 4,
    bankName: 'daily_challenge',
    bankIndex: index,
    transform,
  };

  if (!dateStr) {
    preloadedDailyChallenge = dailyResult;
  }

  return dailyResult;
}

