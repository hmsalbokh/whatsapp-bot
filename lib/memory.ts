// Thin re-export layer — consumers import from here for backward compatibility.
// Direct imports from lib/db/ or lib/agent/ are also valid.

export { addMessage, getMessages, isDuplicateMessage } from "@/lib/db/messages";
export { getOrCreateConversation, isHandoffRequested, clearMemory } from "@/lib/db/conversations";
export { setHandoffRequested } from "@/lib/db/handoffs";
export { logWebhookEvent, markWebhookProcessed, markWebhookFailed } from "@/lib/db/webhook-events";
export { saveSummary, getSummary, generateAndSaveSummary } from "@/lib/agent/summarization";
