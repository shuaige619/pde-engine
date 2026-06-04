/**
 * 路由注册入口模块
 * 集中注册所有 API 路由，统一前缀管理
 */

import { Router, Request, Response } from 'express';
import config from '../config';
import { sendSuccess } from '../utils/response';

/**
 * 创建并配置主路由器
 * 所有业务子路由通过此函数注册到 Express 应用
 *
 * @returns Express Router 实例
 *
 * @example
 * // 在 app.ts 中使用
 * import { createRouter } from './routes';
 * app.use(config.api.prefix, createRouter());
 */
export function createRouter(): Router {
  const router = Router();

  // ─── 健康检查端点 ────────────────────────────────────────────
  // 不经过 API 前缀，直接注册在根路径
  // 实际在 app.ts 中会单独注册此路由

  // ─── API v1 路由 ─────────────────────────────────────────────
  const v1Router = createV1Router();
  router.use(config.api.version, v1Router);

  return router;
}

/**
 * 创建健康检查路由器
 * 用于负载均衡和健康监控探针
 */
export function createHealthRouter(): Router {
  const router = Router();

  // 基础健康检查（快速响应，不检查依赖服务）
  router.get('/health', (_req: Request, res: Response) => {
    sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // 深度健康检查（检查数据库、Redis 等依赖服务）
  router.get('/health/ready', async (_req: Request, res: Response) => {
    const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};
    let allHealthy = true;

    // 数据库连接检查（通过 Prisma）
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      checks.database = { status: 'ok' };
    } catch {
      checks.database = { status: 'error', message: 'Database connection failed' };
      allHealthy = false;
    }

    // Redis 连接检查
    try {
      const redis = require('../utils/redis').default;
      if (redis && typeof redis.ping === 'function') {
        await redis.ping();
      }
      checks.redis = { status: 'ok' };
    } catch {
      checks.redis = { status: 'error', message: 'Redis connection failed' };
      allHealthy = false;
    }

    const statusCode = allHealthy ? 200 : 503;
    sendSuccess(
      res,
      {
        status: allHealthy ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        checks,
      },
      undefined,
      statusCode
    );
  });

  // 存活检查（最轻量级，用于 K8s liveness probe）
  router.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'alive' });
  });

  return router;
}

/**
 * 创建 API v1 版本路由器
 * 所有 v1 版本的子路由在此注册
 */
function createV1Router(): Router {
  const router = Router();

  // ─── 占位路由：认证相关 ──────────────────────────────────────
  // router.use('/auth', authRoutes);

  // ─── 占位路由：用户管理 ──────────────────────────────────────
  // router.use('/users', userRoutes);

  // ─── 占位路由：项目管理 ──────────────────────────────────────
  // router.use('/projects', projectRoutes);

  // ─── 占位路由：引擎管理 ──────────────────────────────────────
  // router.use('/engines', engineRoutes);

  // ─── 占位路由：执行记录 ──────────────────────────────────────
  // router.use('/executions', executionRoutes);

  // ─── 占位路由：制品管理 ──────────────────────────────────────
  // router.use('/artifacts', artifactRoutes);

  // ─── 占位路由：系统管理 ──────────────────────────────────────
  // router.use('/admin', adminRoutes);

  return router;
}

/**
 * 路由模块导出
 * 各业务模块完成实现后，在此处导入并注册
 */
// export { default as authRoutes } from './auth.routes';
// export { default as userRoutes } from './user.routes';
// export { default as projectRoutes } from './project.routes';
// export { default as engineRoutes } from './engine.routes';
// export { default as executionRoutes } from './execution.routes';
// export { default as artifactRoutes } from './artifact.routes';
// export { default as adminRoutes } from './admin.routes';
