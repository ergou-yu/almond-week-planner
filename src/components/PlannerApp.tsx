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
import {
  getBrowserLanguage,
  getEvaluationMeta,
  getPriorityMeta,
  getRoleMeta,
  getStatusMeta,
  languageLabels,
  languages,
  t,
  type Language
} from "@/lib/i18n";
import { createDefaultPlan, createTask, loadLocalPlans, normalizePlan, saveLocalPlans } from "@/lib/planner";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/browser";
import { PRIORITY_ORDER, STATUS_ORDER } from "@/lib/status";
import type { AiSuggestion, EvaluationKey, TaskPriority, TaskStatus, UserRole, WeekPlan, WeekTask } from "@/types/planner";

type PlannerAppProps = {
  initialView: "editor" | "dashboard" | "auth";
};

type Notice = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
};

const statusOptions = STATUS_ORDER.filter((status) => status !== "pending");
const priorityOptions = PRIORITY_ORDER;

const noticeStyles: Record<Notice["tone"], string> = {
  info: "border-blossom-sky/30 bg-white/80 text-blossom-ink",
  success: "border-green-300 bg-green-50 text-green-800",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-800"
};

const formatRange = (plan: WeekPlan, language: Language) => {
  const separator = language === "en" ? " to " : language === "ko" ? " ~ " : " 至 ";
  return `${plan.startDate || t(language, "unset")}${separator}${plan.endDate || t(language, "unset")}`;
};

const getAuthHeader = (session: Session | null) => {
  if (!session?.access_token) {
    return null;
  }

  return `Bearer ${session.access_token}`;
};

