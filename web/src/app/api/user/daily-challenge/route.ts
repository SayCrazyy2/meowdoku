import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
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

    // Check if completed today
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT duration_seconds, completed_at 
       FROM daily_challenges 
       WHERE telegram_id = ? AND challenge_date = CURDATE() 
       LIMIT 1`,
      [telegramId]
    );

    const completedToday = rows.length > 0;
    const todayDuration = completedToday ? rows[0].duration_seconds : null;

    return NextResponse.json({
      success: true,
      completed_today: completedToday,
      duration_seconds: todayDuration,
    });
  } catch (error: any) {
    console.error('Error in GET /api/user/daily-challenge:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const durationSeconds = Math.max(1, parseInt(body.duration_seconds || '0', 10));

    // Upsert or insert ignore completion for today
    await pool.query(
      `INSERT INTO daily_challenges (telegram_id, challenge_date, duration_seconds)
       VALUES (?, CURDATE(), ?)
       ON DUPLICATE KEY UPDATE 
         duration_seconds = LEAST(duration_seconds, VALUES(duration_seconds)),
         completed_at = NOW()`,
      [telegramId, durationSeconds]
    );

    // Also log in game_logs for level 9999 (Daily Challenge)
    await pool.query(
      `INSERT INTO game_logs 
        (telegram_id, level_number, attempts, fish_remaining, cat_hints_used, cross_hints_used, completed, duration_seconds)
       VALUES (?, 9999, 1, 3, 0, 0, 1, ?)`,
      [telegramId, durationSeconds]
    );

    return NextResponse.json({
      success: true,
      duration_seconds: durationSeconds,
      completed_today: true,
    });
  } catch (error: any) {
    console.error('Error in POST /api/user/daily-challenge:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
