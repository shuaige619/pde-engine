/**
 * RBAC (Role-Based Access Control) 权限检查中间件
 * 基于用户角色进行访问控制
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/error';
import logger from '../utils/logger';

/** 预定义角色层级（数值越大权限越高） */
const ROLE_HIERARCHY: Record<string, number> = {
  guest: 0,
  user: 1,
  member: 1,
  developer: 2,
  manager: 3,
  admin: 4,
  superadmin: 5,
  system: 99,
};

/**
 * 创建角色检查中间件
 * 只允许指定角色的用户访问
 *
 * @param allowedRoles 允许访问的角色列表
 * @returns Express 中间件
 *
 * @example
 * router.get('/admin-only', requireRoles(['admin', 'superadmin']), handler);
 */
export function requireRoles(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      // 1. 检查用户是否已通过认证
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // 2. 检查用户角色是否在允许列表中
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          {
            userId: req.user.id,
            role: req.user.role,
            requiredRoles: allowedRoles,
            path: req.path,
          },
          'Role check failed'
        );
        throw new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 创建最小角色等级检查中间件
 * 允许角色层级 >= minRole 的用户访问
 *
 * @param minRole 最低要求角色
 * @returns Express 中间件
 *
 * @example
 * router.get('/dashboard', requireMinRole('manager'), handler);
 */
export function requireMinRole(minRole: string) {
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0;

  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;

      if (userLevel < minLevel) {
        logger.warn(
          {
            userId: req.user.id,
            role: req.user.role,
            roleLevel: userLevel,
            requiredRole: minRole,
            requiredLevel: minLevel,
            path: req.path,
          },
          'Role level check failed'
        );
        throw new ForbiddenError(
          `Access denied. Minimum role required: ${minRole}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 资源所有者或管理员检查中间件
 * 允许资源所有者或具有管理员角色的用户访问
 *
 * @param getResourceOwnerId 从请求参数/查询中获取资源所有者 ID 的函数
 * @returns Express 中间件
 *
 * @example
 * router.delete(
 *   '/projects/:id',
 *   requireOwnershipOrRole(
 *     (req) => req.params.id // 简化的示例，实际需要查询数据库获取所有者
 *   ),
 *   handler
 * );
 */
export function requireOwnershipOrRole(
  getResourceOwnerId: (req: AuthenticatedRequest) => string | Promise<string>,
  allowedRoles: string[] = ['admin', 'superadmin']
) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // 管理员直接放行
      if (allowedRoles.includes(req.user.role)) {
        return next();
      }

      // 获取资源所有者 ID
      const ownerId = await getResourceOwnerId(req);

      // 检查是否为所有者
      if (ownerId !== req.user.id) {
        throw new ForbiddenError('Access denied. You do not own this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 组织成员检查中间件
 * 检查用户是否属于指定的组织
 *
 * @param paramName 路由参数中组织 ID 的参数名（默认 'organizationId'）
 * @returns Express 中间件
 */
export function requireOrganizationMember(
  paramName: string = 'organizationId'
) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const orgId = req.params[paramName] || req.body[paramName];

      if (!orgId) {
        throw new ForbiddenError('Organization ID is required');
      }

      if (req.user.organizationId !== orgId) {
        throw new ForbiddenError('Access denied. You are not a member of this organization');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
