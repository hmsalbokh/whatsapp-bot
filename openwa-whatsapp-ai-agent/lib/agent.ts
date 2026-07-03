import {
  getOrCreateConversation,
  saveInboundMessage,
  saveOutboundMessage,
  getRecentMessagesForContext,
  updateLastMessageAt,
} from './supabase';
import { toolDefinitions, executeTool } from './tools';
import { chat } from './openrouter';
import { getBusinessConfig } from './business-config';
import { logger } from './logger';
import type { Conversation, ConversationMessage } from './types';

export interface AgentResult {
  reply: string;
  toolCalls: Array<{ name: string; args: string; result: string }>;
  handoff: boolean;
}

function buildSystemPrompt(): string {
  const config = getBusinessConfig();
  return `
أنت وكيل خدمة عملاء ذكي لشركة ${config.name}.
${config.description ? `وصف الشركة: ${config.description}` : ''}
${config.hours ? `ساعات العمل: ${config.hours}` : ''}
نبرة الحديث: ${config.tone}.

قواعد أساسية:
- أجب بالعربية الفصحى البسيطة فقط.
- كن مختصرًا ومناسبًا لواتساب (جمل قصيرة).
- لا تختلق معلومات عن الأسعار أو المخزون أو حالة الطلبات.
- إذا لم تعرف الإجابة، اسأل العميل لتوضيح أو استخدم أداة التحويل لموظف بشري.
- إذا طلب العميل موظفًا أو ذكر مشكلة كبيرة أو استخدم كلمات مثل "مشكلة" أو "شكوى" أو "قانوني" أو "استرجاع"، استخدم escalate_to_human فورًا.
- لا تدّعي أنك إنسان.
- استخدم الأدوات المتاحة عند الحاجة.
`.trim();
}

export async function processMessage(
  phone: string,
  messageText: string,
  messageId?: string
): Promise<AgentResult> {
  const conv = await getOrCreateConversation(phone);
  await saveInboundMessage(conv.id, messageText, { messageId }, messageId);

  if (!conv.bot_enabled || conv.human_handoff) {
    const reply = 'المحادثة محالة إلى موظف بشري. سيتواصل معك الفريق قريبًا.';
    await saveOutboundMessage(conv.id, reply);
    await updateLastMessageAt(conv.id, 'outbound');
    return { reply, toolCalls: [], handoff: true };
  }

  const recent = await getRecentMessagesForContext(conv.id, 10);
  const systemPrompt = buildSystemPrompt();
  const messages: ConversationMessage[] = [
    { role: 'system', content: systemPrompt },
    ...recent.map((m) => ({
      role: (m.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: messageText },
  ];

  let toolCalls: Array<{ name: string; args: string; result: string }> = [];
  let finalReply = '';
  let handoff = false;
  const maxIterations = 3;

  for (let i = 0; i < maxIterations; i++) {
    try {
      const res = await chat(messages, toolDefinitions);
      const choice = res.choices[0];
      if (!choice) break;
      const { message } = choice;

      if (message.tool_calls && message.tool_calls.length > 0) {
        messages.push({
          role: 'assistant',
          content: message.content ?? '',
          tool_calls: message.tool_calls,
        });

        for (const toolCall of message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeTool(toolCall.function.name, args, conv.id);
          toolCalls.push({
            name: toolCall.function.name,
            args: JSON.stringify(args),
            result: JSON.stringify(result),
          });
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(result),
          });
          if (toolCall.function.name === 'escalate_to_human') {
            handoff = true;
          }
        }
        continue;
      }

      finalReply = message.content ?? '';
      break;
    } catch (err) {
      logger.error('Agent iteration failed', { error: String(err), iteration: i });
      if (i === maxIterations - 1) {
        finalReply = 'عذرًا، حدث خطأ في المعالجة. سيتم تحويل طلبك إلى فريق الدعم.';
        handoff = true;
      }
      break;
    }
  }

  if (!finalReply) {
    finalReply = 'عذرًا، حدث خطأ في المعالجة. يرجى المحاولة لاحقًا.';
  }

  await saveOutboundMessage(conv.id, finalReply);
  await updateLastMessageAt(conv.id, 'outbound');
  return { reply: finalReply, toolCalls, handoff };
}
