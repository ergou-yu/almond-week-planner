"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileDown,
  Home,
  Leaf,
  Link2,
  Loader2,
  LogIn,
  PanelTop,
  Plus,
  Save,
  Share2,
  Sparkles,
  UserRound,
  Users
} from "lucide-react";
import type { Session, User } from "@supabase/supabase-js";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exportPlanHtml, exportPlanPdf } from "@/lib/exporters";
import { createDefaultPlan, createTask, loadLocalPlans, normalizePlan, saveLocalPlans } from "@/lib/planner";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/browser";
import { EVALUATION_META, ROLE_META, STATUS_META, STATUS_ORDER } from "@/lib/status";
import type { AiSuggestion, EvaluationKey, TaskStatus, UserRole, WeekPlan, WeekTask } from "@/types/planner";

type PlannerAppProps = {
  initialView: "editor" | "dashboard" | "auth";
};

type Notice = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
};

const statusOptions = STATUS_ORDER.filter((status) => status !== "pending");

const noticeStyles: Record<Notice["tone"], string> = {
  info: "border-blossom-sky/30 bg-white/80 text-blossom-ink",
  success: "border-green-300 bg-green-50 text-green-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-800"
};

const formatRange = (plan: WeekPlan) => `${plan.startDate || "未设置"} 至 ${plan.endDate || "未设置"}`;

const getAuthHeader = (session: Session | null) => {
  if (!session?.access_token) {
    return null;
  }

  return `Bearer ${session.access_token}`;
};

const parseApiError = async (response: Response) => {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || response.statusText || "请求失败";
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08
    }
  }
};

const spring = {
  type: "spring",
  stiffness: 260,
  damping: 24
} as const;

