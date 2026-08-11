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
        signal: AbortSignal.timeout(25_000),
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const images = formData.getAll("images").filter((item): item is File => item instanceof File);
    if (!title || !body) return NextResponse.json({ error: "故事内容不能为空" }, { status: 400 });

    const hasImages = images.length > 0;
    const textSystem = "你是 OceanArchive 的海洋观察编辑。请用中文认真阅读水手的标题和正文，先准确回应文字实际表达的内容；如果正文提出无害的直接问题或测试回复请求，请先按其要求简短回应。随后再谨慎解释其中可能涉及的自然现象、气候变化或人类活动。若文字只是功能测试或没有海洋观察信息，也要如实指出，不要假装存在环境现象。不要把单次观察武断归因，不要分点，不要提及自己是模型，以自然、有温度但专业克制的 100-180 字短评输出。";
    const textPromise = callGlm(
      normalizeModel(process.env.GLM_TEXT_MODEL, "glm-5.2"),
      `标题：${title}\n航海记录：${body}`,
      textSystem,
    );

    let imagePromise: Promise<string | null> = Promise.resolve(null);
    if (hasImages) {
      const imageContent: Exclude<GlmMessageContent, string> = [
        { type: "text", text: "请只分析这些航海影像中确实可见的自然现象、人为活动或环境线索。" },
      ];
      for (const file of images.slice(0, 3)) {
        const buffer = Buffer.from(await file.arrayBuffer());
        imageContent.push({ type: "image_url", image_url: { url: `data:${file.type};base64,${buffer.toString("base64")}` } });
      }
      const imageSystem = "你是 OceanArchive 的海洋影像分析员。请用中文只描述照片中确实可见的内容，谨慎说明可能的环境意义；不要虚构地点、时间、物种或正文信息，不要分点，不要提及自己是模型，以自然、专业克制的 100-180 字短评输出。";
      imagePromise = callGlm(
        normalizeModel(process.env.GLM_VISION_MODEL, "glm-5v-turbo"),
        imageContent,
        imageSystem,
      );
    }

    const [textOutcome, imageOutcome] = await Promise.allSettled([textPromise, imagePromise]);
    const textResult = textOutcome.status === "fulfilled" ? textOutcome.value : null;
    const imageResult = imageOutcome.status === "fulfilled" ? imageOutcome.value : null;
    if (textOutcome.status === "rejected") {
      console.error("[OceanArchive] GLM text analysis failed", textOutcome.reason);
    }
    if (imageOutcome.status === "rejected") {
      console.error("[OceanArchive] GLM vision analysis failed", imageOutcome.reason);
    }

    const textAnalysis = textResult ?? localTextAnalysis(title, body);
    const imageAnalysis = hasImages ? imageResult ?? localImageAnalysis() : null;
    let combinedResult: string | null = null;
    if (imageAnalysis) {
      const combinedSystem = "你是 OceanArchive 的总编辑。请把一份文字分析和一份图片分析综合为一条中文评论。必须同时保留两份分析的核心信息，先谈正文、再联系影像；文字分析若以对用户问题或测试请求的直接回答开头，必须将它的第一句原样保留为综合评论的第一句。只能使用输入中已有的信息，不要新增地点、时间、物种或因果判断，不要分点，不要提及分析流程，以自然、专业克制的 180-300 字输出。";
      try {
        combinedResult = await callGlm(
          normalizeModel(process.env.GLM_TEXT_MODEL, "glm-5.2"),
          `标题：${title}\n\n文字分析：\n${textAnalysis}\n\n图片分析：\n${imageAnalysis}`,
          combinedSystem,
        );
      } catch (combinedError) {
        console.error("[OceanArchive] GLM combined analysis failed", combinedError);
      }
    }

    const warnings = [
      textResult ? null : "文本分析暂时使用本地解读",
      hasImages && !imageResult ? "图片分析暂时使用本地解读" : null,
      hasImages && !combinedResult ? "综合分析暂时使用分段结果" : null,
    ].filter(Boolean);

    return NextResponse.json({
      aiAnalysis: combinedResult ?? [textAnalysis, imageAnalysis].filter(Boolean).join("\n\n"),
      mode: combinedResult || textResult || imageResult ? "glm" : "local-preview",
      pipeline: hasImages ? "text-image-synthesis" : "text-only",
      warnings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI 分析暂时不可用" },
      { status: 502 },
    );
  }
}
