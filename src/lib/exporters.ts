"use client";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, StandardFonts, type Color, type PDFFont, type PDFPage } from "pdf-lib";
import { STATUS_ORDER } from "@/lib/status";
import { getEvaluationMeta, getPriorityMeta, getStatusMeta, normalizeLanguage, t, type Language } from "@/lib/i18n";
import type { TaskStatus, WeekPlan } from "@/types/planner";

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 60) || "week-plan";

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const bigint = Number.parseInt(normalized, 16);
  return rgb(((bigint >> 16) & 255) / 255, ((bigint >> 8) & 255) / 255, (bigint & 255) / 255);
};

const isLatinChar = (char: string) => /^[\u0000-\u00ff]$/.test(char);

const textWidth = (text: string, cjkFont: PDFFont, latinFont: PDFFont, fontSize: number) =>
  Array.from(text).reduce((width, char) => {
    const font = isLatinChar(char) ? latinFont : cjkFont;
    return width + font.widthOfTextAtSize(char, fontSize);
  }, 0);

const wrapText = (text: string, cjkFont: PDFFont, latinFont: PDFFont, fontSize: number, maxWidth: number) => {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let current = "";

  for (const char of Array.from(normalized)) {
    const next = `${current}${char}`;
    if (textWidth(next, cjkFont, latinFont, fontSize) > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
};

const drawMixedText = (
  page: PDFPage,
  text: string,
  cjkFont: PDFFont,
  latinFont: PDFFont,
  fontSize: number,
  x: number,
  y: number,
  color: Color
) => {
  let cursor = x;

  for (const char of Array.from(text)) {
    const font = isLatinChar(char) ? latinFont : cjkFont;
    page.drawText(char, {
      x: cursor,
      y,
      font,
      size: fontSize,
      color
    });
    cursor += font.widthOfTextAtSize(char, fontSize);
  }
};

const drawWrapped = (
  page: PDFPage,
  text: string,
  cjkFont: PDFFont,
  latinFont: PDFFont,
  fontSize: number,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color = rgb(0.1, 0.16, 0.21)
) => {
  const lines = wrapText(text, cjkFont, latinFont, fontSize, maxWidth);
  lines.forEach((line, index) => {
    drawMixedText(page, line, cjkFont, latinFont, fontSize, x, y - index * lineHeight, color);
  });

  return y - lines.length * lineHeight;
};

const statusValues: TaskStatus[] = ["excellent", "basic", "stopped", "postponed"];
const pageSize: [number, number] = [595.28, 841.89];
const pageWidth = pageSize[0];
const pageHeight = pageSize[1];
const margin = 42;

const drawBackground = (page: PDFPage) => {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(1, 0.98, 0.94)
  });
};

const drawRule = (page: PDFPage, y: number) => {
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.8,
    color: rgb(0.78, 0.86, 0.88)
  });
};

