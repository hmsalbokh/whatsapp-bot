import { getServiceClient } from "@/lib/supabase";

export interface PromptContext {
  projectName: string;
  industry: string | null;
  companyDescription: string | null;
  knowledgeItems: { question: string; answer: string }[];
  agentModel: string;
  agentLanguage: string;
  systemPromptOverride: string | null;
}

export async function buildPrompt(projectId: string): Promise<PromptContext> {
  const admin = getServiceClient();

  const [projectRes, settingsRes, knowledgeRes] = await Promise.all([
    admin
      .from("project_profiles")
      .select("name, industry, company_description")
      .eq("id", projectId)
      .single(),
    admin
      .from("agent_settings")
      .select("model, language, system_prompt")
      .eq("project_id", projectId)
      .single(),
    admin
      .from("knowledge_items")
      .select("question, answer")
      .eq("project_id", projectId)
      .eq("is_active", true),
  ]);

  const project = projectRes.data as unknown as {
    name: string;
    industry: string | null;
    company_description: string | null;
  } | null;

  const settings = settingsRes.data as unknown as {
    model: string;
    language: string;
    system_prompt: string | null;
  } | null;

  const knowledge = (knowledgeRes.data ?? []) as unknown as {
    question: string;
    answer: string;
  }[];

  return {
    projectName: project?.name ?? "",
    industry: project?.industry ?? null,
    companyDescription: project?.company_description ?? null,
    knowledgeItems: knowledge,
    agentModel: settings?.model ?? "qwen/qwen-2.5-72b-instruct",
    agentLanguage: settings?.language ?? "ar",
    systemPromptOverride: settings?.system_prompt ?? null,
  };
}

function buildKnowledgeSection(ctx: PromptContext): string[] {
  if (ctx.knowledgeItems.length === 0) return [];
  const lines: string[] = [``, `قاعدة المعرفة:`];
  ctx.knowledgeItems.forEach((item, i) => {
    lines.push(`${i + 1}. س: ${item.question}`);
    lines.push(`   ج: ${item.answer}`);
  });
  return lines;
}

export function generateSystemPrompt(ctx: PromptContext): string {
  const knowledgeLines = buildKnowledgeSection(ctx);

  if (ctx.systemPromptOverride) {
    return [ctx.systemPromptOverride, ...knowledgeLines].join("\n");
  }

  const lines: string[] = [];

  lines.push(`أنت مساعد خدمة عملاء ذكي ومحترف.`);
  lines.push(``);
  lines.push(`اسم المشروع: ${ctx.projectName}`);
  if (ctx.industry) lines.push(`مجال العمل: ${ctx.industry}`);
  if (ctx.companyDescription) lines.push(`عن الشركة: ${ctx.companyDescription}`);
  lines.push(``);
  lines.push(`تعليمات مهمة:`);
  lines.push(`- رد بلغة ${ctx.agentLanguage === "ar" ? "عربية فصيحة ومهذبة" : "مناسبة"} دائمًا`);
  lines.push(`- كن مفيدًا ودقيقًا في ردودك`);
  lines.push(`- استخدم قاعدة المعرفة المتاحة للإجابة على أسئلة العملاء`);
  lines.push(`- إذا سأل العميل عن طلب، استخدم أداة get_order_status`);
  lines.push(`- إذا سأل عن أسئلة شائعة، استخدم search_faq`);
  lines.push(`- إذا كانت المشكلة معقدة، استخدم handoff_to_human`);
  lines.push(`- إذا احتاج العميل لتسجيل شكوى، استخدم create_support_ticket`);
  lines.push(`- لا تقدم معلومات خاطئة. إذا لم تعرف الإجابة، اعتذر بلطف واعرض تحويله للدعم البشري`);

  lines.push(...knowledgeLines);

  return lines.join("\n");
}
