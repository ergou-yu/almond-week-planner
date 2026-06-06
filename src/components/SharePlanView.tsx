"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Download, FileDown, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { exportPlanHtml, exportPlanPdf } from "@/lib/exporters";
import { getBrowserLanguage, getEvaluationMeta, getPriorityMeta, getStatusMeta, languageLabels, languages, t, type Language } from "@/lib/i18n";
import { STATUS_ORDER } from "@/lib/status";
import type { EvaluationKey, TaskStatus, WeekPlan } from "@/types/planner";

type SharePlanViewProps = {
  token: string;
};

type Permission = {
  canUpdateStatus: boolean;
  canUpdateEvaluations: boolean;
};

const statusOptions = STATUS_ORDER.filter((status) => status !== "pending");

const spring = {
  type: "spring",
  stiffness: 260,
  damping: 24
} as const;

export function SharePlanView({ token }: SharePlanViewProps) {
  const [language, setLanguage] = useState<Language>(() => getBrowserLanguage());
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [permission, setPermission] = useState<Permission>({
    canUpdateStatus: false,
    canUpdateEvaluations: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(() => t(getBrowserLanguage(), "share.loadingMessage"));
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusMeta = getStatusMeta(language);
  const priorityMeta = getPriorityMeta(language);
  const evaluationMeta = getEvaluationMeta(language);

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("almond-language", nextLanguage);
    }
  };

  const loadPlan = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/share/${token}`);
      const data = (await response.json().catch(() => null)) as
        | {
            plan?: WeekPlan;
            permission?: Permission;
            error?: string;
          }
        | null;

      if (!response.ok || !data?.plan) {
        throw new Error(data?.error || t(language, "share.loadFailed"));
      }

      setPlan(data.plan);
      setPermission(data.permission ?? { canUpdateStatus: true, canUpdateEvaluations: true });
      setMessage(t(language, "share.loadedMessage"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t(language, "share.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [language, token]);

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  const patchPlan = useCallback(
    async (nextPlan: WeekPlan, delay = 250) => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          const response = await fetch(`/api/share/${token}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              tasks: nextPlan.tasks.map((task) => ({
                id: task.id,
                status: task.status
              })),
              evaluations: nextPlan.evaluations
            })
          });
          const data = (await response.json().catch(() => null)) as { plan?: WeekPlan; error?: string } | null;

          if (!response.ok || !data?.plan) {
            throw new Error(data?.error || t(language, "share.syncFailed"));
          }

          setPlan(data.plan);
          setMessage(t(language, "share.synced"));
        } catch (error) {
          setMessage(error instanceof Error ? error.message : t(language, "share.syncFailed"));
        } finally {
          setSaving(false);
        }
      }, delay);
    },
    [language, token]
  );

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!plan || !permission.canUpdateStatus) {
      return;
    }

    const next = {
      ...plan,
      tasks: plan.tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
    };
    setPlan(next);
    void patchPlan(next);
  };

  const updateEvaluation = (key: EvaluationKey, content: string) => {
    if (!plan || !permission.canUpdateEvaluations) {
      return;
    }

    const next = {
      ...plan,
      evaluations: {
        ...plan.evaluations,
        [key]: content
      }
    };
    setPlan(next);
    void patchPlan(next, 700);
  };

  return (
    <main className="app-shell min-h-dvh px-4 pb-10 pt-4 text-blossom-ink sm:px-6 lg:px-8">
      <div className="ambient-layer" aria-hidden="true">
        <span className="branch-stroke branch-stroke-a" />
        <span className="branch-stroke branch-stroke-b" />
        <span className="branch-stroke branch-stroke-c" />
      </div>
      <div className="petal petal-a" />
      <div className="petal petal-b" />
      <div className="petal petal-d" />
      <div className="petal petal-e" />
      <div className="mx-auto max-w-6xl">
        <motion.header
          className="mb-5 flex flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/85 px-4 text-sm font-black text-blossom-ink shadow-sm"
            href="/"
          >
            <ArrowLeft className="size-4" />
            {t(language, "share.backHome")}
          </Link>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blossom-deep/15 bg-white/85 px-3 text-xs font-black text-blossom-deep shadow-sm">
            <span className="hidden sm:inline">{t(language, "language")}</span>
            <select
              className="bg-transparent text-sm font-black text-blossom-ink outline-none"
              value={language}
              onChange={(event) => changeLanguage(event.target.value as Language)}
              aria-label={t(language, "language")}
            >
              {languages.map((item) => (
                <option key={item} value={item}>
                  {languageLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-flex items-center gap-2 rounded-full border border-blossom-deep/15 bg-white/85 px-4 py-2 text-sm font-bold text-blossom-deep">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 text-blossom-gold" />}
            {saving ? t(language, "share.saving") : t(language, "share.title")}
          </div>
        </motion.header>

        <motion.section
          className="glass-panel rounded-lg p-5 sm:p-7"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 text-sm font-bold text-blossom-deep">
              <Loader2 className="size-5 animate-spin" />
              {t(language, "share.loading")}
            </div>
          ) : plan ? (
            <>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px] md:items-end">
                <div>
                  <p className="mb-3 inline-flex rounded-full border border-blossom-deep/15 bg-white/75 px-3 py-1 text-xs font-black text-blossom-deep">
                    {plan.startDate} {language === "en" ? "to" : language === "ko" ? "~" : "至"} {plan.endDate}
                  </p>
                  <h1 className="text-[clamp(2rem,8vw,4.8rem)] font-black leading-none">
                    <span className="brush-underline">{plan.title}</span>
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-blossom-deep/78">{plan.bigGoal}</p>
                </div>
                <div className="grid gap-2">
                  <motion.button className="motion-sheen inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blossom-ink px-4 text-sm font-black text-white" type="button" onClick={() => exportPlanPdf(plan, { language })} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <FileDown className="size-4" />
                    {t(language, "share.downloadPdf")}
                  </motion.button>
                  <motion.button className="motion-sheen inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blossom-deep/15 bg-white px-4 text-sm font-black text-blossom-ink" type="button" onClick={() => exportPlanHtml(plan, { language })} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Download className="size-4" />
                    {t(language, "share.downloadHtml")}
                  </motion.button>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-blossom-deep/15 bg-white/78 px-4 py-3 text-sm text-blossom-deep">{message}</div>
            </>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{message}</div>
          )}
        </motion.section>

        {plan ? (
          <>
            <motion.section className="mt-5 grid gap-4 md:grid-cols-2" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
              {plan.tasks.map((task, index) => (
                <motion.article
                  key={task.id}
                  className="paper-panel rounded-lg p-4"
                  variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                  transition={{ ...spring, delay: index * 0.03 }}
                  whileHover={{ y: -3 }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blossom-deep text-sm font-black text-white">{index + 1}</span>
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-black">{task.title}</h2>
                      <p className="text-xs font-bold text-blossom-deep/64">{task.date || t(language, "noDate")}</p>
                    </div>
                  </div>
                  <p className="min-h-14 break-words text-sm leading-6 text-blossom-deep/78">{task.detail || t(language, "noDetail")}</p>
                  <div
                    className="mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-black"
                    style={{
                      borderColor: priorityMeta[task.priority].border,
                      background: priorityMeta[task.priority].bg,
                      color: priorityMeta[task.priority].color
                    }}
                    title={priorityMeta[task.priority].description}
                  >
                    {t(language, "taskPriority")}: {priorityMeta[task.priority].label}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {statusOptions.map((status) => {
                      const meta = statusMeta[status];
                      const active = task.status === status;
                      return (
                        <motion.button
                          key={status}
                          className={`relative min-h-11 overflow-hidden rounded-lg border px-3 text-sm font-black transition disabled:opacity-60 ${active ? "status-pulse" : ""}`}
                          disabled={!permission.canUpdateStatus}
                          style={{
                            borderColor: active ? meta.color : meta.border,
                            background: active ? meta.color : meta.bg,
                            color: active ? "#ffffff" : meta.color
                          }}
                          type="button"
                          onClick={() => updateTaskStatus(task.id, status)}
                          whileHover={permission.canUpdateStatus ? { y: -2, scale: 1.01 } : undefined}
                          whileTap={permission.canUpdateStatus ? { scale: 0.96 } : undefined}
                        >
                          <span className="relative">{meta.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.article>
              ))}
            </motion.section>

            <motion.section className="paper-panel mt-5 rounded-lg p-4 sm:p-5" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
              <h2 className="text-xl font-black">{t(language, "share.collaborationReviews")}</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(Object.keys(evaluationMeta) as EvaluationKey[]).map((key) => {
                  const meta = evaluationMeta[key];
                  return (
                    <label key={key} className="space-y-2">
                      <span className="text-sm font-black text-blossom-deep">{meta.label}</span>
                      <textarea
                        className="min-h-32 w-full resize-y rounded-lg border border-blossom-deep/15 bg-white/90 px-4 py-3 leading-7 outline-none transition focus:border-blossom-deep disabled:opacity-70"
                        disabled={!permission.canUpdateEvaluations}
                        placeholder={meta.placeholder}
                        value={plan.evaluations[key]}
                        onChange={(event) => updateEvaluation(key, event.target.value)}
                      />
                    </label>
                  );
                })}
              </div>
            </motion.section>
          </>
        ) : null}
      </div>
    </main>
  );
}
