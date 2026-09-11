import { NextResponse } from 'next/server';
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
    const { hint_type } = body;

    if (hint_type !== 'cat' && hint_type !== 'cross') {
      return NextResponse.json({ error: 'Invalid hint type' }, { status: 400 });
    }

    if (hint_type === 'cat') {
      await pool.query(
        'UPDATE users SET cat_hints = cat_hints + 1, last_active_at = NOW() WHERE telegram_id = ?',
        [telegramId]
      );
    } else {
      await pool.query(
        'UPDATE users SET cross_hints = cross_hints + 1, last_active_at = NOW() WHERE telegram_id = ?',
        [telegramId]
      );
    }

    const [userRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, telegram_id, cat_hints, cross_hints, fish_balance, current_level FROM users WHERE telegram_id = ?',
      [telegramId]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = userRows[0];

    return NextResponse.json({
      success: true,
      hint_type,
      cat_hints: updated.cat_hints,
      cross_hints: updated.cross_hints,
    });
  } catch (error: any) {
    console.error('Error in /api/user/ad-reward:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