export const exportPlanPdf = async (plan: WeekPlan, options: { language?: Language } = {}) => {
  const language = normalizeLanguage(options.language);
  const statusMeta = getStatusMeta(language);
  const priorityMeta = getPriorityMeta(language);
  const evaluationMeta = getEvaluationMeta(language);
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  let cjkFont: PDFFont;
  const latinFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const latinBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  try {
    const fontBytes = await fetch("/fonts/ArialUnicode.ttf").then((res) => res.arrayBuffer());
    cjkFont = await pdfDoc.embedFont(fontBytes, { subset: true });
  } catch {
    cjkFont = latinFont;
  }

  const form = pdfDoc.getForm();
  let page = pdfDoc.addPage(pageSize);
  let y = 790;

  const ensureSpace = (height: number) => {
    if (y - height > 58) {
      return;
    }
    page = pdfDoc.addPage(pageSize);
    drawBackground(page);
    y = 790;
  };

  drawBackground(page);

  drawMixedText(page, plan.title || t(language, "export.pdfTitleFallback"), cjkFont, latinBoldFont, 22, margin, y, rgb(0.09, 0.23, 0.32));
  y -= 28;

  drawMixedText(
    page,
    t(language, "export.period", { start: plan.startDate || t(language, "unset"), end: plan.endDate || t(language, "unset") }),
    cjkFont,
    latinFont,
    11,
    margin,
    y,
    rgb(0.27, 0.39, 0.46)
  );
  y -= 24;

  y = drawWrapped(
    page,
    t(language, "export.bigGoal", { goal: plan.bigGoal || t(language, "unfilled") }),
    cjkFont,
    latinFont,
    11,
    margin,
    y,
    pageWidth - margin * 2,
    16
  );
  y -= 14;

  drawRule(page, y);
  y -= 24;

  drawMixedText(page, t(language, "export.statusLegend"), cjkFont, latinBoldFont, 13, margin, y, rgb(0.09, 0.23, 0.32));
  y -= 20;

  STATUS_ORDER.filter((status) => status !== "pending").forEach((status, index) => {
    const meta = statusMeta[status];
    const x = margin + index * 126;
    page.drawRectangle({
      x,
      y: y - 1,
      width: 10,
      height: 10,
      color: hexToRgb(meta.color)
    });
    drawMixedText(page, meta.label, cjkFont, latinFont, 10, x + 15, y - 1, rgb(0.15, 0.22, 0.27));
  });
  y -= 28;

  drawMixedText(page, t(language, "export.tasksAndStatus"), cjkFont, latinBoldFont, 13, margin, y, rgb(0.09, 0.23, 0.32));
  y -= 18;

  plan.tasks.forEach((task, taskIndex) => {
    const detailLines = wrapText(task.detail || t(language, "noDetail"), cjkFont, latinFont, 9, 250).slice(0, 3);
    const rowHeight = Math.max(102, 72 + detailLines.length * 13);
    ensureSpace(rowHeight + 12);

    const rowTop = y;
    const rowBottom = y - rowHeight;

    page.drawRectangle({
      x: margin,
      y: rowBottom,
      width: pageWidth - margin * 2,
      height: rowHeight,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.8, 0.87, 0.88),
      borderWidth: 1
    });

    drawMixedText(page, `${taskIndex + 1}.`, cjkFont, latinBoldFont, 12, margin + 12, rowTop - 22, rgb(0.09, 0.23, 0.32));
    drawWrapped(page, task.title || t(language, "unnamedTask"), cjkFont, latinBoldFont, 12, margin + 40, rowTop - 22, 250, 14, rgb(0.09, 0.23, 0.32));
    drawMixedText(page, t(language, "export.date", { date: task.date || t(language, "noDate") }), cjkFont, latinFont, 9, margin + 40, rowTop - 42, rgb(0.38, 0.46, 0.52));
    drawMixedText(
      page,
      t(language, "export.priority", { priority: priorityMeta[task.priority].label }),
      cjkFont,
      latinFont,
      9,
      margin + 40,
      rowTop - 55,
      hexToRgb(priorityMeta[task.priority].color)
    );

    detailLines.forEach((line, index) => {
      drawMixedText(page, line, cjkFont, latinFont, 9, margin + 40, rowTop - 71 - index * 13, rgb(0.25, 0.33, 0.38));
    });

    statusValues.forEach((status, statusIndex) => {
      const meta = statusMeta[status];
      const checkbox = form.createCheckBox(`task_${task.id}_${status}`);
      if (task.status === status) {
        checkbox.check();
      }
      const x = margin + 318 + (statusIndex % 2) * 96;
      const checkboxY = rowTop - 34 - Math.floor(statusIndex / 2) * 30;
      checkbox.addToPage(page, {
        x,
        y: checkboxY,
        width: 12,
        height: 12,
        borderColor: hexToRgb(meta.color),
        backgroundColor: hexToRgb(meta.bg)
      });
      drawMixedText(page, meta.label, cjkFont, latinFont, 9, x + 17, checkboxY + 2, hexToRgb(meta.color));
    });

    y = rowBottom - 10;
  });

  y -= 4;
  drawMixedText(page, t(language, "export.evaluations"), cjkFont, latinBoldFont, 13, margin, y, rgb(0.09, 0.23, 0.32));
  y -= 18;

  Object.entries(evaluationMeta).forEach(([key, meta]) => {
    ensureSpace(104);

    drawMixedText(page, meta.label, cjkFont, latinBoldFont, 11, margin, y, rgb(0.09, 0.23, 0.32));
    y -= 68;

    const field = form.createTextField(`evaluation_${key}`);
    field.enableMultiline();
    field.setText(plan.evaluations[key as keyof typeof plan.evaluations] || "");
    field.addToPage(page, {
      x: margin,
      y,
      width: pageWidth - margin * 2,
      height: 58,
      borderColor: rgb(0.74, 0.82, 0.84),
      backgroundColor: rgb(1, 1, 1),
      textColor: rgb(0.1, 0.16, 0.21)
    });
    y -= 26;
  });

  form.updateFieldAppearances(cjkFont);
  const bytes = await pdfDoc.save();
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  downloadBlob(new Blob([buffer], { type: "application/pdf" }), `${sanitizeFilename(plan.title)}.pdf`);
};

