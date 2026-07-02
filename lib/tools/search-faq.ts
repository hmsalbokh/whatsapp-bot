import type { ToolDefinition, ToolHandler } from "@/types";
import { searchFaq } from "@/lib/mock-data";
import { z } from "zod";

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

export const handler: ToolHandler = (args) => {
  const parsed = paramsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      status: "error",
      message: "الرجاء تقديم استفسار للبحث",
    };
  }

  const results = searchFaq(parsed.data.query);

  if (results.length === 0) {
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
      results: results.map((r) => ({
        question: r.question,
        answer: r.answer,
        category: r.category,
      })),
    },
  };
};
