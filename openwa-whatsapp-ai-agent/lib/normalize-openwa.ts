import { logger } from './logger';

export interface NormalizedPayload {
  eventType: string;
  messageId: string | null;
  from: string | null;
  to: string | null;
  text: string | null;
  isFromMe: boolean;
  isGroup: boolean;
  messageType: string;
  timestamp: number | null;
  raw: Record<string, unknown>;
}

export function normalizeOpenWAPayload(raw: Record<string, unknown>): NormalizedPayload {
  const eventType = (raw.eventType as string) || (raw.event as string) || 'message.received';
  const messageId = (raw.messageId as string) || (raw.id as string) || null;
  const from = (raw.from as string) || (raw.sender as string) || null;
  const to = (raw.to as string) || null;
  const text = (raw.body as string) || (raw.text as string) || (raw.message as string) || null;
  const timestamp = raw.timestamp ? Number(raw.timestamp) : null;
  const data = raw.data as Record<string, unknown> | undefined;

  const isFromMe = !!(
    raw.isFromMe ?? data?.isFromMe ?? raw.fromMe ?? false
  );
  const isGroup = !!(
    raw.isGroup ?? data?.isGroup ?? false
  );
  const messageType = (raw.type as string) || 'text';

  logger.debug('Normalized OpenWA payload', {
    eventType,
    messageId,
    from,
    isFromMe,
    messageType,
  });

  return {
    eventType,
    messageId,
    from,
    to,
    text,
    isFromMe,
    isGroup,
    messageType,
    timestamp,
    raw,
  };
}
