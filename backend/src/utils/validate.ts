/**
 * Zod 校验工具模块
 * 提供基于 Zod Schema 的请求数据校验、错误格式化等功能
 */

import { ZodSchema, ZodError, ZodRawShape, z } from 'zod';
import { ValidationError } from './errors';

/**
 * 将 ZodError 格式化为字段级错误详情
 * @param error ZodError 实例
 * @returns 字段名到错误消息数组的映射
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    const key = path || 'general';

    if (!formatted[key]) {
      formatted[key] = [];
    }
    formatted[key].push(issue.message);
  }

  return formatted;
}

/**
 * 使用 Zod Schema 校验数据
 * @param schema Zod Schema
 * @param data 待校验的数据
 * @returns 校验通过后的类型安全数据
 * @throws ValidationError 校验失败时
 */
export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrors(error);
      throw new ValidationError('Request validation failed', details);
    }
    throw new ValidationError('Validation failed');
  }
}

/**
 * 安全地校验数据（不抛出异常）
 * @param schema Zod Schema
 * @param data 待校验的数据
 * @returns 包含成功/失败标志和结果的对象
 */
export function safeValidate<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: formatZodErrors(result.error),
  };
}

/**
 * 异步校验数据
 * @param schema 支持异步校验的 Zod Schema
 * @param data 待校验的数据
 * @returns 校验通过后的类型安全数据
 * @throws ValidationError 校验失败时
 */
export async function validateSchemaAsync<T>(
  schema: ZodSchema<T>,
  data: unknown
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = formatZodErrors(error);
      throw new ValidationError('Request validation failed', details);
    }
    throw new ValidationError('Validation failed');
  }
}

// ─── 常用 Zod Schema 片段 ──────────────────────────────────────

/** UUID 字符串 Schema */
export const uuidSchema = z.string().uuid('Must be a valid UUID');

/** 邮箱 Schema */
export const emailSchema = z.string().email('Must be a valid email address');

/** 密码 Schema（至少 8 位，包含大小写和数字） */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/** 分页参数 Schema */
export const paginationParamsSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
    .pipe(z.number().int().positive().optional()),
  pageSize: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (typeof v === 'string' ? parseInt(v, 10) : v))
    .pipe(z.number().int().positive().max(100).optional()),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/** 对象 ID 参数 Schema */
export const idParamSchema = z.object({
  id: uuidSchema,
});

// ─── 辅助类型 ──────────────────────────────────────────────────

/**
 * 从 Zod Schema 推断 TypeScript 类型
 */
export type InferSchema<T extends ZodSchema> = z.infer<T>;

/**
 * 从 Zod RawShape 创建部分 Schema（所有字段可选）
 * @param shape ZodRawShape
 * @returns 所有字段均为可选的 Zod 对象 Schema
 */
export function createPartialSchema<T extends ZodRawShape>(shape: T) {
  const partialShape: Record<string, z.ZodOptional<z.ZodTypeAny>> = {};
  for (const [key, value] of Object.entries(shape)) {
    partialShape[key] = value.optional();
  }
  return z.object(partialShape as T);
}
