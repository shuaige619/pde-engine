/**
 * JWT 认证中间件
 * 从请求头中提取并验证 JWT Token，将用户信息附加到请求对象
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuthenticatedUser } from '../types';
import { verifyToken } from '../utils/crypto';
import { UnauthorizedError } from '../utils/error';
import logger from '../utils/logger';

/**
 * 从请求头中提取 Bearer Token
 * @param authHeader Authorization 请求头值
 * @returns JWT Token 字符串，格式无效时返回 null
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 从 Cookie 中提取 Token
 * @param cookies Express 请求中的 cookies 对象
 * @returns JWT Token 字符串，不存在时返回 null
 */
function extractCookieToken(cookies: Record<string, string> | undefined): string | null {
  if (!cookies) return null;
  return cookies.accessToken || cookies.token || null;
}

/**
 * JWT 认证中间件
 * 验证请求的 JWT Token，将解码后的用户信息附加到 req.user
 *
 * Token 提取优先级：
 * 1. Authorization: Bearer <token> 请求头
 * 2. accessToken / token Cookie
 *
 * 验证失败时抛出 UnauthorizedError
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // 1. 尝试从多个来源提取 Token
    const token =
      extractBearerToken(req.headers.authorization) ||
      extractCookieToken(req.cookies);

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    // 2. 验证 Token
    const decoded = verifyToken(token, { type: 'access' });

    // 3. 构建认证用户信息
    const user: AuthenticatedUser = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: (decoded as Record<string, unknown>).organizationId as string | undefined,
    };

    // 4. 附加到请求对象
    req.user = user;

    // 5. 在响应头中附加用户信息（便于下游微服务使用）
    res.setHeader('X-User-Id', user.id);
    res.setHeader('X-User-Role', user.role);

    logger.debug(
      { userId: user.id, role: user.role, path: req.path, method: req.method },
      'User authenticated'
    );

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 可选认证中间件
 * 尝试验证 Token，但不强制要求。如果验证失败，继续执行而不设置 req.user
 * 适用于部分公开、部分需要认证的端点
 */
export function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const token =
      extractBearerToken(req.headers.authorization) ||
      extractCookieToken(req.cookies);

    if (!token) {
      // 没有 Token，继续执行但不设置用户
      return next();
    }

    const decoded = verifyToken(token, { type: 'access' });

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      organizationId: (decoded as Record<string, unknown>).organizationId as string | undefined,
    };

    next();
  } catch {
    // 验证失败，继续执行但不设置用户
    next();
  }
}

/**
 * 刷新 Token 中间件
 * 使用 refresh token 生成新的 access token
 */
export function refreshAccessToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const refreshToken =
      req.body.refreshToken ||
      req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError('No refresh token provided');
    }

    const decoded = verifyToken(refreshToken as string, { type: 'refresh' });

    // 将用户信息附加到请求，供后续使用
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}
