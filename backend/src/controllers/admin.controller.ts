import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import adminService from '../services/admin.service';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.middleware';
import { AuditLogQuery } from '../types/user.types';
import logger from '../utils/logger';

/**
 * Validation schemas for admin endpoints
 */
export const auditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  userId: z.string().uuid('Invalid user ID').optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateConfigSchema = z.object({
  value: z.any(),
});

export const configKeyParamSchema = z.object({
  key: z.string().min(1, 'Config key is required'),
});

/**
 * AdminController handles HTTP requests for admin operations
 * including system stats, audit logs, and system configuration
 */
class AdminController {
  /**
   * Get system statistics
   * GET /api/admin/stats
   */
  getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await adminService.getStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get audit logs with filtering and pagination
   * GET /api/admin/audit-logs
   */
  getAuditLogs = [
    validateQuery(auditLogQuerySchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const params = req.query as Record<string, unknown>;
        const query: AuditLogQuery = {
          page: Number(params.page) || 1,
          limit: Number(params.limit) || 20,
          sortBy: (params.sortBy as string) || 'createdAt',
          sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
          userId: params.userId as string | undefined,
          action: params.action as string | undefined,
          entity: params.entity as string | undefined,
          startDate: params.startDate as string | undefined,
          endDate: params.endDate as string | undefined,
        };

        const result = await adminService.getAuditLogs(query);

        res.status(200).json({
          success: true,
          data: result.data,
          pagination: result.pagination,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get all system configuration items
   * GET /api/admin/config
   */
  getSystemConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const configs = await adminService.getSystemConfig();

      res.status(200).json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific system config by key
   * GET /api/admin/config/:key
   */
  getConfigByKey = [
    validateParams(configKeyParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { key } = req.params;
        const config = await adminService.getSystemConfigByKey(key);

        if (!config) {
          res.status(404).json({
            success: false,
            error: {
              message: `Config with key '${key}' not found`,
              statusCode: 404,
            },
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: config,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update a system configuration value
   * PUT /api/admin/config/:key
   */
  updateSystemConfig = [
    validateParams(configKeyParamSchema),
    validateBody(updateConfigSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { key } = req.params;
        const { value } = req.body as { value: unknown };
        const config = await adminService.updateSystemConfig(key, value);

        logger.info(`System config updated via API: ${key}`);

        res.status(200).json({
          success: true,
          data: config,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Create a new system configuration
   * POST /api/admin/config
   */
  createSystemConfig = [
    validateBody(
      z.object({
        key: z.string().min(1, 'Config key is required'),
        value: z.any(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    ),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { key, value, description, isPublic } = req.body as {
          key: string;
          value: unknown;
          description?: string;
          isPublic?: boolean;
        };
        const config = await adminService.createSystemConfig(key, value, description, isPublic);

        logger.info(`System config created via API: ${key}`);

        res.status(201).json({
          success: true,
          data: config,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Delete a system configuration
   * DELETE /api/admin/config/:key
   */
  deleteSystemConfig = [
    validateParams(configKeyParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { key } = req.params;
        await adminService.deleteSystemConfig(key);

        logger.info(`System config deleted via API: ${key}`);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ];
}

export default new AdminController();
