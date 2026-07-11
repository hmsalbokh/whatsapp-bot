import type { ToolDefinition, ToolHandler } from "@/types";
import { getServiceClient } from "@/lib/supabase";
import { z } from "zod";

function getSupabase() { return getServiceClient(); }

const STATUS_MAP: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

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

export const handler: ToolHandler = async (args) => {
  const parsed = paramsSchema.safeParse(args);
  if (!parsed.success) {
    return {
      status: "error",
      message: "الرجاء تقديم رقم طلب صحيح",
    };
  }

  const { data: order } = await getSupabase()
    .from("orders")
    .select("id, customer_name, items, total, status, updated_at")
    .eq("id", parsed.data.order_id)
    .single();

  if (!order) {
    return {
      status: "error",
      message: `لم يتم العثور على طلب برقم ${parsed.data.order_id}`,
    };
  }

  const row = order as unknown as {
    id: string;
    customer_name: string;
    items: string[];
    total: number;
    status: string;
    updated_at: string;
  };

  return {
    status: "success",
    data: {
      id: row.id,
      status: STATUS_MAP[row.status] ?? row.status,
      items: row.items.join("، "),
      total: `${row.total} ريال`,
      updatedAt: new Date(row.updated_at).toLocaleDateString("ar-SA"),
    },
  };
};