const parseApiError = async (response: Response, language: Language) => {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error || response.statusText || t(language, "notices.requestFailed");
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
  const [language, setLanguage] = useState<Language>(() => getBrowserLanguage());
  const [view, setView] = useState(initialView);
  const [plans, setPlans] = useState<WeekPlan[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState<Notice>(() => ({
    tone: "info",
    text: t(getBrowserLanguage(), "notices.initial")
  }));
  const [syncing, setSyncing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plansRef = useRef<WeekPlan[]>([]);
  const activeIdRef = useRef("");
  const editVersionRef = useRef(0);
  const loadedCloudUserRef = useRef<string | null>(null);

  const activePlan = plans.find((plan) => plan.id === activeId) ?? plans[0];
  const statusMeta = useMemo(() => getStatusMeta(language), [language]);
  const priorityMeta = useMemo(() => getPriorityMeta(language), [language]);
  const roleMeta = useMemo(() => getRoleMeta(language), [language]);
  const evaluationMeta = useMemo(() => getEvaluationMeta(language), [language]);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("almond-language", nextLanguage);
    }
  };

  const getCurrentActivePlan = useCallback(
    () => plansRef.current.find((plan) => plan.id === activeIdRef.current) ?? plansRef.current[0],
    []
  );

  const updatePlansState = useCallback((nextPlans: WeekPlan[], nextActiveId?: string) => {
    const normalized = nextPlans.map(normalizePlan);
    const resolvedActiveId =
      nextActiveId ?? (normalized.some((plan) => plan.id === activeIdRef.current) ? activeIdRef.current : normalized[0]?.id ?? "");
    plansRef.current = normalized;
    activeIdRef.current = resolvedActiveId;
    setPlans(normalized);
    saveLocalPlans(normalized);
    setActiveId(resolvedActiveId);
  }, []);

  const savePlanToCloud = useCallback(
    async (plan: WeekPlan, options: { quiet?: boolean; version?: number } = {}) => {
      const authHeader = getAuthHeader(session);
      if (!authHeader) {
        return null;
      }

      if (options.version !== undefined && options.version !== editVersionRef.current) {
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
          throw new Error(await parseApiError(response, language));
        }

        const data = (await response.json()) as { plan: WeekPlan };
        if (!options.quiet && (options.version === undefined || options.version === editVersionRef.current)) {
          setNotice({ tone: "success", text: t(language, "notices.syncedCloud") });
        }
        return data.plan;
      } catch (error) {
        if (options.version === undefined || options.version === editVersionRef.current) {
          setNotice({
            tone: "error",
            text: error instanceof Error ? error.message : t(language, "notices.syncFailed")
          });
        }
        return null;
      } finally {
        if (options.version === undefined || options.version === editVersionRef.current) {
          setSyncing(false);
        }
      }
    },
    [language, session]
  );

  const scheduleCloudSave = useCallback(
    (plan: WeekPlan, version: number) => {
      if (!session) {
        return;
      }

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }

      syncTimer.current = setTimeout(() => {
        void savePlanToCloud(plan, { quiet: true, version });
      }, 1800);
    },
    [savePlanToCloud, session]
  );

  const replacePlan = useCallback(
    (nextPlan: WeekPlan, options: { markDirty?: boolean; sync?: boolean } = { sync: true }) => {
      const normalized = normalizePlan({
        ...nextPlan,
        updatedAt: new Date().toISOString()
      });

      const shouldMarkDirty = options.markDirty ?? true;
      const version = shouldMarkDirty ? editVersionRef.current + 1 : editVersionRef.current;
      if (shouldMarkDirty) {
        editVersionRef.current = version;
      }

      setPlans((currentPlans) => {
        const sourcePlans = currentPlans.length ? currentPlans : plansRef.current;
        const nextPlans = sourcePlans.some((plan) => plan.id === normalized.id)
          ? sourcePlans.map((plan) => (plan.id === normalized.id ? normalized : plan))
          : [normalized, ...sourcePlans];

        plansRef.current = nextPlans;
        saveLocalPlans(nextPlans);
        return nextPlans;
      });

      activeIdRef.current = normalized.id;
      setActiveId(normalized.id);

      if (options.sync ?? true) {
        scheduleCloudSave(normalized, version);
      }
    },
    [scheduleCloudSave]
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
          throw new Error(await parseApiError(response, language));
        }

        const data = (await response.json()) as { plans: WeekPlan[] };
        const currentLocalPlans = plansRef.current;
        const next = data.plans.length ? data.plans : currentLocalPlans;
        updatePlansState(next.length ? next : [createDefaultPlan(language)], next[0]?.id);
        loadedCloudUserRef.current = currentSession.user.id;
        setNotice({ tone: "success", text: t(language, "notices.loadedCloud") });
      } catch (error) {
        setNotice({
          tone: "error",
          text: error instanceof Error ? error.message : t(language, "notices.loadCloudFailed")
        });
      } finally {
        setSyncing(false);
      }
    },
    [language, updatePlansState]
  );

  useEffect(() => {
    const stored = loadLocalPlans();
    const initial = stored.length ? stored : [createDefaultPlan(language)];
    updatePlansState(initial, initial[0]?.id);
  }, [language, updatePlansState]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      if (data.session && loadedCloudUserRef.current !== data.session.user.id) {
        void loadCloudPlans(data.session);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession && event === "SIGNED_IN" && loadedCloudUserRef.current !== nextSession.user.id) {
        void loadCloudPlans(nextSession);
      }
      if (!nextSession) {
        loadedCloudUserRef.current = null;
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCloudPlans, supabase]);

  const createPlan = () => {
    const next = createDefaultPlan(language);
    updatePlansState([next, ...plansRef.current], next.id);
    setView("editor");
    setNotice({ tone: "success", text: t(language, "notices.planCreated") });
  };

  const duplicatePlan = () => {
    if (!activePlan) {
      return;
    }

    const copy: WeekPlan = {
      ...activePlan,
      id: crypto.randomUUID(),
      title: `${activePlan.title} ${t(language, "createdCopySuffix")}`,
      shareToken: undefined,
      tasks: activePlan.tasks.map((task, index) => ({
        ...task,
        id: crypto.randomUUID(),
        order: index
      })),
      updatedAt: new Date().toISOString()
    };
    updatePlansState([copy, ...plansRef.current], copy.id);
    setView("editor");
  };

  const updateActivePlan = (patch: Partial<WeekPlan>) => {
    const currentPlan = getCurrentActivePlan();
    if (!currentPlan) {
      return;
    }
    replacePlan({ ...currentPlan, ...patch });
  };

  const updateTask = (taskId: string, patch: Partial<WeekTask>) => {
    const currentPlan = getCurrentActivePlan();
    if (!currentPlan) {
      return;
    }

    replacePlan({
      ...currentPlan,
      tasks: currentPlan.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task))
    });
  };

  const addTask = () => {
    const currentPlan = getCurrentActivePlan();
    if (!currentPlan) {
      return;
    }

    replacePlan({
      ...currentPlan,
      tasks: [...currentPlan.tasks, createTask(currentPlan.tasks.length, language)]
    });
  };

  const removeTask = (taskId: string) => {
    const currentPlan = getCurrentActivePlan();
    if (!currentPlan) {
      return;
    }

    replacePlan({
      ...currentPlan,
      tasks: currentPlan.tasks
        .filter((task) => task.id !== taskId)
        .map((task, index) => ({
          ...task,
          order: index
        }))
    });
  };

  const updateEvaluation = (key: EvaluationKey, value: string) => {
    const currentPlan = getCurrentActivePlan();
    if (!currentPlan) {
      return;
    }

    replacePlan({
      ...currentPlan,
      evaluations: {
        ...currentPlan.evaluations,
        [key]: value
      }
    });
  };

  const syncNow = async () => {
    if (!activePlan) {
      return;
    }

    if (!session) {
      setNotice({ tone: "warning", text: t(language, "notices.loginNeededToSync") });
      setView("auth");
      return;
    }

    const version = editVersionRef.current;
    const saved = await savePlanToCloud(activePlan, { version });
    if (saved && version === editVersionRef.current) {
      replacePlan(saved, { markDirty: false, sync: false });
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
          ? t(language, "notices.loginNeededForShare")
          : t(language, "notices.cloudMissingForShare")
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
        throw new Error(await parseApiError(response, language));
      }

      const data = (await response.json()) as { token: string; url: string };
      const next = { ...activePlan, shareToken: data.token };
      replacePlan(next, { markDirty: false, sync: false });
      await navigator.clipboard?.writeText(data.url).catch(() => undefined);
      setNotice({ tone: "success", text: t(language, "notices.shareCreated", { url: data.url }) });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t(language, "notices.shareFailed")
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
        body: JSON.stringify({ plan: activePlan, language })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response, language));
      }

      const data = (await response.json()) as { suggestion: AiSuggestion; notice?: string };
      setAiSuggestion(data.suggestion);
      setNotice({
        tone: data.notice ? "warning" : "success",
        text: data.notice || t(language, "notices.aiDone")
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t(language, "notices.aiFailed")
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
      await exportPlanPdf(activePlan, { language });
      setNotice({ tone: "success", text: t(language, "notices.pdfStarted") });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? `${t(language, "notices.pdfFailed")} ${error.message}` : t(language, "notices.pdfFailed")
      });
    }
  };

  const exportHtml = () => {
    if (!activePlan) {
      return;
    }

    exportPlanHtml(activePlan, { language });
    setNotice({ tone: "success", text: t(language, "notices.htmlStarted") });
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
        language={language}
        syncing={syncing}
        user={user}
        onLanguageChange={changeLanguage}
        onCreatePlan={createPlan}
        onViewChange={setView}
      />

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-8 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:pt-8">
        <div className="min-w-0">
          <HeroPanel activePlan={activePlan} language={language} onViewDashboard={() => setView("dashboard")} />

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
                  language={language}
                  plans={plans}
                  onCreatePlan={createPlan}
                  onDuplicatePlan={duplicatePlan}
                  onSelect={(id) => {
                    activeIdRef.current = id;
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
                  language={language}
                  roleMeta={roleMeta}
                  session={session}
                  supabase={supabase}
                  onNotice={setNotice}
                  onLocalRole={(role) => {
                    const currentPlan = getCurrentActivePlan();
                    if (currentPlan) {
                      replacePlan({ ...currentPlan, role }, { sync: false });
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
                  evaluationMeta={evaluationMeta}
                  language={language}
                  priorityMeta={priorityMeta}
                  roleMeta={roleMeta}
                  statusMeta={statusMeta}
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
            language={language}
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

      <MobileDock language={language} onCreatePlan={createPlan} onShare={createShareLink} onSync={syncNow} onViewChange={setView} />
    </main>
  );
}

function TopNav({
  activeView,
  cloudConfigured,
  language,
  syncing,
  user,
  onLanguageChange,
  onCreatePlan,
  onViewChange
}: {
  activeView: string;
  cloudConfigured: boolean;
  language: Language;
  syncing: boolean;
  user: User | null;
  onLanguageChange: (language: Language) => void;
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
          <span className="block truncate text-base font-black sm:text-lg">{t(language, "appName")}</span>
          <span className="hidden text-xs text-blossom-deep/70 sm:block">
            {cloudConfigured ? t(language, "cloudReady") : t(language, "offlineMode")}
            {syncing ? t(language, "syncingSuffix") : ""}
          </span>
        </span>
      </Link>

      <nav className="flex items-center gap-2">
        <LanguageSwitcher language={language} onChange={onLanguageChange} />
        <NavButton active={activeView === "dashboard"} icon={PanelTop} label={t(language, "navDashboard")} onClick={() => onViewChange("dashboard")} />
        <motion.button
          className="motion-sheen hidden min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/80 px-4 text-sm font-bold text-blossom-ink shadow-sm transition hover:bg-white sm:flex"
          type="button"
          onClick={onCreatePlan}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="size-4" />
          {t(language, "navNewPlan")}
        </motion.button>
        <NavButton active={activeView === "auth"} icon={user ? UserRound : LogIn} label={user ? t(language, "navAccount") : t(language, "navLogin")} onClick={() => onViewChange("auth")} />
      </nav>
    </motion.header>
  );
}

function LanguageSwitcher({ language, onChange }: { language: Language; onChange: (language: Language) => void }) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/80 px-2 text-xs font-black text-blossom-deep shadow-sm sm:px-3">
      <span className="hidden sm:inline">{t(language, "language")}</span>
      <select
        className="bg-transparent text-sm font-black text-blossom-ink outline-none"
        value={language}
        onChange={(event) => onChange(event.target.value as Language)}
        aria-label={t(language, "language")}
      >
        {languages.map((item) => (
          <option key={item} value={item}>
            {languageLabels[item]}
          </option>
        ))}
      </select>
    </label>
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

function HeroPanel({ activePlan, language, onViewDashboard }: { activePlan?: WeekPlan; language: Language; onViewDashboard: () => void }) {
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
            {t(language, "heroKicker")}
          </motion.p>
          <motion.h1 className="max-w-3xl text-[clamp(2rem,8vw,5rem)] font-black leading-[0.95] tracking-normal text-blossom-ink" variants={fadeUp}>
            {t(language, "heroTitleBefore")}
            <span className="brush-underline">{t(language, "heroTitleEmphasis")}</span>
            {t(language, "heroTitleAfter")}
          </motion.h1>
          <motion.p className="mt-4 max-w-2xl text-sm leading-7 text-blossom-deep/82 sm:text-base" variants={fadeUp}>
            {t(language, "heroBody")}
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
          {t(language, "enterDashboard")}
        </motion.button>
      </div>
      {activePlan ? (
        <motion.div className="relative mt-5 grid gap-3 sm:grid-cols-3" variants={stagger}>
          <MetricCard icon={CalendarDays} label={t(language, "planRange")} value={formatRange(activePlan, language)} />
          <MetricCard icon={ClipboardList} label={t(language, "taskCount")} value={t(language, "itemCount", { count: activePlan.tasks.length })} />
          <MetricCard
            icon={CheckCircle2}
            label={t(language, "markedCount")}
            value={t(language, "itemCount", { count: activePlan.tasks.filter((task) => task.status !== "pending").length })}
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
  language,
  plans,
  onCreatePlan,
  onDuplicatePlan,
  onSelect
}: {
  activeId: string;
  language: Language;
  plans: WeekPlan[];
  onCreatePlan: () => void;
  onDuplicatePlan: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.section className="paper-panel rounded-lg p-4 sm:p-5" variants={stagger} initial="hidden" animate="show">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <motion.div variants={fadeUp}>
          <h2 className="text-xl font-black">{t(language, "dashboardTitle")}</h2>
          <p className="mt-1 text-sm text-blossom-deep/70">{t(language, "dashboardHelp")}</p>
        </motion.div>
        <motion.div className="flex gap-2" variants={fadeUp}>
          <motion.button className="motion-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-blossom-ink px-4 text-sm font-bold text-white" type="button" onClick={onCreatePlan} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Plus className="size-4" />
            {t(language, "create")}
          </motion.button>
          <motion.button className="motion-sheen inline-flex min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white px-4 text-sm font-bold text-blossom-ink" type="button" onClick={onDuplicatePlan} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <ClipboardList className="size-4" />
            {t(language, "duplicate")}
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
            <span className="mt-2 block text-sm opacity-80">{formatRange(plan, language)}</span>
            <span className="mt-3 line-clamp-2 block text-sm opacity-90">{plan.bigGoal}</span>
            <span className="mt-4 inline-flex rounded-full bg-white/18 px-3 py-1 text-xs font-bold">{t(language, "itemCount", { count: plan.tasks.length })}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.section>
  );
}

function PlanEditor({
  evaluationMeta,
  language,
  plan,
  priorityMeta,
  roleMeta,
  statusMeta,
  onAddTask,
  onRemoveTask,
  onUpdateEvaluation,
  onUpdatePlan,
  onUpdateTask
}: {
  evaluationMeta: ReturnType<typeof getEvaluationMeta>;
  language: Language;
  plan: WeekPlan;
  priorityMeta: ReturnType<typeof getPriorityMeta>;
  roleMeta: ReturnType<typeof getRoleMeta>;
  statusMeta: ReturnType<typeof getStatusMeta>;
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
            <span className="text-sm font-black text-blossom-deep">{t(language, "planTitle")}</span>
            <input
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-4 text-base font-bold outline-none transition focus:border-blossom-deep"
              value={plan.title}
              onChange={(event) => onUpdatePlan({ title: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-black text-blossom-deep">{t(language, "currentRole")}</span>
            <select
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-4 text-base font-bold outline-none transition focus:border-blossom-deep"
              value={plan.role}
              onChange={(event) => onUpdatePlan({ role: event.target.value as UserRole })}
            >
              {Object.entries(roleMeta).map(([role, meta]) => (
                <option key={role} value={role}>
                  {meta.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block space-y-2">
          <span className="text-sm font-black text-blossom-deep">{t(language, "bigGoal")}</span>
          <textarea
            className="min-h-32 w-full resize-y rounded-lg border border-blossom-deep/15 bg-white/90 px-4 py-3 leading-7 outline-none transition focus:border-blossom-deep"
            value={plan.bigGoal}
            onChange={(event) => onUpdatePlan({ bigGoal: event.target.value })}
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-black text-blossom-deep">{t(language, "startDate")}</span>
            <input
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-4 outline-none transition focus:border-blossom-deep"
              type="date"
              value={plan.startDate}
              onChange={(event) => onUpdatePlan({ startDate: event.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-black text-blossom-deep">{t(language, "endDate")}</span>
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
          <h2 className="text-xl font-black">{t(language, "taskCards")}</h2>
          <p className="text-sm text-blossom-deep/70">{t(language, "taskCardsHelp")}</p>
        </div>
        <motion.button className="motion-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-blossom-ink px-4 text-sm font-bold text-white shadow-sm" type="button" onClick={onAddTask} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Plus className="size-4" />
          {t(language, "addTask")}
        </motion.button>
      </motion.div>

      <motion.div className="grid gap-4 md:grid-cols-2" variants={stagger}>
        {plan.tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            index={index}
            language={language}
            priorityMeta={priorityMeta}
            statusMeta={statusMeta}
            task={task}
            onRemove={() => onRemoveTask(task.id)}
            onUpdate={(patch) => onUpdateTask(task.id, patch)}
          />
        ))}
      </motion.div>

      <motion.section className="paper-panel rounded-lg p-4 sm:p-5" variants={fadeUp}>
        <h2 className="text-xl font-black">{t(language, "evaluationsTitle")}</h2>
        <p className="mt-1 text-sm text-blossom-deep/70">{t(language, "evaluationsHelp")}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(Object.keys(evaluationMeta) as EvaluationKey[]).map((key) => {
            const meta = evaluationMeta[key];
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
  language,
  priorityMeta,
  statusMeta,
  task,
  onRemove,
  onUpdate
}: {
  index: number;
  language: Language;
  priorityMeta: ReturnType<typeof getPriorityMeta>;
  statusMeta: ReturnType<typeof getStatusMeta>;
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
          {t(language, "delete")}
        </motion.button>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-black text-blossom-deep">{t(language, "taskTitle")}</span>
        <input
          className="min-h-11 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-3 font-bold outline-none transition focus:border-blossom-deep"
          value={task.title}
          onChange={(event) => onUpdate({ title: event.target.value })}
        />
      </label>
      <label className="mt-3 block space-y-2">
        <span className="text-sm font-black text-blossom-deep">{t(language, "taskDate")}</span>
        <input
          className="min-h-11 w-full rounded-lg border border-blossom-deep/15 bg-white/90 px-3 outline-none transition focus:border-blossom-deep"
          type="date"
          value={task.date}
          onChange={(event) => onUpdate({ date: event.target.value })}
        />
      </label>
      <PriorityPicker
        language={language}
        priorityMeta={priorityMeta}
        value={task.priority}
        onChange={(priority) => onUpdate({ priority })}
      />
      <label className="mt-3 block space-y-2">
        <span className="text-sm font-black text-blossom-deep">{t(language, "taskDetail")}</span>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-blossom-deep/15 bg-white/90 px-3 py-2 leading-6 outline-none transition focus:border-blossom-deep"
          value={task.detail}
          onChange={(event) => onUpdate({ detail: event.target.value })}
        />
      </label>
      <StatusPicker language={language} statusMeta={statusMeta} value={task.status} onChange={(status) => onUpdate({ status })} />
    </motion.article>
  );
}

function PriorityPicker({
  language,
  priorityMeta,
  value,
  onChange
}: {
  language: Language;
  priorityMeta: ReturnType<typeof getPriorityMeta>;
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}) {
  return (
    <div className="mt-3">
      <div className="mb-2 text-sm font-black text-blossom-deep">{t(language, "taskPriority")}</div>
      <div className="grid grid-cols-2 gap-2">
        {priorityOptions.map((priority) => {
          const meta = priorityMeta[priority];
          const active = value === priority;
          return (
            <motion.button
              key={priority}
              className="min-h-10 rounded-lg border px-3 text-sm font-black transition"
              style={{
                borderColor: active ? meta.color : meta.border,
                background: active ? meta.color : meta.bg,
                color: active ? "#ffffff" : meta.color
              }}
              type="button"
              onClick={() => onChange(priority)}
              title={meta.description}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
            >
              {meta.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function StatusPicker({
  language,
  statusMeta,
  value,
  onChange
}: {
  language: Language;
  statusMeta: ReturnType<typeof getStatusMeta>;
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-sm font-black text-blossom-deep">{t(language, "completionStatus")}</div>
      <div className="grid grid-cols-2 gap-2">
        {statusOptions.map((status) => {
          const meta = statusMeta[status];
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
  language,
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
  language: Language;
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
          {t(language, "saveAndShare")}
        </h2>
        <div className="mt-4 grid gap-2">
          <ActionButton icon={Save} label={syncing ? `${t(language, "share.saving")}...` : session ? t(language, "syncNow") : t(language, "syncAfterLogin")} onClick={onSync} />
          <ActionButton icon={Share2} label={t(language, "createShareLink")} onClick={onShare} />
          <ActionButton icon={FileDown} label={t(language, "exportPdf")} onClick={onExportPdf} />
          <ActionButton icon={Download} label={t(language, "exportHtml")} onClick={onExportHtml} />
        </div>
        <p className="mt-3 text-xs leading-5 text-blossom-deep/72">
          {cloudConfigured
            ? t(language, "shareHelpOnline")
            : t(language, "shareHelpOffline")}
        </p>
        {plan?.shareToken ? (
          <p className="mt-2 break-all rounded-lg bg-white/72 p-2 text-xs text-blossom-deep">{t(language, "shareToken", { token: plan.shareToken })}</p>
        ) : null}
      </motion.section>

      <motion.section className="glass-panel rounded-lg p-4" variants={fadeUp} whileHover={{ y: -2 }} transition={spring}>
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Bot className="size-5 text-blossom-gold" />
          {t(language, "aiTitle")}
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
          {aiLoading ? t(language, "aiAnalyzing") : t(language, "aiAnalyze")}
        </motion.button>
        <AnimatePresence>{aiSuggestion ? <AiSuggestionView language={language} suggestion={aiSuggestion} /> : null}</AnimatePresence>
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

function AiSuggestionView({ language, suggestion }: { language: Language; suggestion: AiSuggestion }) {
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
      <SuggestionList title={t(language, "suggestionStrengths")} items={suggestion.strengths} />
      <SuggestionList title={t(language, "suggestionRisks")} items={suggestion.risks} />
      <SuggestionList title={t(language, "suggestionRevisions")} items={suggestion.revisions} />
      <SuggestionList title={t(language, "suggestionNextSteps")} items={suggestion.nextSteps} />
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
  language,
  onLocalRole,
  onNotice,
  roleMeta,
  onSignedOut,
  onSuccess,
  session,
  supabase
}: {
  cloudConfigured: boolean;
  language: Language;
  onLocalRole: (role: UserRole) => void;
  onNotice: (notice: Notice) => void;
  roleMeta: ReturnType<typeof getRoleMeta>;
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
  const [confirmPassword, setConfirmPassword] = useState("");
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
      throw new Error(await parseApiError(response, language));
    }

    const data = (await response.json()) as { email: string };
    return data.email;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supabase || !cloudConfigured) {
      enterLocalMode(
        mode === "register"
          ? t(language, "notices.localRegister")
          : t(language, "notices.localLogin")
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

        onNotice({ tone: "success", text: t(language, "notices.loginSuccess") });
        onSuccess(data.session);
      } else {
        if (password !== confirmPassword) {
          onNotice({ tone: "error", text: t(language, "notices.passwordMismatch") });
          return;
        }

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
          onNotice({ tone: "success", text: t(language, "notices.registerSuccess") });
          onSuccess(data.session);
        } else {
          enterLocalMode(t(language, "notices.registerSubmitted"));
          setMode("login");
          setIdentifier(email);
        }
      }
    } catch (error) {
      onNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t(language, "notices.authFailed")
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
    onNotice({ tone: "info", text: t(language, "notices.signedOut") });
  };

  if (session) {
    return (
      <motion.section className="paper-panel rounded-lg p-5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <h2 className="text-xl font-black">{t(language, "signedIn")}</h2>
        <p className="mt-2 break-all text-sm text-blossom-deep/75">{session.user.email}</p>
        <motion.button className="motion-sheen mt-5 min-h-12 rounded-lg bg-blossom-ink px-5 text-sm font-black text-white" type="button" onClick={signOut} whileTap={{ scale: 0.98 }}>
          {t(language, "signOut")}
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
          {t(language, "login")}
        </motion.button>
        <motion.button
          className={`min-h-11 flex-1 rounded-md text-sm font-black ${mode === "register" ? "bg-blossom-ink text-white" : "text-blossom-ink"}`}
          type="button"
          onClick={() => setMode("register")}
          whileTap={{ scale: 0.98 }}
        >
          {t(language, "register")}
        </motion.button>
      </div>

      <motion.form className="space-y-4" onSubmit={submit} variants={stagger}>
        {mode === "login" ? (
          <label className="block space-y-2">
            <span className="text-sm font-black text-blossom-deep">{t(language, "emailOrUsername")}</span>
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
              <span className="text-sm font-black text-blossom-deep">{t(language, "email")}</span>
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
              <span className="text-sm font-black text-blossom-deep">{t(language, "username")}</span>
              <input
                className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-black text-blossom-deep">{t(language, "displayName")}</span>
              <input
                className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <RoleSelector language={language} role={role} roleMeta={roleMeta} onChange={setRole} />
          </>
        )}

        <label className="block space-y-2">
          <span className="text-sm font-black text-blossom-deep">{t(language, "password")}</span>
          <input
            className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {mode === "register" ? (
          <label className="block space-y-2">
            <span className="text-sm font-black text-blossom-deep">{t(language, "confirmPassword")}</span>
            <input
              className="min-h-12 w-full rounded-lg border border-blossom-deep/15 bg-white px-4 outline-none focus:border-blossom-deep"
              autoComplete="new-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
        ) : null}

        <motion.button
          className="motion-sheen flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blossom-ink px-5 text-sm font-black text-white shadow-sm disabled:opacity-70"
          type="submit"
          disabled={loading}
          whileHover={loading ? undefined : { y: -2 }}
          whileTap={loading ? undefined : { scale: 0.98 }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {mode === "login" ? t(language, "loginAccount") : t(language, "registerAndEnter")}
        </motion.button>

        <motion.button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-blossom-deep/15 bg-white px-5 text-sm font-black text-blossom-ink"
          type="button"
          onClick={() => onNotice({ tone: "info", text: t(language, "notices.wechatTodo") })}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Users className="size-4" />
          {t(language, "wechatLogin")}
        </motion.button>
      </motion.form>
    </motion.section>
  );
}

function RoleSelector({
  language,
  role,
  roleMeta,
  onChange
}: {
  language: Language;
  role: UserRole;
  roleMeta: ReturnType<typeof getRoleMeta>;
  onChange: (role: UserRole) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-black text-blossom-deep">{t(language, "presetRole")}</div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(roleMeta) as UserRole[]).map((item) => (
          <motion.button
            key={item}
            className={`min-h-11 rounded-lg border px-3 text-sm font-black ${
              role === item ? "border-blossom-deep bg-blossom-deep text-white" : "border-blossom-deep/15 bg-white text-blossom-ink"
            }`}
            type="button"
            onClick={() => onChange(item)}
            title={roleMeta[item].description}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {roleMeta[item].label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function MobileDock({
  language,
  onCreatePlan,
  onShare,
  onSync,
  onViewChange
}: {
  language: Language;
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
      <DockButton icon={PanelTop} label={t(language, "dockDashboard")} onClick={() => onViewChange("dashboard")} />
      <DockButton icon={Plus} label={t(language, "dockNew")} onClick={onCreatePlan} />
      <DockButton icon={Save} label={t(language, "dockSave")} onClick={onSync} />
      <DockButton icon={Link2} label={t(language, "dockShare")} onClick={onShare} />
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
