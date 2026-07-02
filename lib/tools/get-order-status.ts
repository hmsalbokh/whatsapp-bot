import type { ToolDefinition, ToolHandler } from "@/types";
import { findOrderById, getStatusText } from "@/lib/mock-data";
import { z } from "zod";

const paramsSchema = z.object({
  order_id: z.string().min(1, "order_id is required"),
});

export const definition: ToolDefinition = {
  type: "function",
  function: {
    name: "get_order_status",
    description: "استعلام عن حالة طلب بواسطة رقم الطلب",
    parameters: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "رقم الطلب (مثل ORD-1001)",
        },
      },
      required: ["order_id"],
    },
  },
};

export const handler: ToolHandler = (args) => {
  const parsed = paramsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      status: "error",
      message: "الرجاء تقديم رقم طلب صحيح",
    };
  }

  const order = findOrderById(parsed.data.order_id);
  if (!order) {
    return {
      status: "error",
      message: `لم يتم العثور على طلب برقم ${parsed.data.order_id}`,
    };
  }

  return {
    status: "success",
    data: {
      id: order.id,
      status: getStatusText(order.status),
      items: order.items.join("، "),
      total: `${order.total} ريال`,
      updatedAt: new Date(order.updatedAt).toLocaleDateString("ar-SA"),
    },
  };
};
