import type { ToolDefinition, ToolHandler } from "@/types";
import { createMockTicket } from "@/lib/mock-data";
import { z } from "zod";

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

export const handler: ToolHandler = (args) => {
  const parsed = paramsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      status: "error",
      message: "بيانات غير صحيحة. الرجاء تقديم الاسم ووصف المشكلة",
    };
  }

  const ticket = createMockTicket(
    parsed.data.customer_name,
    parsed.data.issue,
    parsed.data.priority
  );

  return {
    status: "success",
    data: {
      ticketId: ticket.id,
      message: `تم إنشاء تذكرة دعم برقم ${ticket.id}. سيتم التواصل معك قريبًا.`,
    },
  };
};
