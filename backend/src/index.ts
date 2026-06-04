import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import projectRoutes from "./routes/project.routes";
import pipelineRoutes from "./routes/pipeline.routes";
import artifactRoutes from "./routes/artifact.routes";
import { createLogger } from "./utils/logger";

dotenv.config();

const logger = createLogger("App");
const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件 ====================

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    skip: () => process.env.NODE_ENV === "test",
  })
);

// ==================== 健康检查 ====================

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
    },
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "PDE Engine API",
    version: "1.0.0",
    docs: "/api/v1",
  });
});

// ==================== API 路由 ====================

const API_PREFIX = "/api/v1";

// 项目路由
app.use(`${API_PREFIX}/projects`, projectRoutes);

// 流程路由
app.use(`${API_PREFIX}/pipelines`, pipelineRoutes);

// 产物路由（同时挂载在项目路径下和独立路径下）
app.use(`${API_PREFIX}`, artifactRoutes); // /projects/:projectId/artifacts
app.use(`${API_PREFIX}/artifacts`, artifactRoutes); // /artifacts/:id

// ==================== 错误处理 ====================

// 404
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// ==================== 启动 ====================

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    logger.info(`PDE Engine server running on port ${PORT}`, {
      env: process.env.NODE_ENV || "development",
      apiPrefix: API_PREFIX,
    });
    console.log(`\n🚀 Server ready at http://localhost:${PORT}${API_PREFIX}`);
    console.log(`📋 API Routes:`);
    console.log(`   GET    ${API_PREFIX}/projects          - List all projects`);
    console.log(`   POST   ${API_PREFIX}/projects          - Create project`);
    console.log(`   GET    ${API_PREFIX}/projects/:id      - Get project`);
    console.log(`   PUT    ${API_PREFIX}/projects/:id      - Update project`);
    console.log(`   DELETE ${API_PREFIX}/projects/:id      - Delete project`);
    console.log(`   POST   ${API_PREFIX}/projects/:id/pipeline/start  - Start pipeline`);
    console.log(`   POST   ${API_PREFIX}/projects/:id/pipeline/pause  - Pause pipeline`);
    console.log(`   POST   ${API_PREFIX}/projects/:id/pipeline/resume - Resume pipeline`);
    console.log(`   POST   ${API_PREFIX}/projects/:id/transition      - Status transition`);
    console.log(`   GET    ${API_PREFIX}/pipelines/project/:projectId - Get pipeline`);
    console.log(`   POST   ${API_PREFIX}/pipelines       - Create pipeline instance`);
    console.log(`   PATCH  ${API_PREFIX}/pipelines/nodes/:nodeId/status - Update node status`);
    console.log(`   POST   ${API_PREFIX}/pipelines/nodes/:nodeId/retry  - Retry node`);
    console.log(`   POST   ${API_PREFIX}/pipelines/nodes/:nodeId/skip   - Skip node`);
    console.log(`   GET    ${API_PREFIX}/pipelines/:id/progress         - Get progress`);
    console.log(`   GET    ${API_PREFIX}/projects/:projectId/artifacts  - List artifacts`);
    console.log(`   POST   ${API_PREFIX}/artifacts       - Create artifact`);
    console.log(`   GET    ${API_PREFIX}/artifacts/:id   - Get artifact`);
    console.log(`   POST   ${API_PREFIX}/artifacts/:id/version          - Mark version`);
    console.log(`   GET    ${API_PREFIX}/artifacts/:id/versions         - Version history`);
    console.log(`   GET    ${API_PREFIX}/artifacts/:id/download         - Download URL`);
  });
}

export default app;
