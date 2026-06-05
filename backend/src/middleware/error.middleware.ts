/**
 * 全局错误处理中间件
 * 捕获应用中所有未处理的错误，统一格式化响应
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, ValidationError, NotFoundError } from '../utils/errors';
import { formatZodErrors } from '../utils/validate';
import logger from '../utils/logger';

/**
 * 错误响应体结构
 */
interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    stack?: string;
  };
}

/**
 * 全局错误处理中间件（必须是 Express 错误处理的最后一个中间件）
 *
 * 处理以下类型的错误：
 * 1. 自定义 AppError 及其子类
 * 2. Prisma 数据库错误（唯一约束、外键约束、记录未找到等）
 * 3. Zod 校验错误
 * 4. 通用 JavaScript Error
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const traceId = (req as Request & { traceId?: string }).traceId || 'unknown';
  const requestInfo = {
    traceId,
    method: req.method,
    path: req.path,
    query: req.query,
    // 生产环境不记录请求体（可能包含敏感信息）
    body: process.env.NODE_ENV === 'production' ? undefined : req.body,
  };

  let statusCode = 500;
  let responseBody: ErrorResponseBody;

  // ─── 1. 处理自定义 AppError ──────────────────────────────────
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    responseBody = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
      },
    };

    // 记录日志
    if (statusCode >= 500) {
      logger.error({ ...requestInfo, err: err.toJSON() }, `AppError: ${err.message}`);
    } else {
      logger.warn({ ...requestInfo, err: { code: err.code, message: err.message, details: err.details } }, `Client error: ${err.message}`);
    }
  }
  // ─── 2. 处理 Prisma 数据库错误 ───────────────────────────────
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const { code, message, meta } = handlePrismaError(err);
    statusCode = code;
    responseBody = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message,
        ...(process.env.NODE_ENV !== 'production' && meta ? { details: meta as unknown as Record<string, string[]> } : {}),
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
      },
    };
    logger.error({ ...requestInfo, prismaCode: err.code, meta: err.meta }, `Prisma error: ${message}`);
  }
  // ─── 3. 处理 Prisma 未知错误 ─────────────────────────────────
  else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    responseBody = {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'An unexpected database error occurred',
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
      },
    };
    logger.error({ ...requestInfo, error: err.message }, 'Prisma unknown error');
  }
  // ─── 4. 处理 Prisma 连接错误 ─────────────────────────────────
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    responseBody = {
      success: false,
      error: {
        code: 'DATABASE_CONNECTION_ERROR',
        message: 'Failed to connect to the database',
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
      },
    };
    logger.error({ ...requestInfo, error: err.message }, 'Prisma initialization error');
  }
  // ─── 5. 处理 Zod 校验错误 ────────────────────────────────────
  else if (err instanceof ZodError) {
    statusCode = 400;
    const details = formatZodErrors(err);
    responseBody = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
      },
    };
    logger.warn({ ...requestInfo, validationErrors: details }, 'Validation error');
  }
  // ─── 6. 处理 SyntaxError（JSON 解析失败）────────────────────
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    responseBody = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
      },
    };
    logger.warn({ ...requestInfo, error: err.message }, 'Invalid JSON body');
  }
  // ─── 7. 处理通用错误 ─────────────────────────────────────────
  else {
    responseBody = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'An internal server error occurred'
          : err.message || 'Unknown error',
        ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
      },
    };
    logger.error({ ...requestInfo, error: err.message, stack: err.stack }, 'Unhandled error');
  }

  res.status(statusCode).json(responseBody);
}

/**
 * 处理 Prisma 已知请求错误
 * 将 Prisma 错误码转换为 HTTP 状态码和可读消息
 */
function handlePrismaError(
  err: Prisma.PrismaClientKnownRequestError
): { code: number; message: string; meta?: Record<string, unknown> } {
  switch (err.code) {
    // 唯一约束冲突
    case 'P2002': {
      const target = (err.meta?.target as string[])?.join(', ');
      return {
        code: 409,
        message: `Unique constraint violation${target ? `: ${target}` : ''}`,
        meta: { fields: target },
      };
    }
    // 外键约束冲突
    case 'P2003': {
      const field = err.meta?.field_name as string;
      return {
        code: 400,
        message: `Foreign key constraint violation${field ? `: ${field}` : ''}`,
        meta: { field },
      };
    }
    // 记录未找到
    case 'P2025': {
      const cause = err.meta?.cause as string;
      return {
        code: 404,
        message: cause || 'Record not found',
      };
    }
    // 查询超时
    case 'P2024': {
      return {
        code: 504,
        message: 'Database query timeout',
      };
    }
    // 连接池耗尽
    case 'P2026':
    case 'P2027': {
      return {
        code: 503,
        message: 'Database connection pool exhausted',
      };
    }
    // 默认处理
    default:
      return {
        code: 500,
        message: `Database error (${err.code})`,
        meta: err.meta as Record<string, unknown>,
      };
  }
}

/**
 * 处理 404 路由未找到
 * 当没有任何路由匹配请求时，返回标准的 404 响应
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

/**
 * 未处理的 Promise  rejection 处理器
 * 用于捕获异步操作中未处理的错误
 */
export function setupUnhandledRejectionHandler(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ reason }, 'Unhandled Promise Rejection');
    // 在生产环境中可以在这里添加告警通知
  });

  process.on('uncaughtException', (error: Error) => {
    logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught Exception');
    // 给日志一点时间写入，然后退出
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}
