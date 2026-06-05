export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const jsonResponse = <T>(data: T, init?: ResponseInit) =>
  Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {})
    }
  });

export const errorResponse = (message: string, status = 400) => jsonResponse({ error: message }, { status });

export const requireSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new ApiError("Supabase is not configured.", 503);
  }
};
