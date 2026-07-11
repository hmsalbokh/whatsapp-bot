import type { ToolDefinition, ToolHandler } from "@/types";
import { getServiceClient } from "@/lib/supabase";
import { z } from "zod";

function getSupabase() { return getServiceClient(); }

const paramsSchema = z.object({
  query: z.string().min(1, "query is required"),
});

export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "search_faq",
    description: "البحث في الأسئلة الشائعة عن معلومات مفيدة للعميل",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "استفسار العميل للبحث في قاعدة المعرفة",
        },
      },
      required: ["query"],
    },
  },
};

export const handler: ToolHandler = async (args) => {
  const parsed = paramsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      status: "error",
      message: "الرجاء تقديم استفسار للبحث",
    };
  }

  const q = parsed.data.query.toLowerCase();

  const { data: results } = await getSupabase()
    .from("knowledge_items")
    .select("question, answer, category, keywords")
    .eq("is_active", true);

  const rows = (results ?? []) as unknown as {
    question: string;
    answer: string;
    category: string | null;
    keywords: string[];
  }[];

  const matched = rows.filter(
    (r) =>
      r.question.toLowerCase().includes(q) ||
      (r.keywords ?? []).some((k) => k.toLowerCase().includes(q)) ||
      r.answer.toLowerCase().includes(q)
  );

  if (matched.length === 0) {
    return {
      status: "success",
      data: {
        found: false,
        message: "لم يتم العثور على نتائج لهذا الاستفسار",
      },
    };
  }

  return {
    status: "success",
    data: {
      found: true,
      results: matched.map((r) => ({
        question: r.question,
        answer: r.answer,
        category: r.category ?? "",
      })),
    },
  };
};
