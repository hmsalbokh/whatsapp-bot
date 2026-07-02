import type { ToolDefinition, ToolHandler } from "@/types";
import { setHandoffRequested } from "@/lib/memory";
import { z } from "zod";

const paramsSchema = z.object({
  reason: z.string().min(1, "reason is required"),
});

export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "handoff_to_human",
    description:
      "تحويل المحادثة إلى وكيل بشري إذا كانت المشكلة معقدة أو طلب العميل التحدث مع موظف",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "سبب تحويل المحادثة للدعم البشري",
        },
      },
      required: ["reason"],
    },
  },
};

export const handler: ToolHandler = (args, phone?: string) => {
  const parsed = paramsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      status: "error",
      message: "الرجاء تقديم سبب تحويل المحادثة",
    };
  }

  if (phone) {
    setHandoffRequested(phone, parsed.data.reason);
  }

  return {
    status: "success",
    data: {
      message:
        "تم تحويل المحادثة إلى أحد ممثلي خدمة العملاء. سيتواصل معك فريق الدعم قريبًا. شكرًا لصبرك!",
    },
  };
};
