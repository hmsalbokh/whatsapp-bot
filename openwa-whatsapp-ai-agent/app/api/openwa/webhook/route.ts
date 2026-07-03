import { NextResponse } from 'next/server';
import { sendMessage } from '@/lib/openwa';
import { processMessage } from '@/lib/agent';
import { normalizeOpenWAPayload } from '@/lib/normalize-openwa';
import { isDuplicate, markProcessed, buildEventKey } from '@/lib/dedupe';
import { verifySignature } from '@/lib/webhook-auth';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  logger.info('Webhook received', { raw: payload });

  const sig = request.headers.get('x-openwa-signature') || request.headers.get('x-signature');
  if (!verifySignature(rawBody, sig)) {
    logger.warn('Webhook signature invalid');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const normalized = normalizeOpenWAPayload(payload);

  if (normalized.isFromMe) {
    logger.debug('Ignoring outbound message (from self)');
    return NextResponse.json({ status: 'ignored', reason: 'from_self' });
  }

  if (normalized.isGroup) {
    logger.debug('Ignoring group message');
    return NextResponse.json({ status: 'ignored', reason: 'group' });
  }

  if (!normalized.from || !normalized.text) {
    logger.debug('Ignoring non-text or missing sender');
    return NextResponse.json({ status: 'ignored', reason: 'non_text' });
  }

  const eventKey = buildEventKey(
    normalized.messageId ?? undefined,
    normalized.from,
    normalized.text,
    normalized.timestamp ?? undefined
  );

  const duplicate = await isDuplicate(eventKey);
  if (duplicate) {
    logger.debug('Duplicate event, skipping', { eventKey });
    return NextResponse.json({ status: 'ignored', reason: 'duplicate' });
  }

  await markProcessed(eventKey, payload);

  try {
    const { reply, handoff } = await processMessage(
      normalized.from,
      normalized.text,
      normalized.messageId ?? undefined
    );

    await sendMessage(normalized.from, reply);

    logger.info('Webhook processed successfully', {
      from: normalized.from,
      handoff,
    });

    return NextResponse.json({ status: 'ok', replySent: true, handoff });
  } catch (err: unknown) {
    logger.error('Webhook processing failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
