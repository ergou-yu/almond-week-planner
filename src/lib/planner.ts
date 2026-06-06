import type { Evaluations, WeekPlan, WeekTask } from "@/types/planner";
import { getDefaultPlanText, type Language } from "@/lib/i18n";

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

export const createTask = (order = 0, language: Language = "zh"): WeekTask => ({
  id: makeId(),
  title: getDefaultPlanText(language).taskTitle,
  detail: "",
  date: isoDate(new Date()),
  status: "pending",
  order
});

export const createDefaultPlan = (language: Language = "zh"): WeekPlan => {
  const today = new Date();
  const defaults = getDefaultPlanText(language);

  return {
    id: makeId(),
    title: defaults.planTitle,
    bigGoal: defaults.bigGoal,
    startDate: isoDate(today),
    endDate: isoDate(addDays(today, 6)),
    role: "student",
    tasks: defaults.tasks.map((task, index) => ({
      ...createTask(index, language),
      title: task.title,
      detail: task.detail
    })),
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
