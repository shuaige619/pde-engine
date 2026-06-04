/**
 * 自定义错误类模块
 * 提供应用中所有业务错误的统一基类和常用子类
 */

/**
 * 应用业务错误基类
 * 所有自定义错误都应继承此类
 */
export class AppError extends Error {
  /** 错误代码，用于客户端识别错误类型 */
  readonly code: string;
  /** HTTP 状态码 */
  readonly statusCode: number;
  /** 详细的字段级验证错误 */
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: Record<string, string[]>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // 修复原型链（TypeScript 继承内置类需要）
    Object.setPrototypeOf(this, new.target.prototype);

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 将错误序列化为 JSON 格式
   */
  toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, string[]>;
    stack?: string;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      stack: process.env.NODE_ENV !== 'production' ? this.stack : undefined,
    };
  }
}

/**
 * 资源未找到错误
 * 当请求的资源不存在时抛出
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', identifier?: string) {
    const message = identifier
      ? `${resource} not found with identifier: ${identifier}`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

/**
 * 验证错误
 * 当请求数据校验失败时抛出
 */
export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    details?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * 未认证错误
 * 当用户未提供有效的认证凭据时抛出
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * 禁止访问错误
 * 当用户已认证但无权访问资源时抛出
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

/**
 * 冲突错误
 * 当资源已存在或发生业务冲突时抛出
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 'CONFLICT', 409);
  }
}

/**
 * 请求超时错误
 */
export class RequestTimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super(message, 'REQUEST_TIMEOUT', 408);
  }
}

/**
 * 服务不可用错误
 * 当依赖服务不可用时抛出
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 'SERVICE_UNAVAILABLE', 503);
  }
}

/**
 * 数据库错误
 * 当数据库操作失败时抛出
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 'DATABASE_ERROR', 500);
  }
}

/**
 * 外部服务错误
 * 当调用第三方服务失败时抛出
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(
      message || `External service "${service}" request failed`,
      'EXTERNAL_SERVICE_ERROR',
      502
    );
  }
}
