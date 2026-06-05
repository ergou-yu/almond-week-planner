import { rowToPlan, type PlanRow, planToDbRows } from "@/lib/db-mappers";
import { errorResponse, jsonResponse } from "@/lib/api";
import { getSupabaseAdminClient, getUserFromAuthHeader, isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { WeekPlan } from "@/types/planner";

const planSelect = "*, tasks(*), evaluations(*), share_links(token)";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return errorResponse("请先登录。", 401);
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("plans")
    .select(planSelect)
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (error) {
    return errorResponse(error.message, 404);
  }

  return jsonResponse({ plan: rowToPlan(data as PlanRow) });
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return errorResponse("请先登录。", 401);
  }

  const { id } = await context.params;
  const plan = (await request.json().catch(() => null)) as WeekPlan | null;
  if (!plan || plan.id !== id) {
    return errorResponse("计划数据不匹配。");
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("plans").select("owner_id").eq("id", id).maybeSingle();

  if (existing && existing.owner_id !== user.id) {
    return errorResponse("没有权限修改这个计划。", 403);
  }

  const rows = planToDbRows(plan, user.id);
  const { error: planError } = await supabase.from("plans").upsert(rows.plan, { onConflict: "id" });
  if (planError) {
    return errorResponse(planError.message, 500);
  }

  await supabase.from("tasks").delete().eq("plan_id", id);
  if (rows.tasks.length > 0) {
    const { error: tasksError } = await supabase.from("tasks").insert(rows.tasks);
    if (tasksError) {
      return errorResponse(tasksError.message, 500);
    }
  }

  const { error: evalError } = await supabase
    .from("evaluations")
    .upsert(rows.evaluations, { onConflict: "plan_id,kind" });

  if (evalError) {
    return errorResponse(evalError.message, 500);
  }

  const { data, error } = await supabase.from("plans").select(planSelect).eq("id", id).single();
  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ plan: rowToPlan(data as PlanRow) });
}
