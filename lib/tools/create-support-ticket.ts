import type { ToolDefinition, ToolHandler } from "@/types";
import { getServiceClient } from "@/lib/supabase";
import { z } from "zod";

function getSupabase() { return getServiceClient(); }

const paramsSchema = z.object({
  customer_name: z.string().min(1, "customer_name is required"),
  issue: z.string().min(1, "issue description is required"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "create_support_ticket",
    description: "إنشاء تذكرة دعم فني جديدة لمشكلة العميل",
    parameters: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "اسم العميل",
        },
        issue: {
          type: "string",
          description: "وصف المشكلة",
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "أولوية التذكرة (منخفضة، متوسطة، عالية)",
        },
      },
      required: ["customer_name", "issue"],
    },
  },
};

export const handler: ToolHandler = async (args, context) => {
  const parsed = paramsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      status: "error",
      message: "بيانات غير صحيحة. الرجاء تقديم الاسم ووصف المشكلة",
    };
  }

  const { data: created, error } = await getSupabase()
    .from("support_tickets")
    .insert({
      project_id: context?.projectId ?? null,
      customer_name: parsed.data.customer_name,
      issue: parsed.data.issue,
      priority: parsed.data.priority,
      status: "open",
    } as any)
    .select("id")
    .single();

  if (error || !created) {
    return {
      status: "error",
      message: "حدث خطأ أثناء إنشاء التذكرة. الرجاء المحاولة مرة أخرى.",
    };
  }

  const ticketId = (created as unknown as { id: string }).id;

  return {
    status: "success",
    data: {
      ticketId,
      message: `تم إنشاء تذكرة دعم برقم ${ticketId}. سيتم التواصل معك قريبًا.`,
    },
  };
};
