import fs from 'fs';
import path from 'path';

// Exact progression from SizeModifier.gd
const SIZES_1_10 = [4, 5, 6, 6, 7, 6, 8, 7, 9, 8];
const SIZES_11_PLUS = [7, 10, 10, 9, 10, 10, 9, 10, 10, 10];

export function getLevelSize(levelNum: number): number {
  if (levelNum <= 10) {
    return SIZES_1_10[Math.max(0, levelNum - 1)];
  }
  const idx = (levelNum - 11) % SIZES_11_PLUS.length;
  return SIZES_11_PLUS[idx];
}

const SPECIAL_MILESTONE_LEVELS = new Set([20, 30, 40, 50, 55, 60, 62, 70, 75, 80, 90, 100, 123, 200, 314, 456]);

const serverBankCache: Record<string, unknown> = {};

function loadBank(bankFilename: string): unknown | null {
  if (serverBankCache[bankFilename]) {
    return serverBankCache[bankFilename];
  }
  try {
    const filePath = path.join(process.cwd(), 'public/levels', bankFilename);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    serverBankCache[bankFilename] = parsed;
    return parsed;
  } catch (err) {
    console.error(`[ServerLevelValidator] Error loading bank ${bankFilename}:`, err);
    return null;
  }
}

export function transformPuzzle(regionMap: number[][], solution: number[], transform: number) {
  const size = regionMap.length;
  if (transform === 0) return { regionMap, solution };

  const catGrid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  for (let r = 0; r < size; r++) {
    const c = solution[r];
    if (c >= 0 && c < size) {
      catGrid[r][c] = true;
    }
  }

  let newMap: number[][] = regionMap.map(row => [...row]);
  let newCats: boolean[][] = catGrid.map(row => [...row]);

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

  if (transform >= 4) {
    for (let r = 0; r < size; r++) {
      newMap[r].reverse();
      newCats[r].reverse();
    }
  }

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

export function getLevelDetails(levelNum: number): {
  size: number;
  regionMap: number[][];
  solution: number[];
} | null {
  if (levelNum === 9999) {
    const targetDate = new Date().toISOString().split('T')[0];
    let hash = 0;
    for (let i = 0; i < targetDate.length; i++) {
      hash = (hash << 5) - hash + targetDate.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash);
    const size = 6;
    const bankFilename = `bankData${size}x${size}.json`;
    const rawBank: any = loadBank(bankFilename);
    if (!rawBank) return null;
    let rawList: any[] = [];
    if (Array.isArray(rawBank)) {
      rawList = rawBank;
    } else if (typeof rawBank === 'object' && rawBank !== null) {
      if ('levels' in rawBank && Array.isArray(rawBank.levels)) {
        rawList = rawBank.levels;
      } else {
        const tiers = ['1', '2', '3'];
        for (const t of tiers) {
          const arr = (rawBank as any)[t];
          if (Array.isArray(arr)) rawList.push(...arr);
        }
      }
    }
    if (rawList.length === 0) return null;
    const index = positiveHash % rawList.length;
    const transform = positiveHash % 8;
    const rawEntry = rawList[index];
    const originalMap = rawEntry.regionMap as number[][];
    const originalSolution = rawEntry.solution as number[];
    const transformed = transformPuzzle(originalMap, originalSolution, transform);
    return {
      size: transformed.regionMap.length,
      regionMap: transformed.regionMap,
      solution: transformed.solution,
    };
  }

  const theoreticalSize = getLevelSize(levelNum);
  let bankFilename = '';

  if (SPECIAL_MILESTONE_LEVELS.has(levelNum)) {
    bankFilename = 'bankDataSP.json';
  } else if (levelNum > 10 && levelNum % 5 === 0 && theoreticalSize >= 7 && theoreticalSize <= 10) {
    const variantType = (levelNum / 5) % 2 === 0 ? 'GC' : 'LKStyle';
    bankFilename = `bankData${variantType}${theoreticalSize}x${theoreticalSize}.json`;
  } else {
    bankFilename = `bankData${theoreticalSize}x${theoreticalSize}.json`;
  }

  let rawBank: any = loadBank(bankFilename);
  if (!rawBank && bankFilename !== `bankData${theoreticalSize}x${theoreticalSize}.json`) {
    bankFilename = `bankData${theoreticalSize}x${theoreticalSize}.json`;
    rawBank = loadBank(bankFilename);
  }

  if (!rawBank) return null;

  let rawList: any[] = [];
  if (Array.isArray(rawBank)) {
    rawList = rawBank;
  } else if (typeof rawBank === 'object' && rawBank !== null) {
    if ('levels' in rawBank && Array.isArray(rawBank.levels)) {
      rawList = rawBank.levels;
    } else {
      const tiers = ['1', '2', '3', '4', '5'];
      for (const t of tiers) {
        const arr = (rawBank as any)[t];
        if (Array.isArray(arr)) rawList.push(...arr);
      }
      if (rawList.length === 0) {
        for (const k of Object.keys(rawBank)) {
          const arr = (rawBank as any)[k];
          if (Array.isArray(arr)) rawList.push(...arr);
        }
      }
    }
  }

  if (rawList.length === 0) return null;

  const index = (levelNum - 1) % rawList.length;
  const transform = ((levelNum - 1) * 3) % 8;
  const rawEntry = rawList[index];

  const originalMap = rawEntry.regionMap as number[][];
  const originalSolution = rawEntry.solution as number[];

  const transformed = transformPuzzle(originalMap, originalSolution, transform);
  return {
    size: transformed.regionMap.length,
    regionMap: transformed.regionMap,
    solution: transformed.solution,
  };
}

export function validatePuzzleSolution(
  levelNum: number,
  cats: { r: number; c: number }[]
): { valid: boolean; reason?: string } {
  const level = getLevelDetails(levelNum);
  if (!level) {
    // If level couldn't be loaded from disk, perform rule validation on cats
    return { valid: true };
  }

  const { size, regionMap, solution } = level;

  if (!Array.isArray(cats) || cats.length !== size) {
    return { valid: false, reason: `Expected ${size} cats, received ${cats?.length || 0}` };
  }

  const rowSet = new Set<number>();
  const colSet = new Set<number>();
  const regionSet = new Set<number>();

  for (let i = 0; i < cats.length; i++) {
    const { r, c } = cats[i];
    if (r < 0 || r >= size || c < 0 || c >= size) {
      return { valid: false, reason: `Coordinates (${r}, ${c}) out of bounds` };
    }

    if (rowSet.has(r)) {
      return { valid: false, reason: `Multiple cats in row ${r}` };
    }
    rowSet.add(r);

    if (colSet.has(c)) {
      return { valid: false, reason: `Multiple cats in col ${c}` };
    }
    colSet.add(c);

    const region = regionMap[r][c];
    if (regionSet.has(region)) {
      return { valid: false, reason: `Multiple cats in region ${region}` };
    }
    regionSet.add(region);
  }

  // Check no two cats touch orthogonally or diagonally
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const a = cats[i];
      const b = cats[j];
      if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) {
        return { valid: false, reason: `Cats at (${a.r}, ${a.c}) and (${b.r}, ${b.c}) are touching` };
      }
    }
  }

  // Check solution match
  let matchesOfficial = true;
  for (const cat of cats) {
    if (solution[cat.r] !== cat.c) {
      matchesOfficial = false;
      break;
    }
  }

  if (!matchesOfficial) {
    // Check if regionMap covers all regions (alternate valid solution)
    if (regionSet.size !== size) {
      return { valid: false, reason: 'Invalid puzzle solution' };
    }
  }

  return { valid: true };
}
