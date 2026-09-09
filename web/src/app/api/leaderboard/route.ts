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

    // 1. Get Top 30 global users by fish balance
    const [topUsers] = await pool.query<RowDataPacket[]>(
      `SELECT 
        telegram_id, 
        first_name, 
        last_name, 
        username, 
        display_name,
        avatar_id,
        frame_id,
        current_level, 
        fish_balance 
       FROM users 
       ORDER BY fish_balance DESC, current_level DESC, created_at ASC 
       LIMIT 30`
    );

    // 2. Get current user's personal rank
    const [rankResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) + 1 AS user_rank 
       FROM users 
       WHERE fish_balance > (SELECT COALESCE(fish_balance, 0) FROM users WHERE telegram_id = ?)`,
      [telegramId]
    );

    const [userRecord] = await pool.query<RowDataPacket[]>(
      'SELECT fish_balance, current_level, avatar_id, frame_id, display_name FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    const formattedLeaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      telegram_id: u.telegram_id.toString(),
      name: u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Anonymous Cat',
      username: u.username,
      avatar_id: u.avatar_id || 1,
      frame_id: u.frame_id || 1,
      level: u.current_level,
      fish_balance: u.fish_balance,
      is_current_user: u.telegram_id.toString() === telegramId.toString(),
    }));

    return NextResponse.json({
      success: true,
      leaderboard: formattedLeaderboard,
      myRank: rankResult[0]?.user_rank || 1,
      myFish: userRecord[0]?.fish_balance || 0,
      myLevel: userRecord[0]?.current_level || 1,
    });
  } catch (error: any) {
    console.error('Error in /api/leaderboard:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
