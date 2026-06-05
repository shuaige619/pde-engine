import { Router } from "express";
import { CreationStatus, CreationType } from "@prisma/client";
import crypto from "crypto";
import { prisma } from "../utils/prisma";

const router = Router();

function toApiCreation<T extends { type: CreationType; status: CreationStatus }>(creation: T) {
  return {
    ...creation,
    type: creation.type.toLowerCase(),
    status: creation.status.toLowerCase(),
  };
}

function normalizeCreationType(type: unknown): CreationType {
  const value = String(type || "website").toUpperCase();
  if (value === "MINIAPP" || value === "APP" || value === "WEBSITE" || value === "EXTENSION" || value === "LANDING") {
    return value as CreationType;
  }
  return CreationType.WEBSITE;
}

function makeInitialCode(name: string, prompt: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<style>
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f6f8fb;color:#1f2937}
.hero{padding:64px 24px;text-align:center;background:linear-gradient(135deg,#1677ff,#36cfc9);color:#fff}
.hero h1{font-size:40px;margin:0 0 12px}
.hero p{font-size:18px;margin:0 auto;max-width:680px;opacity:.92}
.content{max-width:960px;margin:32px auto;padding:0 24px;display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.card{background:#fff;border-radius:16px;padding:24px;box-shadow:0 8px 24px rgba(16,24,40,.08)}
.card h3{margin:0 0 8px}
.card p{color:#667085;line-height:1.6;margin:0}
.cta{display:flex;justify-content:center;margin:40px 0 64px}
.cta button{border:0;border-radius:999px;background:#1677ff;color:#fff;font-size:16px;padding:14px 28px}
</style>
</head>
<body>
<section class="hero">
  <h1>${name}</h1>
  <p>${prompt}</p>
</section>
<section class="content">
  <div class="card"><h3>核心体验</h3><p>围绕用户的一句话创意，快速生成可预览产品骨架。</p></div>
  <div class="card"><h3>设计方向</h3><p>清晰的信息结构、现代视觉层次，以及可继续迭代的页面模块。</p></div>
  <div class="card"><h3>下一步</h3><p>在右侧 AI 面板继续描述修改需求，即可模拟实时调整。</p></div>
</section>
<div class="cta"><button>开始体验</button></div>
</body>
</html>`;
}

router.get("/", async (req, res, next) => {
  try {
    const where: { type?: CreationType; status?: CreationStatus } = {};
    if (req.query.type) where.type = normalizeCreationType(req.query.type);
    if (req.query.status) {
      const value = String(req.query.status).toUpperCase();
      if (Object.values(CreationStatus).includes(value as CreationStatus)) where.status = value as CreationStatus;
    }

    const creations = await prisma.creation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    res.json({ success: true, data: creations.map(toApiCreation) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const creation = await prisma.creation.findUnique({
      where: { id: req.params.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!creation) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Creation not found" } });
      return;
    }

    res.json({ success: true, data: toApiCreation(creation) });
  } catch (error) {
    next(error);
  }
});

router.post("/from-prompt", async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || "").trim();
    if (!prompt) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "prompt is required" } });
      return;
    }

    const name = prompt.length > 18 ? `${prompt.slice(0, 18)}...` : prompt;
    const type = normalizeCreationType(req.body.type);

    const creation = await prisma.creation.create({
      data: {
        name,
        description: prompt,
        type,
        status: CreationStatus.DEVELOPING,
        code: makeInitialCode(name, prompt),
        messages: {
          create: {
            role: "assistant",
            content: "我已经根据你的描述生成了初始版本。你可以继续告诉我想怎么改。",
          },
        },
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    res.status(201).json({ success: true, data: toApiCreation(creation) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/figma", async (req, res, next) => {
  try {
    const figmaUrl = String(req.body.figmaUrl || "").trim();
    const fileKey = figmaUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)?.[1] || null;

    const creation = await prisma.creation.update({
      where: { id: req.params.id },
      data: { figmaUrl, figmaFileKey: fileKey },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    res.json({ success: true, data: toApiCreation(creation) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/chat", async (req, res, next) => {
  try {
    const content = String(req.body.content || "").trim();
    if (!content) {
      res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "content is required" } });
      return;
    }

    await prisma.chatMessage.create({
      data: { creationId: req.params.id, role: "user", content },
    });

    const assistantContent = `已收到你的需求：“${content}”。我会按这个方向继续优化页面。`;
    const assistantMessage = await prisma.chatMessage.create({
      data: { creationId: req.params.id, role: "assistant", content: assistantContent },
    });

    res.json({ success: true, data: { message: assistantMessage } });
  } catch (error) {
    next(error);
  }
});

router.put("/:id/code", async (req, res, next) => {
  try {
    await prisma.creation.update({
      where: { id: req.params.id },
      data: { code: String(req.body.code || "") },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/preview-url", (req, res) => {
  res.json({ success: true, data: { url: `/studio/${req.params.id}` } });
});

router.post("/:id/publish", async (req, res, next) => {
  try {
    const token = crypto.randomBytes(4).toString("hex");
    const url = `/preview/${req.params.id}-${token}`;
    await prisma.creation.update({
      where: { id: req.params.id },
      data: { status: CreationStatus.PUBLISHED, previewUrl: url },
    });
    res.json({ success: true, data: { url } });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.creation.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
