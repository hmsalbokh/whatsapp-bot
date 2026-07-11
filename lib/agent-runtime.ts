import { getMessages, addMessage } from "@/lib/memory";
import { getProjectTenant } from "@/lib/db/projects";
import { getServiceClient } from "@/lib/supabase";
import { chat, OpenRouterError } from "@/lib/openrouter";
import { buildPrompt, generateSystemPrompt } from "@/lib/prompt-builder";
import { normalizeResponse } from "@/lib/response-normalizer";
import { toolDefinitions, executeTool } from "@/lib/tools";
import { withRetry } from "@/lib/retry";
import { logAudit } from "@/lib/audit";
import type { ConversationMessage } from "@/types";

export async function buildAgentMessages(
  projectId: string,
  phone: string
): Promise<{
  messages: ConversationMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  tenantId: string;
}> {
  const ctx = await buildPrompt(projectId);
  const systemPrompt = generateSystemPrompt(ctx);

  const convMessages = await getMessages(projectId, phone);

  const summaryMessages = convMessages.filter((m) => m.role === "system");
  const conversationOnly = convMessages.filter((m) => m.role !== "system");

  const messages: ConversationMessage[] = [
    { role: "system", content: systemPrompt },
    ...summaryMessages,
    ...conversationOnly,
  ];

  const projectSettings = await getProjectSettings(projectId);
  const { tenant_id: tenantId } = await getProjectTenant(projectId);

  return {
    messages,
    model: ctx.agentModel,
    temperature: projectSettings.temperature,
    maxTokens: projectSettings.maxTokens,
    tenantId,
  };
}

interface ProjectSettings {
  temperature: number;
  maxTokens: number;
}

async function getProjectSettings(
  projectId: string
): Promise<ProjectSettings> {
  const admin = getServiceClient();

  const { data } = await admin
    .from("agent_settings")
    .select("temperature, max_tokens")
    .eq("project_id", projectId)
    .single();

  const settings = data as unknown as {
    temperature: number;
    max_tokens: number;
  } | null;

  return {
    temperature: settings?.temperature ?? 0.7,
    maxTokens: settings?.max_tokens ?? 1024,
  };
}

export async function processWithTools(
  projectId: string,
  phone: string,
  maxTurns = 5
): Promise<string> {
  const { messages, model, temperature, maxTokens, tenantId } =
    await buildAgentMessages(projectId, phone);

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await withRetry(
      () =>
        chat(messages, toolDefinitions, {
          model,
          temperature,
          maxTokens,
        }),
      {
        jobType: "openrouter_chat",
        tenantId,
        payload: { projectId, phone, turn },
        maxAttempts: 3,
        retryDelayMs: 1000,
      }
    );

    const choice = response.choices[0];
    if (!choice) throw new Error("No response from OpenRouter");

    const { message } = choice;

    if (message.tool_calls && message.tool_calls.length > 0) {
      const assistantMsg: ConversationMessage = {
        role: "assistant",
        content: message.content ?? "",
        tool_calls: message.tool_calls.map((tc) => ({
          ...tc,
          function: tc.function,
        })),
      };
      messages.push(assistantMsg);
      await addMessage(projectId, phone, assistantMsg);

      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args, {
          phone,
          projectId,
        });

        const toolMsg: ConversationMessage = {
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
        };
        messages.push(toolMsg);
        await addMessage(projectId, phone, toolMsg);
      }
    } else {
      const text = normalizeResponse(message.content ?? "");
      const assistantMsg: ConversationMessage = {
        role: "assistant",
        content: text,
      };
      messages.push(assistantMsg);
      await addMessage(projectId, phone, assistantMsg);

      logAudit({
        tenantId,
        action: "agent_response",
        entityType: "message",
        entityId: undefined,
        changes: { projectId, phone, turn },
      }).catch(() => {});

      return text;
    }
  }

  return "عذرًا، استغرق الرد وقتًا أطول من المتوقع. يرجى المحاولة مرة أخرى لاحقًا.";
}
