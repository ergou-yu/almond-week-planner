import type { Evaluations, WeekPlan, WeekTask } from "@/types/planner";

export const defaultEvaluations = (): Evaluations => ({
  self: "",
  parent: "",
  teacher: "",
  institution: ""
});

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const createTask = (order = 0): WeekTask => ({
  id: makeId(),
  title: "新的小计划",
  detail: "",
  date: isoDate(new Date()),
  status: "pending",
  order
});

export const createDefaultPlan = (): WeekPlan => {
  const today = new Date();

  return {
    id: makeId(),
    title: "我的杏花周计划",
    bigGoal: "写下这周最重要的大目标，并把它拆成可以完成的小计划。",
    startDate: isoDate(today),
    endDate: isoDate(addDays(today, 6)),
    role: "student",
    tasks: [
      {
        ...createTask(0),
        title: "明确本周最重要的一件事",
        detail: "把大目标写成一句可以检查结果的话。"
      },
      {
        ...createTask(1),
        title: "安排每天的一个关键行动",
        detail: "每天只保留一个必须完成的核心任务。"
      },
      {
        ...createTask(2),
        title: "周末复盘并填写评价",
        detail: "记录高质完成、基本完成、停止和推迟的原因。"
      }
    ],
    evaluations: defaultEvaluations(),
    updatedAt: new Date().toISOString()
  };
};

export const normalizePlan = (plan: WeekPlan): WeekPlan => ({
  ...plan,
  evaluations: {
    ...defaultEvaluations(),
    ...plan.evaluations
  },
  tasks: [...plan.tasks].sort((a, b) => a.order - b.order)
});

export const localPlansKey = "almond-week-plans";

export const loadLocalPlans = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(localPlansKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WeekPlan[];
    return parsed.map(normalizePlan);
  } catch {
    return [];
  }
};

export const saveLocalPlans = (plans: WeekPlan[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(localPlansKey, JSON.stringify(plans.map(normalizePlan)));
};
