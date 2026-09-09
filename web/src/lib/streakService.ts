import { pool } from './db';
import { RowDataPacket } from 'mysql2';

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

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/**
 * Calculates current streak, best streak, today's checkin status,
 * and a 7-day progression cycle based on the user's checkin history.
 */
export async function getStreakData(telegramId: string | number): Promise<StreakData> {
  // 1. Fetch server's current date and yesterday's date in YYYY-MM-DD
  const [serverDateRows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today,
      DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '%Y-%m-%d') AS yesterday
  `);

  const todayStr = serverDateRows[0]?.today || new Date().toISOString().split('T')[0];
  const yesterdayStr = serverDateRows[0]?.yesterday || '';

  // 2. Fetch all unique checkin dates for user, ordered chronologically
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(checkin_date, '%Y-%m-%d') AS checkin_date 
     FROM checkins 
     WHERE telegram_id = ? 
     ORDER BY checkin_date ASC`,
    [telegramId]
  );

  const dateStrings: string[] = rows.map(r => r.checkin_date);
  const dateSet = new Set(dateStrings);

  const checkedInToday = dateSet.has(todayStr);

  // 3. Compute current streak (consecutive days backwards)
  let currentStreak = 0;
  if (checkedInToday) {
    currentStreak = 1;
    let d = new Date(todayStr + 'T00:00:00Z');
    while (true) {
      d.setUTCDate(d.getUTCDate() - 1);
      const s = d.toISOString().split('T')[0];
      if (dateSet.has(s)) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (dateSet.has(yesterdayStr)) {
    // If not checked in today yet, but checked in yesterday, the streak is maintained
    currentStreak = 1;
    let d = new Date(yesterdayStr + 'T00:00:00Z');
    while (true) {
      d.setUTCDate(d.getUTCDate() - 1);
      const s = d.toISOString().split('T')[0];
      if (dateSet.has(s)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // 4. Compute best streak all-time
  let bestStreak = 0;
  let running = 0;
  let prevDate: Date | null = null;

  for (const s of dateStrings) {
    const cur = new Date(s + 'T00:00:00Z');
    if (!prevDate) {
      running = 1;
    } else {
      const diffDays = Math.round((cur.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        running++;
      } else if (diffDays > 1) {
        running = 1;
      }
    }
    prevDate = cur;
    if (running > bestStreak) {
      bestStreak = running;
    }
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  // 5. Generate 7-day progression cycle for UI
  // Cycle starts so that the active streak aligns with Day 1..7
  // If streak is 1, day 1 is today (e.g. WED).
  // If streak is 2, day 1 was yesterday (TUE) and day 2 is today (WED).
  const cycleIndex = currentStreak > 0 ? (currentStreak - 1) % 7 : 0;
  const cycleStartOffset = checkedInToday ? cycleIndex : Math.max(0, cycleIndex);

  const weekDays: DayProgress[] = [];
  const baseDate = new Date(todayStr + 'T00:00:00Z');
  baseDate.setUTCDate(baseDate.getUTCDate() - cycleStartOffset);

  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setUTCDate(d.getUTCDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getUTCDay();
    weekDays.push({
      dayLabel: DAY_NAMES[dayOfWeek],
      date: dStr,
      checked: dateSet.has(dStr),
      isToday: dStr === todayStr,
    });
  }

  return {
    checked_in_today: checkedInToday,
    current_streak: currentStreak,
    best_streak: bestStreak,
    week_days: weekDays,
  };
}

export interface CheckinReward {
  type: 'cat_hint' | 'cross_hint';
  name: string;
  amount: number;
}

export interface CheckinResult {
  streak: StreakData;
  reward?: CheckinReward;
  already_checked_in: boolean;
  cat_hints?: number;
  cross_hints?: number;
}

/**
 * Idempotently records a manual checkin for today's date, awards 1 free hint if not checked in today,
 * and returns updated streak & user hint balances.
 */
export async function recordCheckin(telegramId: string | number): Promise<CheckinResult> {
  const [serverDateRows] = await pool.query<RowDataPacket[]>(`
    SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS today
  `);
  const todayStr = serverDateRows[0]?.today || new Date().toISOString().split('T')[0];

  // 1. Check if user already checked in today
  const [existingCheckin] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM checkins WHERE telegram_id = ? AND DATE_FORMAT(checkin_date, '%Y-%m-%d') = ?`,
    [telegramId, todayStr]
  );

  const streakBefore = await getStreakData(telegramId);

  if (existingCheckin.length > 0) {
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT cat_hints, cross_hints FROM users WHERE telegram_id = ?',
      [telegramId]
    );
    return {
      streak: streakBefore,
      already_checked_in: true,
      cat_hints: userRows[0]?.cat_hints ?? 0,
      cross_hints: userRows[0]?.cross_hints ?? 0,
    };
  }

  // 2. Insert new checkin
  await pool.query(
    'INSERT IGNORE INTO checkins (telegram_id, checkin_date) VALUES (?, CURDATE())',
    [telegramId]
  );

  const updatedStreak = await getStreakData(telegramId);

  // 3. Award 1 free hint (alternating between cat and cross based on streak count)
  const rewardType: 'cat_hint' | 'cross_hint' =
    updatedStreak.current_streak % 2 === 1 ? 'cat_hint' : 'cross_hint';
  const rewardName = rewardType === 'cat_hint' ? 'Cat Hint' : 'Cross Hint';

  if (rewardType === 'cat_hint') {
    await pool.query(
      'UPDATE users SET cat_hints = cat_hints + 1 WHERE telegram_id = ?',
      [telegramId]
    );
  } else {
    await pool.query(
      'UPDATE users SET cross_hints = cross_hints + 1 WHERE telegram_id = ?',
      [telegramId]
    );
  }

  const [userRows] = await pool.query<RowDataPacket[]>(
    'SELECT cat_hints, cross_hints FROM users WHERE telegram_id = ?',
    [telegramId]
  );

  return {
    streak: updatedStreak,
    already_checked_in: false,
    reward: {
      type: rewardType,
      name: rewardName,
      amount: 1,
    },
    cat_hints: userRows[0]?.cat_hints ?? 0,
    cross_hints: userRows[0]?.cross_hints ?? 0,
  };
}
