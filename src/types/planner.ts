export type TaskStatus = "pending" | "excellent" | "basic" | "stopped" | "postponed";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type UserRole = "student" | "parent" | "teacher" | "institution";

export type EvaluationKey = "self" | "parent" | "teacher" | "institution";

export type WeekTask = {
  id: string;
  title: string;
  detail: string;
  date: string;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
};

export type Evaluations = Record<EvaluationKey, string>;

export type WeekPlan = {
  id: string;
  title: string;
  bigGoal: string;
  startDate: string;
  endDate: string;
  ownerId?: string;
  role: UserRole;
  tasks: WeekTask[];
  evaluations: Evaluations;
  shareToken?: string;
  updatedAt?: string;
};

export type AiSuggestion = {
  summary: string;
  strengths: string[];
  risks: string[];
  revisions: string[];
  nextSteps: string[];
};