export function PlannerApp({ initialView }: PlannerAppProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const cloudConfigured = isSupabaseBrowserConfigured();
  const [view, setView] = useState(initialView);
  const [plans, setPlans] = useState<WeekPlan[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice>({
    tone: "info",
    text: "可以先用预设角色离线创建计划；配置 Supabase 后可注册账号、跨设备同步和分享协作。"
  });
  const [syncing, setSyncing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePlan = plans.find((plan) => plan.id === activeId) ?? plans[0];

  const updatePlansState = useCallback((nextPlans: WeekPlan[], nextActiveId?: string) => {
    const normalized = nextPlans.map(normalizePlan);
    setPlans(normalized);
    saveLocalPlans(normalized);
    setActiveId((current) => nextActiveId ?? (normalized.some((plan) => plan.id === current) ? current : normalized[0]?.id ?? ""));
  }, []);

  const savePlanToCloud = useCallback(
    async (plan: WeekPlan) => {
      const authHeader = getAuthHeader(session);
      if (!authHeader) {
        return null;
      }

      setSyncing(true);
      try {
        const response = await fetch(`/api/plans/${plan.id}`, {
          method: "PUT",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(plan)
        });

        if (!response.ok) {
          throw new Error(await parseApiError(response));
        }

        const data = (await response.json()) as { plan: WeekPlan };
        setNotice({ tone: "success", text: "已同步到云端账号。" });
        return data.plan;
      } catch (error) {
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "云同步失败。"
        });
        return null;
      } finally {
        setSyncing(false);
      }
    },
    [session]
  );

  const scheduleCloudSave = useCallback(
    (plan: WeekPlan) => {
      if (!session) {
        return;
      }

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }

      syncTimer.current = setTimeout(() => {
        void savePlanToCloud(plan);
      }, 700);
    },
    [savePlanToCloud, session]
  );

  const replacePlan = useCallback(
    (nextPlan: WeekPlan, options: { sync?: boolean } = { sync: true }) => {
      const normalized = normalizePlan({
        ...nextPlan,
        updatedAt: new Date().toISOString()
      });
      const nextPlans = plans.some((plan) => plan.id === normalized.id)
        ? plans.map((plan) => (plan.id === normalized.id ? normalized : plan))
        : [normalized, ...plans];

      setPlans(nextPlans);
      saveLocalPlans(nextPlans);
      setActiveId(normalized.id);

      if (options.sync) {
        scheduleCloudSave(normalized);
      }
    },
    [plans, scheduleCloudSave]
  );

  const loadCloudPlans = useCallback(
    async (currentSession: Session) => {
      const authHeader = getAuthHeader(currentSession);
      if (!authHeader) {
        return;
      }

      setSyncing(true);
      try {
        const response = await fetch("/api/plans", {
          headers: {
            Authorization: authHeader
          }
        });

        if (!response.ok) {
          throw new Error(await parseApiError(response));
        }

        const data = (await response.json()) as { plans: WeekPlan[] };
        const next = data.plans.length ? data.plans : plans;
        updatePlansState(next.length ? next : [createDefaultPlan()], next[0]?.id);
        setNotice({ tone: "success", text: "已读取你的云端周计划。" });
      } catch (error) {
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : "读取云端计划失败。"
        });
      } finally {
        setSyncing(false);
      }
    },
    [plans, updatePlansState]
  );

  useEffect(() => {
    const stored = loadLocalPlans();
    const initial = stored.length ? stored : [createDefaultPlan()];
    updatePlansState(initial, initial[0]?.id);
  }, [updatePlansState]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      if (data.session) {
        void loadCloudPlans(data.session);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession) {
        void loadCloudPlans(nextSession);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCloudPlans, supabase]);

  const createPlan = () => {
    const next = createDefaultPlan();
    updatePlansState([next, ...plans], next.id);
    setView("editor");
    setNotice({ tone: "success", text: "新的周计划已经创建。" });
  };

  const duplicatePlan = () => {
    if (!activePlan) {
      return;
    }

    const copy: WeekPlan = {
      ...activePlan,
      id: crypto.randomUUID(),
      title: `${activePlan.title} 副本`,
      shareToken: undefined,
      tasks: activePlan.tasks.map((task, index) => ({
        ...task,
        id: crypto.randomUUID(),
        order: index
      })),
      updatedAt: new Date().toISOString()
    };
    updatePlansState([copy, ...plans], copy.id);
    setView("editor");
  };

  const updateActivePlan = (patch: Partial<WeekPlan>) => {
    if (!activePlan) {
      return;
    }
    replacePlan({ ...activePlan, ...patch });
  };

  const updateTask = (taskId: string, patch: Partial<WeekTask>) => {
    if (!activePlan) {
      return;
    }

    replacePlan({
      ...activePlan,
      tasks: activePlan.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    });
  };

  const addTask = () => {
    if (!activePlan) {
      return;
    }

    replacePlan({
      ...activePlan,
      tasks: [...activePlan.tasks, createTask(activePlan.tasks.length)]
    });
  };

  const removeTask = (taskId: string) => {
    if (!activePlan) {
      return;
    }

    replacePlan({
      ...activePlan,
      tasks: activePlan.tasks
        .filter((task) => task.id !== taskId)
        .map((task, index) => ({
          ...task,
          order: index
        }))
    });
  };

  const updateEvaluation = (key: EvaluationKey, value: string) => {
    if (!activePlan) {
      return;
    }

    replacePlan({
      ...activePlan,
      evaluations: {
        ...activePlan.evaluations,
        [key]: value
      }
    });
  };

  const syncNow = async () => {
    if (!activePlan) {
      return;
    }

    if (!session) {
      setNotice({ tone: "warning", text: "还没有登录。当前计划已保存在本机，可以先注册或登录后再同步。" });
      setView("auth");
      return;
    }

    const saved = await savePlanToCloud(activePlan);
    if (saved) {
      replacePlan(saved, { sync: false });
    }
  };

  const createShareLink = async () => {
    if (!activePlan) {
      return;
    }

    if (!session) {
      setNotice({
        tone: "warning",
        text: cloudConfigured
          ? "在线链接分享需要先登录真实账号并同步计划。登录后再点这里，会生成可协作的 /share 链接。"
          : "当前没有配置 Supabase 云端，所以不能生成在线协作链接。你可以先导出独立 HTML 文件分享。"
      });
      setView("auth");
      return;
    }

    await syncNow();
    const authHeader = getAuthHeader(session);
    if (!authHeader) {
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(`/api/plans/${activePlan.id}/share`, {
        method: "POST",
        headers: {
          Authorization: authHeader
        }
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const data = (await response.json()) as { token: string; url: string };
      const next = { ...activePlan, shareToken: data.token };
      replacePlan(next, { sync: false });
      await navigator.clipboard?.writeText(data.url).catch(() => undefined);
      setNotice({ tone: "success", text: `分享链接已生成并尝试复制：${data.url}` });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "生成分享链接失败。"
      });
    } finally {
      setSyncing(false);
    }
  };

  const requestAiSuggestion = async () => {
    if (!activePlan) {
      return;
    }

    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(activePlan)
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const data = (await response.json()) as { suggestion: AiSuggestion; notice?: string };
      setAiSuggestion(data.suggestion);
      setNotice({
        tone: data.notice ? "warning" : "success",
        text: data.notice || "AI 已给出计划建议。"
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "AI 建议生成失败。"
      });
    } finally {
      setAiLoading(false);
    }
  };

  const exportPdf = async () => {
    if (!activePlan) {
      return;
    }

    try {
      await exportPlanPdf(activePlan);
      setNotice({ tone: "success", text: "PDF 已开始下载，里面包含可勾选状态和评价输入区。" });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? `PDF 导出失败：${error.message}` : "PDF 导出失败。"
      });
    }
  };

  const exportHtml = () => {
    if (!activePlan) {
      return;
    }

    exportPlanHtml(activePlan);
    setNotice({ tone: "success", text: "独立 HTML 文件已开始下载。" });
  };

  return (
    <main className="app-shell min-h-dvh pb-24 text-blossom-ink md:pb-10">
      <div className="ambient-layer" aria-hidden="true">
        <span className="branch-stroke branch-stroke-a" />
        <span className="branch-stroke branch-stroke-b" />
        <span className="branch-stroke branch-stroke-c" />
      </div>
      <div className="petal petal-a" />
      <div className="petal petal-b" />
      <div className="petal petal-c" />
      <div className="petal petal-d" />
      <div className="petal petal-e" />
      <div className="petal petal-f" />

      <TopNav
        activeView={view}
        cloudConfigured={cloudConfigured}
        syncing={syncing}
        user={user}
        onCreatePlan={createPlan}
        onViewChange={setView}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-8 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:pt-8">
        <div className="min-w-0">
          <HeroPanel activePlan={activePlan} onViewDashboard={() => setView("dashboard")} />

          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${noticeStyles[notice.tone]}`}>
            {notice.text}
          </div>

          <AnimatePresence mode="wait">
            {view === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mt-5"
              >
                <DashboardView
                  activeId={activeId}
                  plans={plans}
                  onCreatePlan={createPlan}
                  onDuplicatePlan={duplicatePlan}
                  onSelect={(id) => {
                    setActiveId(id);
                    setView("editor");
                  }}
                />
              </motion.div>
            ) : view === "auth" ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mt-5"
              >
                <AuthPanel
                  cloudConfigured={cloudConfigured}
                  session={session}
                  supabase={supabase}
                  onNotice={setNotice}
                  onLocalRole={(role) => {
                    if (activePlan) {
                      replacePlan({ ...activePlan, role }, { sync: false });
                    }
                  }}
                  onSignedOut={() => {
                    setSession(null);
                    setUser(null);
                  }}
                  onSuccess={(nextSession) => {
                    setSession(nextSession);
                    setUser(nextSession?.user ?? null);
                    setView("dashboard");
                    if (nextSession) {
                      void loadCloudPlans(nextSession);
                    }
                  }}
                />
              </motion.div>
            ) : activePlan ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="mt-5"
              >
                <PlanEditor
                  plan={activePlan}
                  onAddTask={addTask}
                  onRemoveTask={removeTask}
                  onUpdateEvaluation={updateEvaluation}
                  onUpdatePlan={updateActivePlan}
                  onUpdateTask={updateTask}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <ControlPanel
            aiLoading={aiLoading}
            aiSuggestion={aiSuggestion}
            cloudConfigured={cloudConfigured}
            onAi={requestAiSuggestion}
            onExportHtml={exportHtml}
            onExportPdf={exportPdf}
            onShare={createShareLink}
            onSync={syncNow}
            plan={activePlan}
            session={session}
            syncing={syncing}
          />
        </aside>
      </section>

      <MobileDock onCreatePlan={createPlan} onShare={createShareLink} onSync={syncNow} onViewChange={setView} />
    </main>
  );
}

function TopNav({
  activeView,
  cloudConfigured,
  syncing,
  user,
  onCreatePlan,
  onViewChange
}: {
  activeView: string;
  cloudConfigured: boolean;
  syncing: boolean;
  user: User | null;
  onCreatePlan: () => void;
  onViewChange: (view: PlannerAppProps["initialView"]) => void;
}) {
  return (
    <motion.header
      className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <Link href="/" className="flex min-w-0 items-center gap-2 text-blossom-ink">
        <motion.span
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-blossom-deep/15 bg-white/80 shadow-sm"
          animate={{ rotate: [0, -4, 3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Leaf className="size-5 text-blossom-leaf" />
        </motion.span>
        <span className="min-w-0">
          <span className="block truncate text-base font-black sm:text-lg">杏花周计划</span>
          <span className="hidden text-xs text-blossom-deep/70 sm:block">
            {cloudConfigured ? "云同步可用" : "离线体验模式"}
            {syncing ? " · 同步中" : ""}
          </span>
        </span>
      </Link>

      <nav className="flex items-center gap-2">
        <NavButton active={activeView === "dashboard"} icon={PanelTop} label="仪表盘" onClick={() => onViewChange("dashboard")} />
        <motion.button
          className="motion-sheen hidden min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/80 px-4 text-sm font-bold text-blossom-ink shadow-sm transition hover:bg-white sm:flex"
          type="button"
          onClick={onCreatePlan}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="size-4" />
          新计划
        </motion.button>
        <NavButton active={activeView === "auth"} icon={user ? UserRound : LogIn} label={user ? "账号" : "登录"} onClick={() => onViewChange("auth")} />
      </nav>
    </motion.header>
  );
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean;
  icon: typeof PanelTop;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      className={`motion-sheen flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-bold shadow-sm transition sm:px-4 ${
        active
          ? "border-blossom-deep bg-blossom-deep text-white"
          : "border-blossom-deep/15 bg-white/80 text-blossom-ink hover:bg-white"
      }`}
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </motion.button>
  );
}

function HeroPanel({ activePlan, onViewDashboard }: { activePlan?: WeekPlan; onViewDashboard: () => void }) {
  return (
    <motion.section
      className="glass-panel relative overflow-hidden rounded-lg p-5 sm:p-7"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full border border-blossom-petal/50 bg-blossom-petal/20 blur-sm"
        animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.72, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
      <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
        <motion.div className="min-w-0" variants={fadeUp} transition={spring}>
          <motion.p
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-blossom-deep/15 bg-white/70 px-3 py-1 text-xs font-bold text-blossom-deep"
            variants={fadeUp}
          >
            <Sparkles className="size-3.5 text-blossom-gold" />
            梵高杏花灵感 · 可协作周计划
          </motion.p>
          <motion.h1 className="max-w-3xl text-[clamp(2rem,8vw,5rem)] font-black leading-[0.95] tracking-normal text-blossom-ink" variants={fadeUp}>
            把这一周拆成
            <span className="brush-underline">可以完成</span>
            的小计划
          </motion.h1>
          <motion.p className="mt-4 max-w-2xl text-sm leading-7 text-blossom-deep/82 sm:text-base" variants={fadeUp}>
            写大目标、拆小任务、标记高质完成/基本完成/停止/推迟，导出互动 PDF，也能用分享链接让家长或老师协作评价。
          </motion.p>
        </motion.div>
        <motion.button
          className="motion-sheen flex min-h-14 items-center justify-center gap-2 rounded-lg bg-blossom-ink px-5 text-sm font-black text-white shadow-brush transition hover:bg-blossom-deep"
          type="button"
          onClick={onViewDashboard}
          variants={fadeUp}
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <PanelTop className="size-5" />
          进入仪表盘
        </motion.button>
      </div>
      {activePlan ? (
        <motion.div className="relative mt-5 grid gap-3 sm:grid-cols-3" variants={stagger}>
          <MetricCard icon={CalendarDays} label="计划周期" value={formatRange(activePlan)} />
          <MetricCard icon={ClipboardList} label="小计划" value={`${activePlan.tasks.length} 项`} />
          <MetricCard
            icon={CheckCircle2}
            label="已标记"
            value={`${activePlan.tasks.filter((task) => task.status !== "pending").length} 项`}
          />
        </motion.div>
      ) : null}
    </motion.section>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <motion.div className="rounded-lg border border-white/50 bg-white/72 p-4 text-blossom-ink" variants={fadeUp} whileHover={{ y: -3 }} transition={spring}>
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-blossom-deep/70">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="break-words text-lg font-black">{value}</div>
    </motion.div>
  );
}

function DashboardView({
  activeId,
  plans,
  onCreatePlan,
  onDuplicatePlan,
  onSelect
}: {
  activeId: string;
  plans: WeekPlan[];
  onCreatePlan: () => void;
  onDuplicatePlan: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.section className="paper-panel rounded-lg p-4 sm:p-5" variants={stagger} initial="hidden" animate="show">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <motion.div variants={fadeUp}>
          <h2 className="text-xl font-black">仪表盘</h2>
          <p className="mt-1 text-sm text-blossom-deep/70">选择一个计划继续编辑，或复制当前计划作为新的一周。</p>
        </motion.div>
        <motion.div className="flex gap-2" variants={fadeUp}>
          <motion.button className="motion-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-blossom-ink px-4 text-sm font-bold text-white" type="button" onClick={onCreatePlan} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Plus className="size-4" />
            新建
          </motion.button>
          <motion.button className="motion-sheen inline-flex min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white px-4 text-sm font-bold text-blossom-ink" type="button" onClick={onDuplicatePlan} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <ClipboardList className="size-4" />
            复制
          </motion.button>
        </motion.div>
      </div>
      <motion.div className="grid gap-3 sm:grid-cols-2" variants={stagger}>
        {plans.map((plan, index) => (
          <motion.button
            key={plan.id}
            className={`min-h-36 rounded-lg border p-4 text-left transition hover:-translate-y-1 ${
              plan.id === activeId ? "border-blossom-deep bg-blossom-deep text-white" : "border-blossom-deep/15 bg-white/82 text-blossom-ink"
            }`}
            type="button"
            onClick={() => onSelect(plan.id)}
            variants={fadeUp}
            transition={{ ...spring, delay: index * 0.03 }}
            whileHover={{ y: -5, scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
          >
            <span className="block text-lg font-black">{plan.title}</span>
            <span className="mt-2 block text-sm opacity-80">{formatRange(plan)}</span>
            <span className="mt-3 line-clamp-2 block text-sm opacity-90">{plan.bigGoal}</span>
            <span className="mt-4 inline-flex rounded-full bg-white/18 px-3 py-1 text-xs font-bold">{plan.tasks.length} 个小计划</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.section>
  );
}

function PlanEditor({
  plan,
  onAddTask,
  onRemoveTask,
  onUpdateEvaluation,
  onUpdatePlan,
  onUpdateTask
}: {
  plan: WeekPlan;
  onAddTask: () => void;
  onRemoveTask: (taskId: string) => void;
  onUpdateEvaluation: (key: EvaluationKey, value: string) => void;
  onUpdatePlan: (patch: Partial<WeekPlan>) => void;
  onUpdateTask: (taskId: string, patch: Partial<WeekTask>) => void;
}) {
  return (
    <motion.section className="space-y-5" variants={stagger} initial="hidden" animate="show">
      <motion.div className="paper-panel rounded-lg p-4 sm:p-5" variants={fadeUp}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-black text-blossom-deep">计划标题</span>
            <input
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-4 text-base font-bold outline-none transition focus:border-blossom-deep"
              value={plan.title}
              onChange={(event) => onUpdatePlan({ title: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-black text-blossom-deep">当前角色</span>
            <select
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-4 text-base font-bold outline-none transition focus:border-blossom-deep"
              value={plan.role}
              onChange={(event) => onUpdatePlan({ role: event.target.value as UserRole })}
            >
              {Object.entries(ROLE_META).map(([role, meta]) => (
                <option key={role} value={role}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-black text-blossom-deep">这一周的大计划</span>
          <textarea
            className="min-h-32 w-full resize-y rounded-lg border border-blossom-deep/15 bg-white/90 px-4 py-3 leading-7 outline-none transition focus:border-blossom-deep"
            value={plan.bigGoal}
            onChange={(event) => onUpdatePlan({ bigGoal: event.target.value })}
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-black text-blossom-deep">开始时间</span>
            <input
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-4 outline-none transition focus:border-blossom-deep"
              type="date"
              value={plan.startDate}
              onChange={(event) => onUpdatePlan({ startDate: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-black text-blossom-deep">结束时间</span>
            <input
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-4 outline-none transition focus:border-blossom-deep"
              type="date"
              value={plan.endDate}
              onChange={(event) => onUpdatePlan({ endDate: event.target.value })}
            />
          </label>
        </div>
      </motion.div>

      <motion.div className="flex flex-wrap items-center justify-between gap-3" variants={fadeUp}>
        <div>
          <h2 className="text-xl font-black">小计划卡片</h2>
          <p className="text-sm text-blossom-deep/70">每个任务都可以单独标记完成状态。</p>
        </div>
        <motion.button className="motion-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-blossom-ink px-4 text-sm font-bold text-white shadow-sm" type="button" onClick={onAddTask} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Plus className="size-4" />
          添加小计划
        </motion.button>
      </motion.div>

      <motion.div className="grid gap-4 md:grid-cols-2" variants={stagger}>
        {plan.tasks.map((task, index) => (
          <TaskCard key={task.id} index={index} task={task} onRemove={() => onRemoveTask(task.id)} onUpdate={(patch) => onUpdateTask(task.id, patch)} />
        ))}
      </motion.div>

      <motion.section className="paper-panel rounded-lg p-4 sm:p-5" variants={fadeUp}>
        <h2 className="text-xl font-black">评价区</h2>
        <p className="mt-1 text-sm text-blossom-deep/70">这些内容会进入 PDF，也会在分享链接里保留。</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(Object.keys(EVALUATION_META) as EvaluationKey[]).map((key) => {
            const meta = EVALUATION_META[key];
            return (
              <label key={key} className="space-y-2">
                <span className="text-sm font-black text-blossom-deep">{meta.label}</span>
                <textarea
                  className="min-h-32 w-full resize-y rounded-lg border border-blossom-deep/15 bg-white/90 px-4 py-3 leading-7 outline-none transition focus:border-blossom-deep"
                  placeholder={meta.placeholder}
                  value={plan.evaluations[key]}
                  onChange={(event) => onUpdateEvaluation(key, event.target.value)}
                />
              </label>
            );
          })}
        </div>
      </motion.section>
    </motion.section>
  );
}

function TaskCard({
  index,
  task,
  onRemove,
  onUpdate
}: {
  index: number;
  task: WeekTask;
  onRemove: () => void;
  onUpdate: (patch: Partial<WeekTask>) => void;
}) {
  return (
    <motion.article
      layout
      className="paper-panel rounded-lg p-4"
      variants={fadeUp}
      initial={{ opacity: 0, y: 18, rotate: -0.4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      whileHover={{ y: -4, rotate: 0.2 }}
      transition={{ ...spring, delay: index * 0.04 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <motion.span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-blossom-deep text-sm font-black text-white" whileHover={{ rotate: [-1, 2, 0] }}>
          {index + 1}
        </motion.span>
        <motion.button className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700" type="button" onClick={onRemove} whileTap={{ scale: 0.95 }}>
          删除
        </motion.button>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-black text-blossom-deep">任务名称</span>
        <input
          className="min-h-11 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-3 font-bold outline-none transition focus:border-blossom-deep"
          value={task.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
        />
      </label>
      <label className="mt-3 block space-y-2">
        <span className="text-sm font-black text-blossom-deep">任务日期</span>
        <input
          className="min-h-11 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-3 outline-none transition focus:border-blossom-deep"
          type="date"
          value={task.date}
          onChange={(event) => onUpdate({ date: event.target.value })}
        />
      </label>
      <label className="mt-3 block space-y-2">
        <span className="text-sm font-black text-blossom-deep">任务说明</span>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-blossom-deep/15 bg-white/90 px-3 py-2 leading-6 outline-none transition focus:border-blossom-deep"
          value={task.detail}
          onChange={(event) => onUpdate({ detail: event.target.value })}
        />
      </label>
      <StatusPicker value={task.status} onChange={(status) => onUpdate({ status })} />
    </motion.article>
  );
}

function StatusPicker({ value, onChange }: { value: TaskStatus; onChange: (status: TaskStatus) => void }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-black text-blossom-deep">完成状态</div>
      <div className="grid grid-cols-2 gap-2">
        {statusOptions.map((status) => {
          const meta = STATUS_META[status];
          const active = value === status;
          return (
            <motion.button
              key={status}
              className={`relative min-h-11 overflow-hidden rounded-lg border px-3 text-sm font-black transition ${active ? "status-pulse" : ""}`}
              style={{
                borderColor: active ? meta.color : meta.border,
                background: active ? meta.color : meta.bg,
                color: active ? "#ffffff" : meta.color
              }}
              type="button"
              onClick={() => onChange(status)}
              title={meta.description}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
            >
              <AnimatePresence>
                {active ? (
                  <motion.span
                    className="absolute inset-0 bg-white/12"
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  />
                ) : null}
              </AnimatePresence>
              <span className="relative">{meta.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ControlPanel({
  aiLoading,
  aiSuggestion,
  cloudConfigured,
  onAi,
  onExportHtml,
  onExportPdf,
  onShare,
  onSync,
  plan,
  session,
  syncing
}: {
  aiLoading: boolean;
  aiSuggestion: AiSuggestion | null;
  cloudConfigured: boolean;
  onAi: () => void;
  onExportHtml: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  onSync: () => void;
  plan?: WeekPlan;
  session: Session | null;
  syncing: boolean;
}) {
  return (
    <motion.div className="space-y-4" variants={stagger} initial="hidden" animate="show">
      <motion.section className="glass-panel rounded-lg p-4" variants={fadeUp} whileHover={{ y: -2 }} transition={spring}>
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Save className="size-5 text-blossom-leaf" />
          保存与分享
        </h2>
        <div className="mt-4 grid gap-2">
          <ActionButton icon={Save} label={syncing ? "同步中..." : session ? "立即同步" : "登录后同步"} onClick={onSync} />
          <ActionButton icon={Share2} label="生成在线协作链接" onClick={onShare} />
          <ActionButton icon={FileDown} label="导出互动 PDF" onClick={onExportPdf} />
          <ActionButton icon={Download} label="导出独立 HTML" onClick={onExportHtml} />
        </div>
        <p className="mt-3 text-xs leading-5 text-blossom-deep/72">
          {cloudConfigured
            ? "在线链接需要登录后生成；协作者可改状态和评价，不会改动任务内容。"
            : "当前未配置 Supabase，不能生成在线链接；可用独立 HTML 文件分享离线版本。"}
        </p>
        {plan?.shareToken ? (
          <p className="mt-2 break-all rounded-lg bg-white/72 p-2 text-xs text-blossom-deep">分享 token：{plan.shareToken}</p>
        ) : null}
      </motion.section>

      <motion.section className="glass-panel rounded-lg p-4" variants={fadeUp} whileHover={{ y: -2 }} transition={spring}>
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Bot className="size-5 text-blossom-gold" />
          AI 合理性建议
        </h2>
        <motion.button
          className="motion-sheen mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blossom-ink px-4 text-sm font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
          type="button"
          onClick={onAi}
          disabled={aiLoading}
          whileHover={aiLoading ? undefined : { y: -2 }}
          whileTap={aiLoading ? undefined : { scale: 0.98 }}
        >
          {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {aiLoading ? "分析中" : "让 AI 看看是否合理"}
        </motion.button>
        <AnimatePresence>{aiSuggestion ? <AiSuggestionView suggestion={aiSuggestion} /> : null}</AnimatePresence>
      </motion.section>
    </motion.div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: typeof Save; label: string; onClick: () => void }) {
  return (
    <motion.button
      className="motion-sheen flex min-h-12 w-full items-center justify-between rounded-lg border border-blossom-deep/15 bg-white/82 px-4 text-left text-sm font-black text-blossom-ink shadow-sm transition hover:bg-white"
      type="button"
      onClick={onClick}
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{label}</span>
      <Icon className="size-4 text-blossom-deep" />
    </motion.button>
  );
}

function AiSuggestionView({ suggestion }: { suggestion: AiSuggestion }) {
  return (
    <motion.div
      className="mt-4 space-y-3 text-sm text-blossom-ink"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={spring}
    >
      <motion.p className="rounded-lg bg-white/75 p-3 font-bold leading-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {suggestion.summary}
      </motion.p>
      <SuggestionList title="优点" items={suggestion.strengths} />
      <SuggestionList title="风险" items={suggestion.risks} />
      <SuggestionList title="修改建议" items={suggestion.revisions} />
      <SuggestionList title="下一步" items={suggestion.nextSteps} />
    </motion.div>
  );
}

function SuggestionList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-black text-blossom-deep/70">{title}</div>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <motion.li
            key={item}
            className="rounded-lg bg-white/65 px-3 py-2 leading-6"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function AuthPanel({
  cloudConfigured,
  onLocalRole,
  onNotice,
  onSignedOut,
  onSuccess,
  session,
  supabase
}: {
  cloudConfigured: boolean;
  onLocalRole: (role: UserRole) => void;
  onNotice: (notice: Notice) => void;
  onSignedOut: () => void;
  onSuccess: (session: Session | null) => void;
  session: Session | null;
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);

  const enterLocalMode = (message: string) => {
    onLocalRole(role);
    onNotice({ tone: "success", text: message });
    onSuccess(null);
  };

  const resolveEmail = async () => {
    if (identifier.includes("@")) {
      return identifier.trim();
    }

    const response = await fetch("/api/auth/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ identifier })
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response));
    }

    const data = (await response.json()) as { email: string };
    return data.email;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !cloudConfigured) {
      enterLocalMode(
        mode === "register"
          ? "已用本地账号进入。当前计划会保存在这个浏览器里；配置 Supabase 后可开启云同步。"
          : "已用本地模式进入。当前计划会保存在这个浏览器里。"
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const resolvedEmail = await resolveEmail();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password
        });

        if (error) {
          throw error;
        }

        onNotice({ tone: "success", text: "登录成功，正在读取云端计划。" });
        onSuccess(data.session);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              display_name: displayName || username,
              role
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          onNotice({ tone: "success", text: "注册成功，已经登录。" });
          onSuccess(data.session);
        } else {
          enterLocalMode("注册已提交。当前项目可能开启了邮箱确认，我先让你进入本地模式继续使用。");
          setMode("login");
          setIdentifier(email);
        }
      }
    } catch (error) {
      onNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "账号操作失败。"
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onSignedOut();
    onNotice({ tone: "info", text: "已退出登录，本地计划仍会保留。" });
  };

  if (session) {
    return (
      <motion.section className="paper-panel rounded-lg p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <h2 className="text-xl font-black">账号已登录</h2>
        <p className="mt-2 break-all text-sm text-blossom-deep/75">{session.user.email}</p>
        <motion.button className="motion-sheen mt-5 min-h-12 rounded-lg bg-blossom-ink px-5 text-sm font-black text-white" type="button" onClick={signOut} whileTap={{ scale: 0.98 }}>
          退出登录
        </motion.button>
      </motion.section>
    );
  }

  return (
    <motion.section className="paper-panel rounded-lg p-5" variants={stagger} initial="hidden" animate="show">
      <div className="mb-4 flex rounded-lg border border-blossom-deep/15 bg-white/70 p-1">
        <motion.button
          className={`min-h-11 flex-1 rounded-md text-sm font-black ${mode === "login" ? "bg-blossom-ink text-white" : "text-blossom-ink"}`}
          type="button"
          onClick={() => setMode("login")}
          whileTap={{ scale: 0.98 }}
        >
          登录
        </motion.button>
        <motion.button
          className={`min-h-11 flex-1 rounded-md text-sm font-black ${mode === "register" ? "bg-blossom-ink text-white" : "text-blossom-ink"}`}
          type="button"
          onClick={() => setMode("register")}
          whileTap={{ scale: 0.98 }}
        >
          注册新账号
        </motion.button>
      </div>

      <motion.form className="space-y-4" onSubmit={submit} variants={stagger}>
        {mode === "login" ? (
          <label className="block space-y-2">
            <span className="text-sm font-black text-blossom-deep">邮箱或用户名</span>
            <input
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
            />
          </label>
        ) : (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-black text-blossom-deep">邮箱</span>
              <input
                className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
                autoComplete="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-black text-blossom-deep">用户名</span>
              <input
                className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-black text-blossom-deep">显示名称</span>
              <input
                className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <RoleSelector role={role} onChange={setRole} />
          </>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-black text-blossom-deep">密码</span>
          <input
            className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <motion.button
          className="motion-sheen flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blossom-ink px-5 text-sm font-black text-white shadow-sm disabled:opacity-70"
          type="submit"
          disabled={loading}
          whileHover={loading ? undefined : { y: -2 }}
          whileTap={loading ? undefined : { scale: 0.98 }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {mode === "login" ? "登录账号" : "注册并进入"}
        </motion.button>

        <motion.button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-blossom-deep/15 bg-white px-5 text-sm font-black text-blossom-ink"
          type="button"
          onClick={() => onNotice({ tone: "info", text: "微信登录入口已保留。接入真实微信 OAuth 需要 AppID、Secret 和回调域名。" })}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Users className="size-4" />
          微信登录（待配置）
        </motion.button>
      </motion.form>
    </motion.section>
  );
}

function RoleSelector({ role, onChange }: { role: UserRole; onChange: (role: UserRole) => void }) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-blossom-deep">预设角色</div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(ROLE_META) as UserRole[]).map((item) => (
          <motion.button
            key={item}
            className={`min-h-11 rounded-lg border px-3 text-sm font-black ${
              role === item ? "border-blossom-deep bg-blossom-deep text-white" : "border-blossom-deep/15 bg-white text-blossom-ink"
            }`}
            type="button"
            onClick={() => onChange(item)}
            title={ROLE_META[item].description}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {ROLE_META[item].label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function MobileDock({
  onCreatePlan,
  onShare,
  onSync,
  onViewChange
}: {
  onCreatePlan: () => void;
  onShare: () => void;
  onSync: () => void;
  onViewChange: (view: PlannerAppProps["initialView"]) => void;
}) {
  return (
    <motion.nav
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-2 rounded-lg border border-blossom-deep/15 bg-white/92 p-2 shadow-brush backdrop-blur md:hidden"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      <DockButton icon={PanelTop} label="仪表盘" onClick={() => onViewChange("dashboard")} />
      <DockButton icon={Plus} label="新建" onClick={onCreatePlan} />
      <DockButton icon={Save} label="保存" onClick={onSync} />
      <DockButton icon={Link2} label="分享" onClick={onShare} />
    </motion.nav>
  );
}

function DockButton({ icon: Icon, label, onClick }: { icon: typeof Home; label: string; onClick: () => void }) {
  return (
    <motion.button className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-black text-blossom-ink" type="button" onClick={onClick} whileTap={{ scale: 0.92 }}>
      <Icon className="size-4" />
      {label}
    </motion.button>
  );
}
