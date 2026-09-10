import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { getStreakData } from '@/lib/streakService';
import { validatePuzzleSolution } from '@/lib/serverLevelValidator';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const rawInitData = extractInitDataFromRequest(request);
    const botToken = process.env.BOT_TOKEN;

    if (!rawInitData || !botToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validated = validateTelegramInitData(rawInitData, botToken);
    if (!validated || !validated.user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    const telegramId = validated.user.id;
    const body = await request.json();
    const {
      session_token,
      level_number,
      completed,
      fish_remaining = 0,
      cat_hints_used = 0,
      cross_hints_used = 0,
      duration_seconds = 0,
      cats = [],
    } = body;

    // Fetch existing user
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // Anti-Cheat & Session Validation on level completion
    if (completed) {
      if (!session_token) {
        return NextResponse.json(
          { error: 'Session token required for level completion' },
          { status: 400 }
        );
      }

      const [sessionRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM game_sessions WHERE session_token = ? AND telegram_id = ? LIMIT 1',
        [session_token, telegramId]
      );

      if (sessionRows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid game session' },
          { status: 400 }
        );
      }

      const session = sessionRows[0];
      if (session.status !== 'active') {
        return NextResponse.json(
          { error: 'Session has already been completed or expired' },
          { status: 400 }
        );
      }

      if (Number(session.level_number) !== Number(level_number)) {
        return NextResponse.json(
          { error: 'Session level number mismatch' },
          { status: 400 }
        );
      }

      // Human speed limit check: a level cannot realistically be solved in under 3 seconds
      if (duration_seconds < 3) {
        return NextResponse.json(
          { error: 'Invalid duration for level completion' },
          { status: 400 }
        );
      }

      // Validate puzzle solution against bank data
      const solutionValidation = validatePuzzleSolution(level_number, cats);
      if (!solutionValidation.valid) {
        return NextResponse.json(
          { error: `Anti-cheat: ${solutionValidation.reason || 'Invalid cat placement'}` },
          { status: 400 }
        );
      }

      // Mark session completed
      await pool.query(
        `UPDATE game_sessions 
         SET status = 'completed', completed_at = NOW(), fish_remaining = ?, cat_hints_used = ?, cross_hints_used = ?
         WHERE session_token = ?`,
        [Math.min(3, Math.max(0, fish_remaining)), cat_hints_used, cross_hints_used, session_token]
      );
    }

    // Deduct hints used if any
    const updatedCatHints = Math.max(0, user.cat_hints - cat_hints_used);
    const updatedCrossHints = Math.max(0, user.cross_hints - cross_hints_used);

    let updatedLevel = user.current_level;
    let updatedFishBalance = user.fish_balance;

    if (completed) {
      // Level won! Advance level and award remaining fish (max 3)
      if (level_number >= user.current_level) {
        updatedLevel = level_number + 1;
      }
      const awardedFish = Math.min(3, Math.max(0, fish_remaining));
      updatedFishBalance = user.fish_balance + awardedFish;
    }

    // Update user record
    await pool.query(
      `UPDATE users 
       SET current_level = ?, fish_balance = ?, cat_hints = ?, cross_hints = ?, last_active_at = NOW() 
       WHERE telegram_id = ?`,
      [updatedLevel, updatedFishBalance, updatedCatHints, updatedCrossHints, telegramId]
    );

    // Insert game log for analytics
    await pool.query(
      `INSERT INTO game_logs 
        (telegram_id, level_number, attempts, fish_remaining, cat_hints_used, cross_hints_used, completed, duration_seconds)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?)`,
      [
        telegramId,
        level_number,
        Math.min(3, Math.max(0, fish_remaining)),
        cat_hints_used,
        cross_hints_used,
        completed ? 1 : 0,
        duration_seconds,
      ]
    );

    // Dynamic streak calculation from checkins table
    const streakData = await getStreakData(telegramId);

    // Fetch unlocked cosmetics to ensure state persistence
    const [unlockRows] = await pool.query<RowDataPacket[]>(
      'SELECT item_type, item_id FROM user_unlocks WHERE telegram_id = ?',
      [telegramId]
    );

    const unlockedAvatars = new Set<number>([1, 2]);
    const unlockedFrames = new Set<number>([1, 2]);

    for (const u of unlockRows) {
      if (u.item_type === 'avatar') unlockedAvatars.add(Number(u.item_id));
      if (u.item_type === 'frame') unlockedFrames.add(Number(u.item_id));
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        telegram_id: telegramId.toString(),
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        country_code: user.country_code,
        current_level: updatedLevel,
        fish_balance: updatedFishBalance,
        cat_hints: updatedCatHints,
        cross_hints: updatedCrossHints,
        daily_streak: streakData.current_streak,
        current_streak: streakData.current_streak,
        best_streak: streakData.best_streak,
        checked_in_today: streakData.checked_in_today,
        week_days: streakData.week_days,
        avatar_id: user.avatar_id || 1,
        frame_id: user.frame_id || 1,
        display_name: user.display_name || user.first_name,
        unlocked_avatars: Array.from(unlockedAvatars),
        unlocked_frames: Array.from(unlockedFrames),
      },
    });
  } catch (error: any) {
    console.error('Error in /api/user/progress:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
