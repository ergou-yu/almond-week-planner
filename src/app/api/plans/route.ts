import { rowToPlan, type PlanRow, planToDbRows } from "@/lib/db-mappers";
import { errorResponse, jsonResponse } from "@/lib/api";
import { getSupabaseAdminClient, getUserFromAuthHeader, isSupabaseServerConfigured } from "@/lib/supabase/server";
import type { WeekPlan } from "@/types/planner";

const planSelect = "*, tasks(*), evaluations(*), share_links(token)";

export async function GET(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return errorResponse("请先登录。", 401);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("plans")
    .select(planSelect)
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ plans: (data as PlanRow[]).map(rowToPlan) });
}

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return errorResponse("请先登录。", 401);
  }

  const plan = (await request.json().catch(() => null)) as WeekPlan | null;
  if (!plan?.id || !plan.title) {
    return errorResponse("计划数据不完整。");
  }

  const supabase = getSupabaseAdminClient();
  const rows = planToDbRows(plan, user.id);
  const { error: planError } = await supabase.from("plans").upsert(rows.plan, { onConflict: "id" });

  if (planError) {
    return errorResponse(planError.message, 500);
  }

  await supabase.from("tasks").delete().eq("plan_id", plan.id);
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

  const { data, error } = await supabase.from("plans").select(planSelect).eq("id", plan.id).single();
  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ plan: rowToPlan(data as PlanRow) });
}
