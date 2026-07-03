import { NextRequest, NextResponse } from 'next/server';
import { getConversations, toggleBot, setHumanHandoff } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const conversations = await getConversations();
    return NextResponse.json({ conversations });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, bot_enabled, human_handoff } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    if (typeof bot_enabled === 'boolean') {
      await toggleBot(id, bot_enabled);
    }
    if (typeof human_handoff === 'boolean') {
      await setHumanHandoff(id, human_handoff);
      if (human_handoff) {
        await toggleBot(id, false);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
