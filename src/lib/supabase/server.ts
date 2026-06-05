import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const isSupabaseServerConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );

export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

export const getUserFromAuthHeader = async (authorization: string | null) => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.replace("Bearer ", "").trim();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    return null;
  }

  return data.user;
};
