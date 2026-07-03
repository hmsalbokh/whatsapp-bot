import { getSupabase } from './supabase';
import type { ToolDefinition, ToolHandler, ToolResult } from '@/lib/types';

/**
 * Tool: Get business hours from environment
 */
export const getBusinessHoursDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_business_hours',
    description: 'Get the business hours of the company',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export const getBusinessHoursHandler: ToolHandler = async () => {
  const hours = process.env.BUSINESS_HOURS || 'Not specified';
  return {
    status: 'success',
    data: { hours },
  };
};

/**
 * Tool: Get shipping info (placeholder)
 */
export const getShippingInfoDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_shipping_info',
    description: 'Get shipping and delivery information',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export const getShippingInfoHandler: ToolHandler = async () => {
  return {
    status: 'success',
    data: {
      info: 'Shipping takes 2-5 business days within the kingdom. Free shipping on orders over 200 SAR.',
    },
  };
};

/**
 * Tool: Escalate to human agent
 */
export const escalateToHumanDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'escalate_to_human',
    description: 'Escalate the conversation to a human agent',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for escalation',
        },
      },
      required: ['reason'],
    },
  },
};

export const escalateToHumanHandler: ToolHandler = async (
  args: Record<string, unknown>,
  conversationId?: string
) => {
  const reason = String(args.reason ?? 'No reason provided');
  if (conversationId) {
    // Mark conversation as handed off to human
    await (getSupabase() as any)
      .from('conversations')
      .update({ human_handoff: true, bot_enabled: false })
      .eq('id', conversationId);
  }
  return {
    status: 'success',
    data: {
      message: 'تم تحويل المحادثة إلى موظف بشري. سيتواصل معك فريق الدعم قريبًا.',
    },
  };
};

/**
 * Tool: Get current date/time (useful for context)
 */
export const getCurrentTimeDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_current_time',
    description: 'Get current date and time',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

export const getCurrentTimeHandler: ToolHandler = async () => {
  return {
    status: 'success',
    data: { time: new Date().toISOString() },
  };
};

/**
 * Export all tool definitions and handlers
 */
export const toolDefinitions: ToolDefinition[] = [
  getBusinessHoursDef,
  getShippingInfoDef,
  escalateToHumanDef,
  getCurrentTimeDef,
];

export const toolHandlers: Record<string, ToolHandler> = {
  get_business_hours: getBusinessHoursHandler,
  get_shipping_info: getShippingInfoHandler,
  escalate_to_human: escalateToHumanHandler,
  get_current_time: getCurrentTimeHandler,
};

/**
 * Execute a tool by name
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  conversationId?: string
): Promise<ToolResult> {
  const handler = toolHandlers[name];
  if (!handler) {
    return {
      status: 'error',
      message: `Unknown tool: ${name}`,
    };
  }
  try {
    return await handler(args, conversationId);
  } catch (err: any) {
    return {
      status: 'error',
      message: err.message ?? 'Unknown error',
    };
  }
}