import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
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
    const { level_number = 1, is_daily_challenge = false } = body;

    // Fetch user to verify level permission
    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT current_level FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userRows[0];

    // Anti-cheat rule: player cannot start levels beyond their current level
    if (!is_daily_challenge && level_number > user.current_level) {
      return NextResponse.json(
        { error: `Cannot start level ${level_number}. Current level is ${user.current_level}` },
        { status: 403 }
      );
    }

    // Generate secure session token
    const sessionToken = crypto.randomUUID();

    // Invalidate any existing active sessions for this user & level to avoid duplicates
    await pool.query(
      `UPDATE game_sessions 
       SET status = 'abandoned' 
       WHERE telegram_id = ? AND status = 'active'`,
      [telegramId]
    );

    // Create new active game session
    await pool.query(
      `INSERT INTO game_sessions 
        (session_token, telegram_id, level_number, is_daily_challenge, fish_remaining, status)
       VALUES (?, ?, ?, ?, 3, 'active')`,
      [sessionToken, telegramId, level_number, is_daily_challenge ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      session_token: sessionToken,
    });
  } catch (error: any) {
    console.error('Error in /api/game/session:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
