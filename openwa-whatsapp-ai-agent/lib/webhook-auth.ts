import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from './logger';

export function verifySignature(
  payload: string,
  signature: string | null,
  secret?: string
): boolean {
  const webhookSecret = secret || process.env.OPENWA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.debug('No webhook secret configured, skipping signature validation');
    return true;
  }
  if (!signature) {
    logger.warn('Missing webhook signature');
    return false;
  }
  try {
    const expected = createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');
    const received = signature.replace(/^sha256=/, '');
    if (expected.length !== received.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch (err) {
    logger.error('Signature verification failed', { error: String(err) });
    return false;
  }
}
