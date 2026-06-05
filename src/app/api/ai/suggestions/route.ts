import { errorResponse, jsonResponse } from "@/lib/api";
import type { AiSuggestion, WeekPlan } from "@/types/planner";

const fallbackSuggestion: AiSuggestion = {
  summary: "AI 建议暂时不可用，但你仍然可以先按大目标、关键行动和复盘评价推进。",
  strengths: ["计划已经包含大目标、小计划、日期和状态，具备复盘基础。"],
  risks: ["如果小计划过多或描述过宽，执行时可能难以判断是否完成。"],
  revisions: ["把每个小计划改成可观察的行动，例如“完成 20 道题并订正错题”。"],
  nextSteps: ["先选择本周最重要的 3 个任务，再安排每天的具体时间。"]
};

const extractResponsesText = (data: unknown) => {
  const value = data as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };

  if (value.output_text) {
    return value.output_text;
  }

  return (
    value.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("\n")
      .trim() ?? ""
  );
};

export async function POST(request: Request) {
  const plan = (await request.json().catch(() => null)) as WeekPlan | null;

  if (!plan) {
    return errorResponse("计划数据不完整。");
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonResponse(
      {
        suggestion: fallbackSuggestion,
        notice: "未配置 OPENAI_API_KEY，当前返回本地兜底建议。"
      },
      { status: 200 }
    );
  }

  const prompt = `你是一位严谨但鼓励人的学习计划教练。请分析下面的周计划，输出严格 JSON，不要 markdown。

JSON schema:
{
  "summary": "一句话总体判断",
  "strengths": ["优点1", "优点2"],
  "risks": ["风险1", "风险2"],
  "revisions": ["可直接修改的建议1", "可直接修改的建议2"],
  "nextSteps": ["下一步行动1", "下一步行动2"]
}

要求：
- 重点判断目标是否合理、任务是否可执行、时间是否拥挤。
- 建议要具体、温和、可执行。
- 不要替用户编造不存在的背景。

周计划:
${JSON.stringify(plan, null, 2)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-5.4",
        input: prompt,
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    if (!response.ok) {
      const message = await response.text();
      return errorResponse(`AI 接口调用失败：${message}`, response.status);
    }

    const data = await response.json();
    const text = extractResponsesText(data);
    const suggestion = JSON.parse(text) as AiSuggestion;

    return jsonResponse({ suggestion });
  } catch (error) {
    return jsonResponse(
      {
        suggestion: fallbackSuggestion,
        notice: error instanceof Error ? error.message : "AI 建议生成失败，已返回兜底建议。"
      },
      { status: 200 }
    );
  }
}
