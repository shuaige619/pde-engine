import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import userService from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validate.middleware';
import { UpdateUserInput, UserStatus, UserRole } from '../types/user.types';
import logger from '../utils/logger';

/**
 * Validation schemas for user endpoints
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  email: z.string().email('Invalid email address').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(UserStatus, {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid status value',
  }),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(10).optional(),
  sortBy: z.string().default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
  search: z.string().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

/**
 * UserController handles HTTP requests for user management operations
 */
class UserController {
  /**
   * List all users with pagination and filtering
   * GET /api/users
   */
  list = [
    validateQuery(listUsersQuerySchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const params = req.query as Record<string, unknown>;
        const result = await userService.findAll({
          page: Number(params.page) || 1,
          limit: Number(params.limit) || 10,
          sortBy: (params.sortBy as string) || 'createdAt',
          sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc',
          status: params.status as UserStatus | undefined,
          role: params.role as UserRole | undefined,
          search: params.search as string | undefined,
        });

        // Sanitize response: remove passwords
        const sanitizedData = result.data.map((user) => {
          const { password: _pw, ...rest } = user as Record<string, unknown>;
          return rest;
        });

        res.status(200).json({
          success: true,
          data: sanitizedData,
          pagination: result.pagination,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getById = [
    validateParams(userIdParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const user = await userService.findByIdOrThrow(id);

        // Sanitize: remove password
        const { password: _pw, ...userWithoutPassword } = user as unknown as Record<string, unknown>;

        res.status(200).json({
          success: true,
          data: userWithoutPassword,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get current user profile
   * GET /api/users/profile/me
   */
  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await userService.findByIdOrThrow(authReq.user.userId);

      // Sanitize: remove password
      const { password: _pw, ...userWithoutPassword } = user as unknown as Record<string, unknown>;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update current user profile
   * PUT /api/users/profile/me
   */
  updateMyProfile = [
    validateBody(updateProfileSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const authReq = req as AuthenticatedRequest;
        const data = req.body as { name?: string; avatar?: string };
        const user = await userService.updateProfile(authReq.user.userId, data);

        const { password: _pw, ...userWithoutPassword } = user as unknown as Record<string, unknown>;

        res.status(200).json({
          success: true,
          data: userWithoutPassword,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update a user (admin only)
   * PUT /api/users/:id
   */
  update = [
    validateParams(userIdParamSchema),
    validateBody(updateUserSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const data: UpdateUserInput = req.body;
        const user = await userService.update(id, data);

        const { password: _pw, ...userWithoutPassword } = user as unknown as Record<string, unknown>;

        logger.info(`User updated via API: ${user.email}`, { userId: id });

        res.status(200).json({
          success: true,
          data: userWithoutPassword,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Update user status (admin only)
   * PATCH /api/users/:id/status
   */
  updateStatus = [
    validateParams(userIdParamSchema),
    validateBody(updateStatusSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        const { status } = req.body as { status: UserStatus };
        const user = await userService.updateStatus(id, status);

        const { password: _pw, ...userWithoutPassword } = user as unknown as Record<string, unknown>;

        logger.info(`User status updated via API: ${user.email} -> ${status}`, { userId: id });

        res.status(200).json({
          success: true,
          data: userWithoutPassword,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Delete a user (admin only)
   * DELETE /api/users/:id
   */
  delete = [
    validateParams(userIdParamSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { id } = req.params;
        await userService.delete(id);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ];
}

export default new UserController();
