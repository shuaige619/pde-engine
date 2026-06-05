import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

// JWT Token 载荷接口
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * 从请求头中提取 JWT Token
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * JWT 认证中间件
 * 验证请求头中的 Bearer Token
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const secret = process.env.JWT_SECRET || 'pde_jwt_secret';
    const decoded = jwt.verify(token, secret) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
}

/**
 * 可选认证中间件
 * 有 token 则解析，没有也不报错
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req);
    if (token) {
      const secret = process.env.JWT_SECRET || 'pde_jwt_secret';
      const decoded = jwt.verify(token, secret) as TokenPayload;
      req.user = decoded;
    }
    next();
  } catch {
    // 可选认证，不抛出错误
    next();
  }
}

/**
 * 管理员权限检查中间件
 * 必须在 authenticate 之后使用
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenError('Admin access required');
    }
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * 角色权限检查中间件工厂
 * 允许指定多个允许的角色
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(`Required roles: ${roles.join(', ')}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
