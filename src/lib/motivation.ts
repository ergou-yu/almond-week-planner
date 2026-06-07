import type { WeekPlan } from "@/types/planner";
import type { Language } from "@/lib/i18n";

type QuoteCategory = "math" | "language" | "art" | "code" | "music" | "sport" | "general";

type Quote = {
  author: string;
  text: Record<Language, string>;
};

const categoryKeywords: Record<QuoteCategory, string[]> = {
  math: ["数学", "竞赛", "amc", "aime", "algebra", "geometry", "calculus", "math", "算", "证明"],
  language: ["听力", "阅读", "写作", "英语", "日语", "韩语", "toefl", "ielts", "sat", "language", "read", "listen", "word"],
  art: ["画", "艺术", "梵高", "设计", "摄影", "素描", "art", "paint", "design"],
  code: ["代码", "编程", "算法", "python", "javascript", "coding", "program", "app"],
  music: ["音乐", "钢琴", "吉他", "唱", "乐理", "music", "piano", "guitar"],
  sport: ["运动", "跑步", "游泳", "篮球", "足球", "训练", "sport", "run", "swim"],
  general: []
};

const quotes: Record<QuoteCategory, Quote[]> = {
  math: [
    {
      author: "Sofia Kovalevskaya",
      text: {
        zh: "数学不是冷冰冰的答案，而是把混乱整理成清晰的勇气。",
        en: "Mathematics is not cold answers; it is the courage to turn confusion into clarity.",
        ja: "数学は冷たい答えではなく、混乱を明晰さへ整える勇気です。",
        ko: "수학은 차가운 답이 아니라 혼란을 명료함으로 바꾸는 용기입니다."
      }
    },
    {
      author: "Ada Lovelace",
      text: {
        zh: "真正厉害的思考，是看见规则，也看见规则背后的想象力。",
        en: "Strong thinking sees the rule, and also the imagination behind it.",
        ja: "強い思考は規則だけでなく、その奥にある想像力も見ます。",
        ko: "좋은 사고는 규칙뿐 아니라 그 뒤의 상상력까지 봅니다."
      }
    }
  ],
  language: [
    {
      author: "Maya Angelou",
      text: {
        zh: "语言能力不是一夜长成的，它来自一次次愿意听懂世界的练习。",
        en: "Language grows through repeated attempts to understand the world.",
        ja: "言語力は、世界を理解しようとする練習の積み重ねで育ちます。",
        ko: "언어 실력은 세상을 이해하려는 반복된 연습에서 자랍니다."
      }
    }
  ],
  art: [
    {
      author: "Vincent van Gogh",
      text: {
        zh: "像杏花一样，完成一件小事也是一次新生。",
        en: "Like almond blossoms, finishing one small thing can be a new beginning.",
        ja: "杏の花のように、小さな完了も新しい始まりになります。",
        ko: "아몬드 꽃처럼 작은 완성도 새로운 시작이 됩니다."
      }
    }
  ],
  code: [
    {
      author: "Grace Hopper",
      text: {
        zh: "把问题拆小，再把每一步做稳，复杂的东西就会开始听话。",
        en: "Break the problem down, make each step steady, and complexity starts to behave.",
        ja: "問題を小さく分け、一歩ずつ安定させれば、複雑さは扱いやすくなります。",
        ko: "문제를 작게 나누고 한 걸음씩 단단히 만들면 복잡함도 다루기 쉬워집니다."
      }
    }
  ],
  music: [
    {
      author: "Clara Schumann",
      text: {
        zh: "练习的意义，是让今天的手比昨天更懂心里的声音。",
        en: "Practice lets today's hands understand the sound in your heart a little better.",
        ja: "練習とは、今日の手が心の音を昨日より少し理解することです。",
        ko: "연습은 오늘의 손이 마음속 소리를 어제보다 조금 더 이해하게 합니다."
      }
    }
  ],
  sport: [
    {
      author: "Wilma Rudolph",
      text: {
        zh: "进步常常很安静，但它会在你坚持的地方发光。",
        en: "Progress is often quiet, but it shines where you keep going.",
        ja: "進歩は静かですが、続けた場所で光ります。",
        ko: "진전은 조용하지만 계속한 자리에서 빛납니다."
      }
    }
  ],
  general: [
    {
      author: "Marie Curie",
      text: {
        zh: "你完成的不是清单，而是一次对自己的兑现。",
        en: "You did not just finish a list; you kept a promise to yourself.",
        ja: "終えたのはリストだけでなく、自分との約束です。",
        ko: "끝낸 것은 목록만이 아니라 자신과의 약속입니다."
      }
    }
  ]
};

const scoreCategory = (text: string, category: QuoteCategory) =>
  categoryKeywords[category].reduce((score, keyword) => score + (text.includes(keyword) ? 1 : 0), 0);

export const getMotivationQuote = (plan: WeekPlan, language: Language) => {
  const source = [plan.title, plan.bigGoal, ...plan.tasks.flatMap((task) => [task.title, task.detail])].join(" ").toLowerCase();
  const [best] = (Object.keys(categoryKeywords) as QuoteCategory[])
    .filter((category) => category !== "general")
    .map((category) => ({ category, score: scoreCategory(source, category) }))
    .sort((a, b) => b.score - a.score);
  const category = best && best.score > 0 ? best.category : "general";

  const pool = quotes[category];
  const seed = [...source].reduce((sum, char) => sum + char.charCodeAt(0), new Date().getDate());
  const quote = pool[seed % pool.length];
  return {
    author: quote.author,
    text: quote.text[language]
  };
};
