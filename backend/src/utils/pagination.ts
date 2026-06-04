/**
 * 分页工具模块
 * 提供分页参数解析、Prisma skip/take 计算、游标分页等工具
 */

import { PaginationParams, PaginatedResult, SortDirection } from '../types';
import config from '../config';

/**
 * 解析并标准化分页参数
 * 将前端传入的分页参数转换为安全的、标准化的格式
 *
 * @param params 原始分页参数（可能来自查询字符串）
 * @returns 标准化的分页参数
 */
export function parsePaginationParams(params: PaginationParams = {}): {
  page: number;
  pageSize: number;
  sortBy: string | undefined;
  sortOrder: SortDirection;
  skip: number;
  take: number;
} {
  const rawPage = params.page;
  const rawPageSize = params.pageSize;

  // 解析页码（最小为 1）
  let page = 1;
  if (rawPage !== undefined) {
    const parsed = typeof rawPage === 'string' ? parseInt(rawPage, 10) : rawPage;
    if (!isNaN(parsed) && parsed > 0) {
      page = parsed;
    }
  }

  // 解析每页条数（限制最大值为配置中的 maxPageSize）
  let pageSize = config.pagination.defaultPageSize;
  if (rawPageSize !== undefined) {
    const parsed = typeof rawPageSize === 'string' ? parseInt(rawPageSize, 10) : rawPageSize;
    if (!isNaN(parsed) && parsed > 0) {
      pageSize = Math.min(parsed, config.pagination.maxPageSize);
    }
  }

  // 解析排序
  const sortBy = params.sortBy || undefined;
  const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';

  // 计算 skip 和 take
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return { page, pageSize, sortBy, sortOrder, skip, take };
}

/**
 * 构造分页查询结果
 * @param items 当前页数据列表
 * @param total 总记录数
 * @param page 当前页码
 * @param pageSize 每页条数
 * @returns 分页结果对象
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Prisma 分页查询选项
 * 用于直接传递给 Prisma findMany 和 count
 */
export interface PrismaPaginationOptions {
  skip: number;
  take: number;
  orderBy?: Record<string, SortDirection>;
}

/**
 * 构造 Prisma 分页查询选项
 * @param params 标准化分页参数
 * @param defaultSortBy 默认排序字段
 * @returns Prisma 查询选项
 */
export function buildPrismaPagination(
  params: ReturnType<typeof parsePaginationParams>,
  defaultSortBy?: string
): PrismaPaginationOptions {
  const orderBy: Record<string, SortDirection> = {};

  if (params.sortBy) {
    orderBy[params.sortBy] = params.sortOrder;
  } else if (defaultSortBy) {
    orderBy[defaultSortBy] = 'desc'; // 默认降序
  }

  return {
    skip: params.skip,
    take: params.take,
    ...(Object.keys(orderBy).length > 0 ? { orderBy } : {}),
  };
}

/**
 * 构造 Prisma 游标分页查询选项
 * 适用于大数据量的高效分页
 *
 * @param cursor 游标值（上一页最后一条记录的 ID）
 * @param pageSize 每页条数
 * @param sortOrder 排序方向
 * @returns Prisma 游标分页查询选项
 */
export function buildCursorPagination(
  cursor?: string,
  pageSize: number = config.pagination.defaultPageSize,
  sortOrder: SortDirection = 'desc'
): {
  take: number;
  skip?: number;
  cursor?: { id: string };
  orderBy: Record<string, SortDirection>;
} {
  const take = Math.min(pageSize, config.pagination.maxPageSize);

  const result: {
    take: number;
    skip?: number;
    cursor?: { id: string };
    orderBy: Record<string, SortDirection>;
  } = {
    take,
    orderBy: { createdAt: sortOrder },
  };

  if (cursor) {
    result.cursor = { id: cursor };
    result.skip = 1; // 跳过游标指向的记录本身
  }

  return result;
}

/**
 * 将排序字符串解析为 Prisma orderBy 对象
 * 支持格式: "field1:asc,field2:desc" 或 "field1"（默认 asc）
 *
 * @param sortString 排序字符串
 * @returns Prisma orderBy 对象
 */
export function parseSortString(sortString?: string): Record<string, SortDirection> | undefined {
  if (!sortString) return undefined;

  const orderBy: Record<string, SortDirection> = {};
  const parts = sortString.split(',');

  for (const part of parts) {
    const [field, direction] = part.trim().split(':');
    if (field) {
      orderBy[field] = direction === 'desc' ? 'desc' : 'asc';
    }
  }

  return Object.keys(orderBy).length > 0 ? orderBy : undefined;
}

/**
 * 分页参数默认值导出
 */
export const paginationDefaults = {
  page: 1,
  pageSize: config.pagination.defaultPageSize,
  maxPageSize: config.pagination.maxPageSize,
};
