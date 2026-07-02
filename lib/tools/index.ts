import type { ToolDefinition, ToolHandler } from "@/types";
import { definition as getOrderStatusDef, handler as getOrderStatusHandler } from "./get-order-status";
import { definition as searchFaqDef, handler as searchFaqHandler } from "./search-faq";
import { definition as createSupportTicketDef, handler as createSupportTicketHandler } from "./create-support-ticket";
import { definition as handoffToHumanDef, handler as handoffToHumanHandler } from "./handoff-to-human";

export const toolDefinitions: ToolDefinition[] = [
  getOrderStatusDef,
  searchFaqDef,
  createSupportTicketDef,
  handoffToHumanDef,
];

const toolHandlers: Record<string, ToolHandler> = {
  get_order_status: getOrderStatusHandler,
  search_faq: searchFaqHandler,
  create_support_ticket: createSupportTicketHandler,
  handoff_to_human: handoffToHumanHandler,
};

export function executeTool(
  name: string,
  args: Record<string, unknown>,
  phone?: string
) {
  const handler = toolHandlers[name];
  if (!handler) {
    return { status: "error" as const, message: `أداة غير معروفة: ${name}` };
  }
  return handler(args, phone);
}
