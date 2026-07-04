import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addMessage, isHandoffRequested } from "@/lib/memory";
import { processWithTools } from "@/lib/agent-runtime";
import { requireProjectAccess } from "@/lib/api-guard";
import { ok, err } from "@/lib/api-utils";
import { OpenRouterError } from "@/lib/openrouter";

const chatSchema = z.object({
  from: z.string().min(1),
  body: z.string().min(1),
  projectId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const start = Date.now();

  try {
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!user) return err("Unauthorized", 401);

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return err("Invalid JSON body", 400);
    }

    const parsed = chatSchema.safeParse(rawBody);
    if (!parsed.success) {
      return err(
        "Validation failed",
        422,
        JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    const { from, body, projectId } = parsed.data;

    // Verify caller has access to this project
    await requireProjectAccess(user.id, projectId);

    await addMessage(projectId, from, { role: "user", content: body });

    if (await isHandoffRequested(projectId, from)) {
      return ok({
        reply: "تم تحويل محادثتك إلى فريق الدعم البشري. سيتم الرد عليك قريبًا.",
        duration: Date.now() - start,
      });
    }

    const reply = await processWithTools(projectId, from);

    return ok({ reply, duration: Date.now() - start });
  } catch (e) {
    if (e instanceof OpenRouterError) {
      return err("OpenRouter error", 502, e.message);
    }
    return err("Internal server error", 500, (e as Error).message);
  }
}
