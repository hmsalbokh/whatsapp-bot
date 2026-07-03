import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function checkAuth(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (!secret || secret !== process.env.ADMIN_SECRET) return false;
  return true;
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks: Record<string, string> = {};

  checks.openrouter = process.env.OPENROUTER_API_KEY ? 'configured' : 'missing';

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('conversations').select('id').limit(1);
      checks.supabase = error ? `error: ${error.message}` : 'connected';
    } catch (err: unknown) {
      checks.supabase = `error: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    checks.supabase = 'not configured';
  }

  if (process.env.OPENWA_BASE_URL && process.env.OPENWA_API_TOKEN) {
    checks.openwa = 'configured';
  } else {
    checks.openwa = 'not configured';
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks,
  });
}
