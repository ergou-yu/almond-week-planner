import { defaultEvaluations, normalizePlan } from "@/lib/planner";
import type { EvaluationKey, TaskStatus, UserRole, WeekPlan } from "@/types/planner";

type TaskRow = {
  id: string;
  title: string;
  detail: string | null;
  task_date: string | null;
  status: TaskStatus;
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

export const rowToPlan = (row: PlanRow): WeekPlan => {
  const evaluations = defaultEvaluations();

  for (const item of row.evaluations ?? []) {
    evaluations[item.kind] = item.content ?? "";
  }

  return normalizePlan({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    bigGoal: row.big_goal ?? "",
    startDate: row.start_date,
    endDate: row.end_date,
    role: row.role,
    tasks: (row.tasks ?? []).map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.detail ?? "",
      date: task.task_date ?? "",
      status: task.status,
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
    big_goal: plan.bigGoal,
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
