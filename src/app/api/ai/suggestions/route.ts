import { errorResponse, jsonResponse } from "@/lib/api";
import { getFallbackSuggestion, languageNames, normalizeLanguage } from "@/lib/i18n";
import type { AiSuggestion, WeekPlan } from "@/types/planner";

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
  const body = (await request.json().catch(() => null)) as WeekPlan | { plan?: WeekPlan; language?: string } | null;
  const plan = body && "plan" in body ? body.plan ?? null : (body as WeekPlan | null);
  const language = normalizeLanguage(body && "language" in body ? body.language : undefined);
  const fallbackSuggestion = getFallbackSuggestion(language);

  if (!plan) {
    return errorResponse("计划数据不完整。");
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonResponse(
      {
        suggestion: fallbackSuggestion,
        notice:
          language === "zh"
            ? "未配置 OPENAI_API_KEY，当前返回本地兜底建议。"
            : language === "ja"
              ? "OPENAI_API_KEY が未設定のため、ローカルの予備提案を返しています。"
              : language === "ko"
                ? "OPENAI_API_KEY가 설정되지 않아 로컬 기본 제안을 반환합니다."
                : "OPENAI_API_KEY is not configured, so a local fallback suggestion is returned."
      },
      { status: 200 }
    );
  }

  const prompt = `You are a rigorous but encouraging weekly learning-plan coach. Analyze the weekly plan below and respond in ${languageNames[language]}. Output strict JSON only, no markdown.

JSON schema:
{
  "summary": "one-sentence overall judgment",
  "strengths": ["strength 1", "strength 2"],
  "risks": ["risk 1", "risk 2"],
  "revisions": ["specific revision 1", "specific revision 2"],
  "nextSteps": ["next action 1", "next action 2"]
}

Requirements:
- Focus on whether the goal is reasonable, whether tasks are executable, and whether time is crowded.
- Make suggestions specific, kind, and actionable.
- Do not invent background details that the user did not provide.
- All string values in the JSON must be in ${languageNames[language]}.

Weekly plan:
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
