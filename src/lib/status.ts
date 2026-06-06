import type { EvaluationKey, TaskPriority, TaskStatus, UserRole } from "@/types/planner";
import { getEvaluationMeta, getPriorityMeta, getRoleMeta, getStatusMeta } from "@/lib/i18n";

export const STATUS_META: Record<TaskStatus, { label: string; description: string; color: string; bg: string; border: string }> =
  getStatusMeta("zh");

export const STATUS_ORDER: TaskStatus[] = ["excellent", "basic", "stopped", "postponed", "pending"];

export const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "medium", "low"];

export const PRIORITY_META: Record<TaskPriority, { label: string; description: string; color: string; bg: string; border: string }> =
  getPriorityMeta("zh");

export const ROLE_META: Record<UserRole, { label: string; description: string }> = getRoleMeta("zh");

export const EVALUATION_META: Record<EvaluationKey, { label: string; placeholder: string }> = getEvaluationMeta("zh");
