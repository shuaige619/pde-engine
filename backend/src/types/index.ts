/**
 * 通用类型定义模块
 * 包含 API 响应类型、分页类型、认证相关类型等
 */

import { Request } from 'express';

// ─── API 响应类型 ───────────────────────────────────────────────

/**
 * API 错误详情结构
 */
export interface ApiError {
  /** 错误代码，用于客户端识别错误类型 */
  code: string;
  /** 人类可读的错误信息 */
  message: string;
  /** 详细的字段级验证错误（可选） */
  details?: Record<string, string[]>;
}

/**
 * 统一 API 响应结构
 * @template T 响应数据的类型
 */
export interface ApiResponse<T = unknown> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 提示信息 */
  message?: string;
  /** 错误信息 */
  error?: ApiError;
}

/**
 * 分页查询参数
 */
export interface PaginationParams {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页查询结果
 * @template T 列表项的类型
 */
export interface PaginatedResult<T> {
  /** 当前页数据列表 */
  items: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页条数 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

// ─── 认证相关类型 ───────────────────────────────────────────────

/**
 * 已认证用户信息
 */
export interface AuthenticatedUser {
  /** 用户 ID */
  id: string;
  /** 用户邮箱 */
  email: string;
  /** 用户角色 */
  role: string;
  /** 组织 ID（可选） */
  organizationId?: string;
}

/**
 * 扩展的 Express Request 类型，包含认证用户信息
 */
export interface AuthenticatedRequest extends Request {
  /** 已认证的用户信息 */
  user?: AuthenticatedUser;
  /** 请求追踪 ID */
  traceId?: string;
}

// ─── 审计日志类型 ───────────────────────────────────────────────

/**
 * 审计动作类型
 */
export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'EXECUTE'
  | 'OTHER';

/**
 * 审计日志条目
 */
export interface AuditLogEntry {
  /** 日志 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 用户邮箱 */
  userEmail: string;
  /** 动作类型 */
  action: AuditAction;
  /** 资源类型 */
  resourceType: string;
  /** 资源 ID */
  resourceId?: string;
  /** 操作描述 */
  description: string;
  /** 请求方法 */
  method: string;
  /** 请求路径 */
  path: string;
  /** IP 地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent?: string;
  /** 请求体（脱敏后） */
  requestBody?: Record<string, unknown>;
  /** 操作结果 */
  status: 'SUCCESS' | 'FAILURE';
  /** 失败原因 */
  failureReason?: string;
  /** 时间戳 */
  timestamp: Date;
}

// ─── 服务层类型 ───────────────────────────────────────────────

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 排序选项
 */
export interface SortOptions {
  /** 排序字段 */
  field: string;
  /** 排序方向 */
  direction: SortDirection;
}

/**
 * 查询过滤条件
 */
export interface FilterCondition {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in';
  /** 比较值 */
  value: unknown;
}

// ─── WebSocket 类型 ─────────────────────────────────────────────

/**
 * WebSocket 消息
 */
export interface WebSocketMessage<T = unknown> {
  /** 消息类型 */
  type: string;
  /** 消息数据 */
  payload: T;
  /** 时间戳 */
  timestamp: number;
}

// ─── 任务/作业类型 ──────────────────────────────────────────────

/**
 * 后台任务状态
 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * 后台任务
 */
export interface BackgroundJob<T = unknown> {
  /** 任务 ID */
  id: string;
  /** 任务类型 */
  type: string;
  /** 任务状态 */
  status: JobStatus;
  /** 任务参数 */
  payload: T;
  /** 创建时间 */
  createdAt: Date;
  /** 开始时间 */
  startedAt?: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 错误信息 */
  error?: string;
  /** 进度百分比 0-100 */
  progress?: number;
}
