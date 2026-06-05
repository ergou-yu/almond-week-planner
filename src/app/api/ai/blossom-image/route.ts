import { errorResponse, jsonResponse } from "@/lib/api";

export async function POST() {
  if (!process.env.OPENAI_API_KEY) {
    return errorResponse("未配置 OPENAI_API_KEY。", 503);
  }

  const prompt =
    "Create an original post-impressionist almond blossom background for a weekly planning web app. Blue sky, pale blossoms, expressive branches, visible brush texture, not a direct replica of any museum painting, no text.";

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      prompt,
      size: "1536x1024"
    })
  });

  if (!response.ok) {
    return errorResponse(await response.text(), response.status);
  }

  const data = await response.json();
  return jsonResponse(data);
}
