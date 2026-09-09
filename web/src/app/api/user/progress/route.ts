import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { getStreakData } from '@/lib/streakService';
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
      level_number,
      completed,
      fish_remaining = 0,
      cat_hints_used = 0,
      cross_hints_used = 0,
      duration_seconds = 0,
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

    // Deduct hints used if any
    const updatedCatHints = Math.max(0, user.cat_hints - cat_hints_used);
    const updatedCrossHints = Math.max(0, user.cross_hints - cross_hints_used);

    let updatedLevel = user.current_level;
    let updatedFishBalance = user.fish_balance;

    if (completed) {
      // Level won! Advance level and award remaining fish
      if (level_number >= user.current_level) {
        updatedLevel = level_number + 1;
      }
      updatedFishBalance = user.fish_balance + Math.max(0, fish_remaining);
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
        fish_remaining,
        cat_hints_used,
        cross_hints_used,
        completed ? 1 : 0,
        duration_seconds,
      ]
    );

    // Dynamic streak calculation from checkins table
    const streakData = await getStreakData(telegramId);

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
