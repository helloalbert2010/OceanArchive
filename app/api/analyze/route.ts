import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type GlmMessageContent = string | Array<{
  type: "text" | "image_url";
  text?: string;
  image_url?: { url: string };
}>;

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "");
}

function normalizeModel(value: string | undefined, fallback: string) {
  const model = (cleanEnvValue(value) || fallback).toLowerCase().replace(/\s+/g, "");
  if (model === "glm5.2" || model === "glm-5-2") return "glm-5.2";
  if (model === "glm5v-turbo" || model === "glm-5-v-turbo") return "glm-5v-turbo";
  return model;
}

async function callGlm(model: string, content: GlmMessageContent, system: string) {
  const keys = [process.env.GLM_API_KEY, process.env.GLM_API_KEY_BACKUP]
    .map(cleanEnvValue)
    .filter(Boolean) as string[];
  if (!keys.length) return null;

  let lastError = "AI 服务请求失败";
  for (const key of keys) {
    try {
      const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          temperature: 0.75,
          max_tokens: 600,
          thinking: { type: "disabled" },
          messages: [
            { role: "system", content: system },
            { role: "user", content },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        lastError = data?.error?.message ?? `AI 服务返回 ${response.status}`;
        continue;
      }
      const rawResult = data?.choices?.[0]?.message?.content;
      const result = typeof rawResult === "string"
        ? rawResult
        : Array.isArray(rawResult)
          ? rawResult.map((item: { type?: string; text?: string }) => item.text ?? "").join("")
          : "";
      if (result.trim()) return result.trim();
      lastError = "AI 服务没有返回有效内容";
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }
  throw new Error(lastError);
}

function localTextAnalysis(title: string, body: string) {
  const text = `${title}${body}`;
  if (/塑料|垃圾|油膜|污染/.test(text)) {
    return "这段记录让一种常被忽略的海洋压力变得具体：陆地生活、航运和渔业产生的污染物，会沿河流与洋流进入更远的海域。单次观察无法确认完整来源，但时间、坐标和照片能帮助后续追踪。持续留下这样的第一手记录，会让污染不再只是一个抽象数字。";
  }
  if (/珊瑚|暖流|水温|白化/.test(text)) {
    return "你观察到的水温与生态变化值得持续记录。海水长时间异常偏暖会给珊瑚和近岸生态系统带来压力，而沿岸污染、过度捕捞等人类活动又可能削弱它们的恢复能力。一次见闻不能代替长期监测，但水手跨海域的连续记录能补上非常珍贵的现场细节。";
  }
  if (/风暴|台风|巨浪|极端/.test(text)) {
    return "强风暴本身是自然系统的一部分，单次事件也不能直接归因于全球变暖。不过，更暖的海洋和大气能为部分极端天气提供更多能量与水汽。把位置、时间、风速、气压和浪高一起记下，会让这段经历成为更有价值的长期观察。";
  }
  return "这是一份很有现场感的海上观察。海洋变化往往不是由单一因素造成的，自然周期、气候背景与沿岸人类活动可能同时发挥作用。你的记录最珍贵之处，是保留了具体时间、地点与个人感受；如果未来再次经过同一片海域，不妨继续对照记录变化。";
}

function localImageAnalysis() {
  return "影像保留了当时海况、能见度与海面状态等线索。仅凭照片还不能确定现象的成因，但将画面与拍摄位置、时间、水温及天气记录结合，就能更好地区分自然波动和人类活动带来的长期压力。建议后续在相近位置持续拍摄，形成可比较的影像序列。";
}

function localCombinedAnalysis(title: string, body: string, hasImages: boolean) {
  const text = localTextAnalysis(title, body);
  if (!hasImages) return text;
  return `${text} 你上传的影像也会作为这份观察的一部分：请将画面中的可见线索与拍摄时间、位置和天气一并记录，单张照片可以提示现象，但不能单独确定成因。`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const images = formData.getAll("images").filter((item): item is File => item instanceof File);
    if (!title || !body) return NextResponse.json({ error: "故事内容不能为空" }, { status: 400 });

    const hasImages = images.length > 0;
    const system = hasImages
      ? "你是 OceanArchive 的海洋观察编辑。请只输出一条中文短评，必须同时结合水手的标题、正文和全部上传影像：先描述图片中确实可见的自然现象或人为影响，再联系文字中的现场感受，谨慎解释它与气候变化或人类活动的可能关系。不要把单次观察武断归因，不要分点，不要提及自己是模型，不要虚构地点与物种，以自然、有温度但专业克制的 140-260 字输出。"
      : "你是 OceanArchive 的海洋观察编辑。请只输出一条中文短评，结合水手的标题和正文识别可能涉及的自然现象，谨慎解释它与气候变化或人类活动的可能关系。不要把单次观察武断归因，不要分点，不要提及自己是模型，以自然、有温度但专业克制的 120-220 字输出。";

    let aiResult: string | null = null;
    try {
      if (hasImages) {
        const imageContent: Exclude<GlmMessageContent, string> = [
          { type: "text", text: `标题：${title}\n航海记录：${body}\n\n请结合正文和这些图片，生成唯一的一条综合评论。` },
        ];
        for (const file of images.slice(0, 3)) {
          const buffer = Buffer.from(await file.arrayBuffer());
          imageContent.push({ type: "image_url", image_url: { url: `data:${file.type};base64,${buffer.toString("base64")}` } });
        }
        aiResult = await callGlm(normalizeModel(process.env.GLM_VISION_MODEL, "glm-5v-turbo"), imageContent, system);
      } else {
        aiResult = await callGlm(
          normalizeModel(process.env.GLM_TEXT_MODEL, "glm-5.2"),
          `标题：${title}\n航海记录：${body}`,
          system,
        );
      }
    } catch (analysisError) {
      console.error(`[OceanArchive] GLM ${hasImages ? "vision" : "text"} analysis failed`, analysisError);
    }

    return NextResponse.json({
      aiAnalysis: aiResult ?? localCombinedAnalysis(title, body, hasImages),
      mode: aiResult ? "glm" : "local-preview",
      warnings: aiResult ? [] : [hasImages ? "图片综合分析暂时使用本地解读" : "文本分析暂时使用本地解读"],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 分析暂时不可用" },
      { status: 502 },
    );
  }
}
