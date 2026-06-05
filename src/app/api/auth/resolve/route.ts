import { errorResponse, jsonResponse } from "@/lib/api";
import { getSupabaseAdminClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isSupabaseServerConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const { identifier } = (await request.json().catch(() => ({}))) as { identifier?: string };
  const value = identifier?.trim();

  if (!value) {
    return errorResponse("请输入邮箱或用户名。");
  }

  if (value.includes("@")) {
    return jsonResponse({ email: value });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", value)
    .maybeSingle();

  if (error || !data) {
    return errorResponse("没有找到这个用户名。", 404);
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.id);

  if (userError || !userData.user?.email) {
    return errorResponse("账号信息不可用。", 404);
  }

  return jsonResponse({ email: userData.user.email });
}