const escapeScriptData = (value: string) => value.replace(/</g, "\\u003c").replace(/>/g, "\\u003e");

export const exportPlanHtml = (plan: WeekPlan, options: { language?: Language } = {}) => {
  const language = normalizeLanguage(options.language);
  const statusMeta = getStatusMeta(language);
  const priorityMeta = getPriorityMeta(language);
  const evaluationMeta = getEvaluationMeta(language);
  const planJson = escapeScriptData(JSON.stringify(plan));
  const apiOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const html = `<!doctype html>
<html lang="${language === "zh" ? "zh-CN" : language}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${plan.title}</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; background: #fff8ef; color: #172936; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100dvh; background: radial-gradient(circle at 18% 12%, #f8d8dc 0 8%, transparent 22%), linear-gradient(135deg, #d9edf5, #fff8ef 52%, #f7dfe3); }
    main { max-width: 980px; margin: 0 auto; padding: 24px; }
    header { padding: 20px 0 12px; }
    h1 { margin: 0; font-size: clamp(26px, 7vw, 54px); line-height: 1; }
    .goal, .card, .eval { background: rgba(255,255,255,.82); border: 1px solid rgba(23,70,99,.16); border-radius: 8px; box-shadow: 0 14px 42px rgba(23,70,99,.14); }
    .goal { padding: 18px; margin: 18px 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
    .card, .eval { padding: 16px; }
    .task-title { font-weight: 800; }
    .priority { display: inline-flex; margin-top: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--color); border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 800; }
    .status { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 12px; }
    button { border: 1px solid var(--border); background: var(--bg); color: var(--color); border-radius: 999px; min-height: 38px; font-weight: 700; cursor: pointer; touch-action: manipulation; }
    button.active { box-shadow: inset 0 0 0 2px var(--color); }
    textarea { width: 100%; min-height: 92px; border: 1px solid #bdd1d8; border-radius: 8px; padding: 10px; font: inherit; background: rgba(255,255,255,.9); }
    .evals { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 16px; }
    .sync { position: sticky; bottom: 10px; margin-top: 18px; padding: 12px; border-radius: 8px; background: rgba(23,70,99,.9); color: white; }
  </style>
</head>
<body>
<main>
  <header>
    <h1 id="title"></h1>
    <p id="dates"></p>
  </header>
  <section class="goal"><strong>${t(language, "export.htmlGoal")}</strong><p id="goal"></p></section>
  <section id="tasks" class="grid"></section>
  <section id="evals" class="evals"></section>
  <div id="sync" class="sync">${t(language, "export.offlineLoaded")}</div>
</main>
<script>
const plan = ${planJson};
const statusMeta = ${JSON.stringify(statusMeta)};
const priorityMeta = ${JSON.stringify(priorityMeta)};
const statusValues = ["excellent", "basic", "stopped", "postponed"];
const evalMeta = ${JSON.stringify(evaluationMeta)};
const apiOrigin = ${JSON.stringify(apiOrigin)};
const text = ${JSON.stringify({
  to: language === "en" ? " to " : language === "ko" ? " ~ " : " 至 ",
  noDetail: t(language, "noDetail"),
  noDate: t(language, "noDate"),
  priorityLabel: t(language, "taskPriority"),
  syncingOnline: t(language, "export.syncingOnline"),
  syncedOnline: t(language, "export.syncedOnline"),
  syncOnlineFailed: t(language, "export.syncOnlineFailed")
})};
const key = "almond-export-" + plan.id;
const saved = JSON.parse(localStorage.getItem(key) || "null");
if (saved) {
  plan.tasks = plan.tasks.map(task => ({ ...task, status: saved.statuses?.[task.id] || task.status }));
  plan.evaluations = { ...plan.evaluations, ...saved.evaluations };
}
const save = async () => {
  const payload = {
    statuses: Object.fromEntries(plan.tasks.map(task => [task.id, task.status])),
    evaluations: plan.evaluations
  };
  localStorage.setItem(key, JSON.stringify(payload));
  if (plan.shareToken && apiOrigin) {
    document.getElementById("sync").textContent = text.syncingOnline;
    try {
      await fetch(apiOrigin + "/api/share/" + plan.shareToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: plan.tasks.map(task => ({ id: task.id, status: task.status })),
          evaluations: plan.evaluations
        })
      });
      document.getElementById("sync").textContent = text.syncedOnline;
    } catch {
      document.getElementById("sync").textContent = text.syncOnlineFailed;
    }
  }
};
document.getElementById("title").textContent = plan.title;
document.getElementById("dates").textContent = plan.startDate + text.to + plan.endDate;
document.getElementById("goal").textContent = plan.bigGoal;
const taskRoot = document.getElementById("tasks");
const renderTasks = () => {
  taskRoot.innerHTML = "";
  plan.tasks.forEach(task => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = '<div class="task-title"></div><p></p><small></small><div class="priority"></div><div class="status"></div>';
    card.querySelector(".task-title").textContent = task.title;
    card.querySelector("p").textContent = task.detail || text.noDetail;
    card.querySelector("small").textContent = task.date || text.noDate;
    const priority = priorityMeta[task.priority || "medium"];
    const priorityBadge = card.querySelector(".priority");
    priorityBadge.textContent = text.priorityLabel + ": " + priority.label;
    priorityBadge.style.setProperty("--bg", priority.bg);
    priorityBadge.style.setProperty("--border", priority.border);
    priorityBadge.style.setProperty("--color", priority.color);
    const box = card.querySelector(".status");
    statusValues.forEach(status => {
      const button = document.createElement("button");
      const meta = statusMeta[status];
      button.textContent = meta.label;
      button.className = task.status === status ? "active" : "";
      button.style.setProperty("--bg", meta.bg);
      button.style.setProperty("--border", meta.border);
      button.style.setProperty("--color", meta.color);
      button.onclick = () => { task.status = status; renderTasks(); save(); };
      box.appendChild(button);
    });
    taskRoot.appendChild(card);
  });
};
const evalRoot = document.getElementById("evals");
Object.entries(evalMeta).forEach(([key, meta]) => {
  const item = document.createElement("label");
  item.className = "eval";
  item.innerHTML = '<strong></strong><textarea></textarea>';
  item.querySelector("strong").textContent = meta.label;
  const area = item.querySelector("textarea");
  area.placeholder = meta.placeholder;
  area.value = plan.evaluations[key] || "";
  area.oninput = () => { plan.evaluations[key] = area.value; save(); };
  evalRoot.appendChild(item);
});
renderTasks();
</script>
</body>
</html>`;

  downloadBlob(new Blob([html], { type: "text/html;charset=utf-8" }), `${sanitizeFilename(plan.title)}.html`);
};
