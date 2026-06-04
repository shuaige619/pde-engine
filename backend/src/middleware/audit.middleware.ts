/**
 * 操作审计中间件
 * 记录用户的敏感操作到审计日志，支持异步写入（文件/数据库/消息队列）
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuditAction, AuditLogEntry } from '../types';
import { generateId } from '../utils/crypto';
import logger from '../utils/logger';

// 审计日志存储接口
interface AuditLogWriter {
  write(entry: AuditLogEntry): void | Promise<void>;
}

// 内存审计日志写入器（默认，开发环境使用）
class MemoryAuditLogWriter implements AuditLogWriter {
  private logs: AuditLogEntry[] = [];
  private readonly maxLogs: number;

  constructor(maxLogs: number = 10000) {
    this.maxLogs = maxLogs;
  }

  write(entry: AuditLogEntry): void {
    this.logs.push(entry);
    // 防止内存无限增长
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

// 文件审计日志写入器
class FileAuditLogWriter implements AuditLogWriter {
  constructor(private filePath: string) {
    // 文件写入器实现——生产环境中可以扩展为写入数据库或消息队列
    void filePath;
  }

  write(entry: AuditLogEntry): void {
    // 使用主 logger 的 child 写入结构化日志
    auditLogger.info({
      auditId: entry.id,
      userId: entry.userId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      description: entry.description,
      method: entry.method,
      path: entry.path,
      ip: entry.ipAddress,
      status: entry.status,
      failureReason: entry.failureReason,
    }, `Audit: ${entry.action} ${entry.resourceType}`);
  }
}

// 全局审计 logger
const auditLogger = logger.child({ module: 'Audit' });

// 默认使用内存写入器
let auditWriter: AuditLogWriter = new MemoryAuditLogWriter();

/**
 * 配置审计日志写入器
 * @param writer 自定义的审计日志写入器
 */
export function setAuditLogWriter(writer: AuditLogWriter): void {
  auditWriter = writer;
}

/**
 * 获取当前的审计日志写入器
 */
export function getAuditLogWriter(): AuditLogWriter {
  return auditWriter;
}

/**
 * 获取内存审计日志（仅用于开发和测试）
 */
export function getMemoryAuditLogs(): AuditLogEntry[] {
  if (auditWriter instanceof MemoryAuditLogWriter) {
    return auditWriter.getLogs();
  }
  return [];
}

/**
 * 清除内存审计日志（仅用于开发和测试）
 */
export function clearMemoryAuditLogs(): void {
  if (auditWriter instanceof MemoryAuditLogWriter) {
    auditWriter.clear();
  }
}

/**
 * 操作审计中间件工厂函数
 * 为指定路由创建审计日志记录中间件
 *
 * @param action 操作类型
 * @param resourceType 资源类型
 * @param options 额外选项
 * @returns Express 中间件
 *
 * @example
 * router.post('/projects',
 *   authenticate,
 *   audit('CREATE', 'Project', { description: '创建项目' }),
 *   createProjectHandler
 * );
 */
export function audit(
  action: AuditAction,
  resourceType: string,
  options: {
    /** 操作描述 */
    description?: string;
    /** 从请求参数中提取资源 ID 的字段名 */
    resourceIdParam?: string;
    /** 是否记录请求体（默认 false，敏感信息不应记录） */
    logRequestBody?: boolean;
    /** 请求体字段脱敏列表 */
    sensitiveFields?: string[];
  } = {}
) {
  const {
    description,
    resourceIdParam,
    logRequestBody = false,
    sensitiveFields = ['password', 'token', 'secret', 'authorization'],
  } = options;

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // 记录请求开始时间
    const startTime = Date.now();

    // 保存原始的 res.end 以捕获响应完成
    const originalEnd = res.end.bind(res);
    const chunks: Buffer[] = [];

    // 重写 res.end 以捕获响应状态
    res.end = function (
      this: Response,
      chunk?: unknown,
      encoding?: BufferEncoding | (() => void),
      cb?: () => void
    ): Response {
      // 恢复原始方法
      res.end = originalEnd;

      // 确定响应状态
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 400;

      // 构建审计日志条目
      const entry = buildAuditEntry(
        req,
        action,
        resourceType,
        statusCode,
        isSuccess,
        description,
        resourceIdParam,
        logRequestBody,
        sensitiveFields
      );

      // 异步写入审计日志，不阻塞响应
      Promise.resolve()
        .then(() => auditWriter.write(entry))
        .catch((err) => {
          auditLogger.error({ err }, 'Failed to write audit log');
        });

      // 调用原始的 res.end
      if (chunk !== undefined) {
        if (typeof encoding === 'function') {
          return res.end(chunk, encoding);
        }
        return res.end(chunk, encoding, cb);
      }
      return res.end();
    } as typeof res.end;

    next();
  };
}

/**
 * 构建审计日志条目
 */
function buildAuditEntry(
  req: AuthenticatedRequest,
  action: AuditAction,
  resourceType: string,
  statusCode: number,
  isSuccess: boolean,
  description?: string,
  resourceIdParam?: string,
  logRequestBody?: boolean,
  sensitiveFields?: string[]
): AuditLogEntry {
  // 提取资源 ID
  let resourceId: string | undefined;
  if (resourceIdParam) {
    resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];
  }

  // 脱敏处理请求体
  let requestBody: Record<string, unknown> | undefined;
  if (logRequestBody && req.body && typeof req.body === 'object') {
    requestBody = sanitizeBody(req.body, sensitiveFields || []);
  }

  // 构建操作描述
  const operationDescription =
    description || `${action} ${resourceType}${resourceId ? ` (ID: ${resourceId})` : ''}`;

  return {
    id: generateId(),
    userId: req.user?.id || 'anonymous',
    userEmail: req.user?.email || 'anonymous',
    action,
    resourceType,
    resourceId,
    description: operationDescription,
    method: req.method,
    path: req.originalUrl || req.url,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    requestBody,
    status: isSuccess ? 'SUCCESS' : 'FAILURE',
    failureReason: !isSuccess ? `HTTP ${statusCode}` : undefined,
    timestamp: new Date(),
  };
}

/**
 * 脱敏请求体
 * 将敏感字段的值替换为 [REDACTED]
 */
function sanitizeBody(
  body: Record<string, unknown>,
  sensitiveFields: string[]
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(
      (field) => lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value as Record<string, unknown>, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * 获取客户端真实 IP 地址
 */
function getClientIp(req: AuthenticatedRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp;
  }
  return req.ip || 'unknown';
}

/**
 * 快捷审计中间件——创建操作
 */
export function auditCreate(
  resourceType: string,
  options?: Omit<Parameters<typeof audit>[2], 'description'>
) {
  return audit('CREATE', resourceType, { ...options, description: `创建${resourceType}` });
}

/**
 * 快捷审计中间件——读取操作
 */
export function auditRead(
  resourceType: string,
  options?: Omit<Parameters<typeof audit>[2], 'description'>
) {
  return audit('READ', resourceType, { ...options, description: `查询${resourceType}` });
}

/**
 * 快捷审计中间件——更新操作
 */
export function auditUpdate(
  resourceType: string,
  options?: Omit<Parameters<typeof audit>[2], 'description'>
) {
  return audit('UPDATE', resourceType, { ...options, description: `更新${resourceType}` });
}

/**
 * 快捷审计中间件——删除操作
 */
export function auditDelete(
  resourceType: string,
  options?: Omit<Parameters<typeof audit>[2], 'description'>
) {
  return audit('DELETE', resourceType, { ...options, description: `删除${resourceType}` });
}
