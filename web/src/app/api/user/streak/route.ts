import { NextResponse } from 'next/server';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { getStreakData, recordCheckin } from '@/lib/streakService';

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
    const streakData = await getStreakData(telegramId);

    return NextResponse.json({
      success: true,
      streak: streakData,
    });
  } catch (error: any) {
    console.error('Error in GET /api/user/streak:', error);
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

    let telegramId: string | number | null = null;

    if (rawInitData && botToken) {
      const validated = validateTelegramInitData(rawInitData, botToken);
      if (validated && validated.user) {
        telegramId = validated.user.id;
      }
    }

    if (!telegramId && process.env.NODE_ENV === 'development') {
      telegramId = '7378059553';
    }

    if (!telegramId) {
      return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
    }

    const result = await recordCheckin(telegramId);

    return NextResponse.json({
      success: true,
      streak: result.streak,
      reward: result.reward,
      already_checked_in: result.already_checked_in,
      cat_hints: result.cat_hints,
      cross_hints: result.cross_hints,
    });
  } catch (error: any) {
    console.error('Error in POST /api/user/streak:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
