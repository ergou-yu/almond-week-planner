import type { EvaluationKey, TaskStatus, UserRole } from "@/types/planner";
import { getEvaluationMeta, getRoleMeta, getStatusMeta } from "@/lib/i18n";

export const STATUS_META: Record<TaskStatus, { label: string; description: string; color: string; bg: string; border: string }> =
  getStatusMeta("zh");

export const STATUS_ORDER: TaskStatus[] = ["excellent", "basic", "stopped", "postponed", "pending"];

export const ROLE_META: Record<UserRole, { label: string; description: string }> = getRoleMeta("zh");

export const EVALUATION_META: Record<EvaluationKey, { label: string; placeholder: string }> = getEvaluationMeta("zh");
