import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/openwa';
import {
  getOrCreateConversation,
  saveOutboundMessage,
  updateLastMessageAt,
} from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const adminSecret = request.headers.get('x-admin-secret');
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { to, text } = body as { to: string; text: string };

    if (!to || !text) {
      return NextResponse.json({ error: 'Missing to or text' }, { status: 400 });
    }

    await sendMessage(to, text);

    const conv = await getOrCreateConversation(to);
    await saveOutboundMessage(conv.id, text, undefined, 'admin');
    await updateLastMessageAt(conv.id, 'outbound');

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
