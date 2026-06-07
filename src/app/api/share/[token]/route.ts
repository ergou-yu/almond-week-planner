import { rowToPlan, type PlanRow } from "@/lib/db-mappers";
import { errorResponse, jsonResponse } from "@/lib/api";
import { getSupabaseAdminClient, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { defaultEvaluations } from "@/lib/planner";
import type { EvaluationKey, TaskStatus } from "@/types/planner";

type RouteContext = {
  params: Promise<{ token: string }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const planSelect = "*, tasks(*), evaluations(*)";
const allowedStatuses = new Set<TaskStatus>(["pending", "excellent", "basic", "stopped", "postponed"]);

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

const loadSharedPlan = async (token: string) => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("share_links")
    .select(`*, plans(${planSelect})`)
    .eq("token", token)
    .maybeSingle();

  if (error || !data?.plans) {
    return null;
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return {
    link: data,
    plan: rowToPlan(data.plans as PlanRow)
  };
};

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const { token } = await context.params;
  const shared = await loadSharedPlan(token);

  if (!shared) {
    return errorResponse("分享链接不存在或已过期。", 404);
  }

  return jsonResponse(
    {
      plan: {
        ...shared.plan,
        shareToken: token
      },
      permission: {
        canUpdateStatus: shared.link.can_update_status,
        canUpdateEvaluations: shared.link.can_update_evaluations
      }
    },
    { headers: corsHeaders }
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const { token } = await context.params;
  const shared = await loadSharedPlan(token);

  if (!shared) {
    return errorResponse("分享链接不存在或已过期。", 404);
  }

  const body = (await request.json().catch(() => ({}))) as {
    tasks?: Array<{ id: string; status: TaskStatus }>;
    evaluations?: Partial<Record<EvaluationKey, string>>;
  };

  const supabase = getSupabaseAdminClient();

  if (shared.link.can_update_status && Array.isArray(body.tasks)) {
    const taskIds = new Set(shared.plan.tasks.map((task) => task.id));
    const updates = body.tasks.filter((task) => taskIds.has(task.id) && allowedStatuses.has(task.status));

    for (const task of updates) {
      const { error } = await supabase
        .from("tasks")
        .update({ status: task.status })
        .eq("id", task.id)
        .eq("plan_id", shared.plan.id);

      if (error) {
        return errorResponse(`任务状态保存失败：${error.message}`, 500);
      }
    }

    if (updates.length > 0) {
      const { error } = await supabase.from("plans").update({ updated_at: new Date().toISOString() }).eq("id", shared.plan.id);
      if (error) {
        return errorResponse(`计划刷新失败：${error.message}`, 500);
      }
    }
  }

  if (shared.link.can_update_evaluations && body.evaluations) {
    const current = defaultEvaluations();
    for (const [kind, content] of Object.entries(body.evaluations)) {
      if (!(kind in current)) {
        continue;
      }

      const { error } = await supabase.from("evaluations").upsert(
        {
          plan_id: shared.plan.id,
          kind,
          content: String(content ?? "")
        },
        { onConflict: "plan_id,kind" }
      );

      if (error) {
        return errorResponse(`评价保存失败：${error.message}`, 500);
      }
    }
  }

  const updated = await loadSharedPlan(token);
  if (!updated) {
    return errorResponse("更新后读取失败。", 500);
  }

  return jsonResponse(
    {
      plan: {
        ...updated.plan,
        shareToken: token
      }
    },
    { headers: corsHeaders }
  );
}
