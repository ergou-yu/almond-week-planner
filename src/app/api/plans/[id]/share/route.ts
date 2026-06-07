import { errorResponse, jsonResponse } from "@/lib/api";
import { getSupabaseAdminClient, getUserFromAuthHeader, isSupabaseServerConfigured } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const user = await getUserFromAuthHeader(request.headers.get("authorization"));
  if (!user) {
    return errorResponse("请先登录后生成在线分享链接。", 401);
  }

  const { id } = await context.params;
  const supabase = getSupabaseAdminClient();

  const { data: plan } = await supabase.from("plans").select("id, owner_id").eq("id", id).maybeSingle();
  if (!plan || plan.owner_id !== user.id) {
    return errorResponse("没有权限分享这个计划。", 403);
  }

  const { data: existingLinks } = await supabase
    .from("share_links")
    .select("*")
    .eq("plan_id", id)
    .eq("permission", "status_review")
    .order("created_at", { ascending: false })
    .limit(5);
  const existing = existingLinks?.find((link) => !link.expires_at || new Date(link.expires_at).getTime() > Date.now());

  const link = existing
    ? existing
    : (
        await supabase
          .from("share_links")
          .insert({
            plan_id: id,
            permission: "status_review",
            can_update_status: true,
            can_update_evaluations: true,
            created_by: user.id
          })
          .select("*")
          .single()
      ).data;

  if (!link) {
    return errorResponse("分享链接创建失败。", 500);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  return jsonResponse({
    token: link.token,
    url: `${baseUrl}/share/${link.token}`
  });
}
