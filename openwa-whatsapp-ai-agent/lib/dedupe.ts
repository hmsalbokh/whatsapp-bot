import { createHash } from 'crypto';
import { getSupabase } from './supabase';
import { logger } from './logger';

function generateFallbackKey(from: string, text: string, timestamp?: number): string {
  const raw = `${from}|${text}|${timestamp ?? Date.now()}`;
  return createHash('sha256').update(raw).digest('hex');
}

export async function isDuplicate(eventKey: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data, error } = await (supabase
      .from('webhook_events') as any)
      .select('id')
      .eq('event_key', eventKey)
      .maybeSingle();

    if (error) {
      logger.warn('Dedupe check failed', { error: String(error) });
      return false;
    }
    return !!data;
  } catch (err) {
    logger.warn('Dedupe exception', { error: String(err) });
    return false;
  }
}

export async function markProcessed(
  eventKey: string,
  payload: unknown
): Promise<void> {
  try {
    const supabase = getSupabase();
    const { error } = await (supabase.from('webhook_events') as any).insert({
      source: 'openwa',
      event_key: eventKey,
      payload,
      processed: true,
    });
    if (error) {
      logger.warn('Failed to save webhook event', { error: error.message });
    }
  } catch (err) {
    logger.warn('Failed to mark event processed', { error: String(err) });
  }
}

export function buildEventKey(
  externalId?: string,
  from?: string,
  text?: string,
  timestamp?: number
): string {
  if (externalId) return externalId;
  return generateFallbackKey(from ?? '', text ?? '', timestamp);
}
