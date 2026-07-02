import type { ConversationMessage, MemoryEntry } from "@/types";

const DEFAULT_SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT ||
  `أنت مساعد خدمة عملاء ذكي ومحترف لشركة تجارة إلكترونية رائدة في المملكة العربية السعودية.

تعليمات مهمة:
- رد بلغة عربية فصيحة ومهذبة دائمًا
- كن مفيدًا ودقيقًا في ردودك
- إذا احتاج العميل إلى معلومات عن طلب، استخدم أداة get_order_status
- إذا سأل عن أسئلة شائعة، استخدم search_faq
- إذا كانت المشكلة معقدة أو يحتاج العميل لتحدث مع موظف بشري، استخدم handoff_to_human
- إذا احتاج العميل لتسجيل شكوى أو مشكلة، استخدم create_support_ticket
- لا تقدم معلومات خاطئة. إذا لم تعرف الإجابة، اعتذر بلطف واعرض تحويله للدعم البشري
- استخدم التحيات العربية المناسبة (السلام عليكم، صباح الخير، مساء الخير)
- كن صبورًا وأعد الشرح إذا لزم الأمر`;

const store = new Map<string, MemoryEntry>();

export function getOrCreateMemory(phone: string): MemoryEntry {
  if (!store.has(phone)) {
    store.set(phone, {
      messages: [{ role: "system", content: DEFAULT_SYSTEM_PROMPT }],
      handoffRequested: false,
    });
  }
  return store.get(phone)!;
}

export function addMessage(
  phone: string,
  message: ConversationMessage
): void {
  const entry = getOrCreateMemory(phone);
  entry.messages.push(message);
  if (entry.messages.length > 50) {
    const system = entry.messages[0];
    entry.messages = [system, ...entry.messages.slice(-40)];
  }
}

export function getMessages(phone: string): ConversationMessage[] {
  return getOrCreateMemory(phone).messages;
}

export function setHandoffRequested(
  phone: string,
  reason: string
): void {
  const entry = getOrCreateMemory(phone);
  entry.handoffRequested = true;
  entry.handoffReason = reason;
}

export function isHandoffRequested(phone: string): boolean {
  return getOrCreateMemory(phone).handoffRequested;
}

export function clearMemory(phone: string): void {
  store.delete(phone);
}
