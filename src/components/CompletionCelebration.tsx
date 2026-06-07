"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { t, type Language } from "@/lib/i18n";
import { getMotivationQuote } from "@/lib/motivation";
import type { WeekPlan } from "@/types/planner";

const doneStatuses = new Set(["excellent", "basic"]);

export function CompletionCelebration({ language, plan }: { language: Language; plan?: WeekPlan | null }) {
  const [dismissedPlanId, setDismissedPlanId] = useState<string | null>(null);
  const complete =
    Boolean(plan?.tasks.length) && plan!.tasks.every((task) => doneStatuses.has(task.status));
  const quote = useMemo(() => (plan ? getMotivationQuote(plan, language) : null), [language, plan]);

  useEffect(() => {
    if (!complete) {
      setDismissedPlanId(null);
    }
  }, [complete, plan?.id]);

  const visible = complete && plan?.id !== dismissedPlanId && quote;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-blossom-ink/24 px-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-white/70 bg-white/92 p-6 text-center text-blossom-ink shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 230, damping: 20 }}
          >
            <button
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full border border-blossom-deep/15 bg-white/80 text-blossom-deep"
              type="button"
              onClick={() => setDismissedPlanId(plan!.id)}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => (
                <motion.span
                  key={index}
                  className="absolute size-3 rounded-full bg-pink-200/80"
                  style={{ left: `${8 + ((index * 19) % 84)}%`, top: "-8%" }}
                  animate={{ y: ["0%", "820%"], x: [0, index % 2 ? 34 : -28], rotate: [0, 180, 360] }}
                  transition={{ duration: 2.8 + (index % 5) * 0.25, repeat: Infinity, delay: index * 0.08, ease: "easeInOut" }}
                />
              ))}
            </div>
            <motion.div
              className="mx-auto grid size-16 place-items-center rounded-full bg-blossom-sky/20 text-blossom-gold"
              animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="size-8" />
            </motion.div>
            <h2 className="mt-4 text-2xl font-black">{t(language, "completionTitle")}</h2>
            <p className="mt-2 text-sm font-bold text-blossom-deep/72">{t(language, "completionSubtitle")}</p>
            <blockquote className="relative z-10 mt-5 rounded-lg border border-blossom-deep/10 bg-white/78 p-4 text-left">
              <p className="text-base font-black leading-8">{quote.text}</p>
              <footer className="mt-3 text-sm font-bold text-blossom-deep/62">{quote.author}</footer>
            </blockquote>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
