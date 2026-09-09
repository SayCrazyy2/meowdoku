import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { validateTelegramInitData, extractInitDataFromRequest } from '@/lib/tmaAuth';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const rawInitData = extractInitDataFromRequest(request);
    const botToken = process.env.BOT_TOKEN;

    let telegramId: string | null = null;
    let firstName = 'Player';

    if (rawInitData && botToken) {
      const validated = validateTelegramInitData(rawInitData, botToken);
      if (validated && validated.user) {
        telegramId = String(validated.user.id);
        firstName = validated.user.first_name || 'Player';
      }
    }

    if (!telegramId && process.env.NODE_ENV === 'development') {
      telegramId = '7378059553';
      firstName = 'Player';
    }

    if (!telegramId || !botToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Telegram credentials' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, id } = body;

    let title = '';
    let description = '';
    let priceStars = 0;
    let quantity = 1;
    let itemId = id;

    if (type === 'cat_hints' || type === 'cross_hints') {
      // Find bundle in database
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, item_type, quantity, price_stars FROM shop_bundles WHERE id = ? AND is_active = TRUE`,
        [id]
      );
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Shop bundle not found' }, { status: 404 });
      }
      const bundle = rows[0];
      quantity = bundle.quantity;
      priceStars = bundle.price_stars;
      itemId = bundle.id;

      if (type === 'cat_hints') {
        title = `${quantity} Cat Hints`;
        description = `Pack of ${quantity} Cat Hints for Meowdoku puzzles!`;
      } else {
        title = `${quantity} Cross Hints`;
        description = `Pack of ${quantity} Cross Hints for Meowdoku puzzles!`;
      }
    } else if (type === 'avatar') {
      const avatarNum = parseInt(id, 10);
      if (isNaN(avatarNum) || avatarNum < 1 || avatarNum > 9) {
        return NextResponse.json({ error: 'Invalid avatar id' }, { status: 400 });
      }
      if (avatarNum === 1 || avatarNum === 2) {
        return NextResponse.json({ error: 'Avatar 1 and 2 are free' }, { status: 400 });
      }
      priceStars = 15;
      itemId = avatarNum;
      title = `Unlock Avatar #${avatarNum}`;
      description = `Unlock cute Animal Avatar #${avatarNum} permanently in Meowdoku!`;
    } else if (type === 'frame') {
      const frameNum = parseInt(id, 10);
      if (isNaN(frameNum) || frameNum < 1 || frameNum > 9) {
        return NextResponse.json({ error: 'Invalid frame id' }, { status: 400 });
      }
      if (frameNum === 1 || frameNum === 2) {
        return NextResponse.json({ error: 'Frame 1 and 2 are free' }, { status: 400 });
      }
      priceStars = 15;
      itemId = frameNum;
      title = `Unlock Frame #${frameNum}`;
      description = `Unlock decorative Profile Frame #${frameNum} permanently in Meowdoku!`;
    } else {
      return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
    }

    // Payload for telegram successful_payment webhook
    const payload = JSON.stringify({
      type,
      itemId,
      quantity,
      telegramId,
      ts: Date.now(),
    });

    // Call Telegram Bot API createInvoiceLink
    // For Telegram Stars (XTR): provider_token MUST be empty string "", prices amount in whole Stars
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload,
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: title, amount: priceStars }],
      }),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok || !tgData.result) {
      console.error('Telegram createInvoiceLink error:', tgData);
      return NextResponse.json(
        { error: tgData.description || 'Failed to create Telegram Stars invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceLink: tgData.result,
      title,
      priceStars,
    });
  } catch (err: any) {
    console.error('Error in /api/shop/invoice:', err);
    return NextResponse.json(
      { error: 'Internal server error creating invoice' },
      { status: 500 }
    );
  }
}
