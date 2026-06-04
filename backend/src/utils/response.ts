/**
 * 统一响应工具模块
 * 提供标准化的 API 响应构造函数
 */

import { Response } from 'express';
import { ApiResponse, PaginatedResult, PaginationParams } from '../types';

/**
 * 发送成功响应
 * @param res Express Response 对象
 * @param data 响应数据
 * @param message 成功提示信息（可选）
 * @param statusCode HTTP 状态码（默认 200）
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  res.status(statusCode).json(response);
}

/**
 * 发送创建成功响应（201）
 * @param res Express Response 对象
 * @param data 创建的资源数据
 * @param message 成功提示信息（可选）
 */
export function sendCreated<T>(
  res: Response,
  data: T,
  message?: string
): void {
  sendSuccess(res, data, message || 'Resource created successfully', 201);
}

/**
 * 发送无内容响应（204）
 * @param res Express Response 对象
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * 发送错误响应
 * @param res Express Response 对象
 * @param code 错误代码
 * @param message 错误信息
 * @param statusCode HTTP 状态码（默认 500）
 * @param details 详细的字段级错误信息（可选）
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: Record<string, string[]>
): void {
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  res.status(statusCode).json(response);
}

/**
 * 发送分页响应
 * @param res Express Response 对象
 * @param paginatedResult 分页查询结果
 * @param message 提示信息（可选）
 */
export function sendPaginated<T>(
  res: Response,
  paginatedResult: PaginatedResult<T>,
  message?: string
): void {
  const response: ApiResponse<PaginatedResult<T>> = {
    success: true,
    data: paginatedResult,
    ...(message ? { message } : {}),
  };
  res.status(200).json(response);
}

/**
 * 构造分页响应数据
 * @param items 当前页数据列表
 * @param total 总记录数
 * @param pagination 分页参数
 * @returns 分页结果对象
 */
export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: Required<PaginationParams>
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pagination.pageSize);

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
  };
}

/**
 * 发送文件下载响应
 * @param res Express Response 对象
 * @param buffer 文件 Buffer
 * @param filename 下载文件名
 * @param contentType MIME 类型
 */
export function sendFileDownload(
  res: Response,
  buffer: Buffer,
  filename: string,
  contentType: string = 'application/octet-stream'
): void {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}
