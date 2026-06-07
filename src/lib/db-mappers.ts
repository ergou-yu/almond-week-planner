import { defaultEvaluations, normalizePlan } from "@/lib/planner";
import type { EvaluationKey, TaskPriority, TaskStatus, UserRole, WeekPlan } from "@/types/planner";

const META_PREFIX = "\n\n<!-- almond-week-meta:";
const META_SUFFIX = " -->";

type TaskRow = {
  id: string;
  title: string;
  detail: string | null;
  task_date: string | null;
  status: TaskStatus;
  priority?: TaskPriority | null;
  sort_order: number;
};

type EvaluationRow = {
  kind: EvaluationKey;
  content: string | null;
};

type ShareLinkRow = {
  token: string;
};

export type PlanRow = {
  id: string;
  owner_id: string;
  title: string;
  big_goal: string | null;
  start_date: string;
  end_date: string;
  role: UserRole;
  updated_at: string;
  tasks?: TaskRow[];
  evaluations?: EvaluationRow[];
  share_links?: ShareLinkRow[];
};

type PlanStorageMeta = {
  priorities?: Record<string, TaskPriority>;
};

const isTaskPriority = (value: unknown): value is TaskPriority =>
  value === "low" || value === "medium" || value === "high" || value === "urgent";

const encodeBase64Url = (value: string) => {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  if (typeof Buffer !== "undefined") {
    return Buffer.from(normalized, "base64").toString("utf8");
  }

  return decodeURIComponent(escape(atob(normalized)));
};

const splitStoredBigGoal = (value: string | null): { bigGoal: string; meta: PlanStorageMeta } => {
  const text = value ?? "";
  const start = text.lastIndexOf(META_PREFIX);
  if (start === -1 || !text.endsWith(META_SUFFIX)) {
    return { bigGoal: text, meta: {} };
  }

  const encoded = text.slice(start + META_PREFIX.length, -META_SUFFIX.length);
  try {
    const parsed = JSON.parse(decodeBase64Url(encoded)) as PlanStorageMeta;
    return {
      bigGoal: text.slice(0, start),
      meta: parsed && typeof parsed === "object" ? parsed : {}
    };
  } catch {
    return { bigGoal: text, meta: {} };
  }
};

const withStorageMeta = (plan: WeekPlan) => {
  const priorities = Object.fromEntries(plan.tasks.map((task) => [task.id, task.priority ?? "medium"]));
  const encoded = encodeBase64Url(JSON.stringify({ priorities } satisfies PlanStorageMeta));
  return `${plan.bigGoal}${META_PREFIX}${encoded}${META_SUFFIX}`;
};

export const rowToPlan = (row: PlanRow): WeekPlan => {
  const evaluations = defaultEvaluations();
  const { bigGoal, meta } = splitStoredBigGoal(row.big_goal);

  for (const item of row.evaluations ?? []) {
    evaluations[item.kind] = item.content ?? "";
  }

  return normalizePlan({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    bigGoal,
    startDate: row.start_date,
    endDate: row.end_date,
    role: row.role,
    tasks: (row.tasks ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.detail ?? "",
      date: task.task_date ?? "",
      status: task.status,
      priority: task.priority ?? (isTaskPriority(meta.priorities?.[task.id]) ? meta.priorities[task.id] : "medium"),
      order: task.sort_order
    })),
    evaluations,
    shareToken: row.share_links?.[0]?.token,
    updatedAt: row.updated_at
  });
};

export const planToDbRows = (plan: WeekPlan, ownerId: string) => ({
  plan: {
    id: plan.id,
    owner_id: ownerId,
    title: plan.title,
    big_goal: withStorageMeta(plan),
    start_date: plan.startDate,
    end_date: plan.endDate,
    role: plan.role
  },
  tasks: plan.tasks.map((task, index) => ({
    id: task.id,
    plan_id: plan.id,
    title: task.title,
    detail: task.detail,
    task_date: task.date || null,
    status: task.status,
    sort_order: task.order ?? index
  })),
  evaluations: Object.entries(plan.evaluations).map(([kind, content]) => ({
    plan_id: plan.id,
    kind,
    content
  }))
});
