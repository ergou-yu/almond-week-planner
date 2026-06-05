import type { EvaluationKey, TaskStatus, UserRole } from "@/types/planner";

export const STATUS_META: Record<
  TaskStatus,
  {
    label: string;
    description: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  pending: {
    label: "未标记",
    description: "尚未选择完成状态",
    color: "#64748b",
    bg: "#f8fafc",
    border: "#cbd5e1"
  },
  excellent: {
    label: "高质完成",
    description: "按计划完成，并且质量高于预期",
    color: "#15803d",
    bg: "#dcfce7",
    border: "#86efac"
  },
  basic: {
    label: "基本完成",
    description: "完成主要内容，但仍有可改进部分",
    color: "#a16207",
    bg: "#fef3c7",
    border: "#facc15"
  },
  stopped: {
    label: "停止",
    description: "任务中止或暂时不再推进",
    color: "#b91c1c",
    bg: "#fee2e2",
    border: "#fca5a5"
  },
  postponed: {
    label: "推迟",
    description: "延后执行，需要重新安排时间",
    color: "#7e22ce",
    bg: "#f3e8ff",
    border: "#d8b4fe"
  }
};

export const STATUS_ORDER: TaskStatus[] = ["excellent", "basic", "stopped", "postponed", "pending"];

export const ROLE_META: Record<UserRole, { label: string; description: string }> = {
  student: {
    label: "学生",
    description: "制定计划、更新状态、填写自我评价"
  },
  parent: {
    label: "家长",
    description: "监督完成情况并填写家长评价"
  },
  teacher: {
    label: "老师",
    description: "查看计划并给出学习反馈"
  },
  institution: {
    label: "机构",
    description: "用于机构导师或学习顾问跟进"
  }
};

export const EVALUATION_META: Record<EvaluationKey, { label: string; placeholder: string }> = {
  self: {
    label: "自我评价",
    placeholder: "我这周做得好的地方、遇到的困难、下周要调整的行动..."
  },
  parent: {
    label: "家长评价",
    placeholder: "观察到的完成情况、鼓励和建议..."
  },
  teacher: {
    label: "老师评价",
    placeholder: "学习方法、任务质量、下一步建议..."
  },
  institution: {
    label: "机构/老师评价",
    placeholder: "机构或导师的综合反馈..."
  }
};
