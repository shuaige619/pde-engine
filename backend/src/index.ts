import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// Import routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import projectRoutes from "./routes/project.routes";
import pipelineRoutes from "./routes/pipeline.routes";
import artifactRoutes from "./routes/artifact.routes";

import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

// ==================== 初始化 ====================

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const API_PREFIX = "/api";

// Prisma client
export const prisma = new PrismaClient();

// ==================== 中间件 ====================

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==================== 健康检查 ====================

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime() },
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "PDE Engine API",
    version: "1.0.0",
  });
});

// ==================== API 路由 ====================

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/pipelines`, pipelineRoutes);
app.use(`${API_PREFIX}/artifacts`, artifactRoutes);

// ==================== 错误处理 ====================

app.use(notFoundHandler);
app.use(errorHandler);

// ==================== 启动 ====================

async function startServer() {
  try {
    // 连接数据库
    await prisma.$connect();
    console.log("✅ Database connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`
╔══════════════════════════════════════════════════════╗
║           PDE Engine Backend Ready                   ║
╠══════════════════════════════════════════════════════╣
║  API:    http://localhost:${PORT}${API_PREFIX}                    ║
║  Health: http://localhost:${PORT}/health                        ║
╚══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 优雅关闭
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
