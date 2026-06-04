import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import authService from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { RegisterInput, LoginInput } from '../types/auth.types';
import logger from '../utils/logger';

/**
 * Validation schemas for auth endpoints
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  token: z.string().min(1, 'Refresh token is required'),
});

/**
 * AuthController handles HTTP requests for authentication operations
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  register = [
    validateBody(registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const data: RegisterInput = req.body;
        const result = await authService.register(data);

        logger.info(`User registered via API: ${result.user.email}`);

        res.status(201).json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Login an existing user
   * POST /api/auth/login
   */
  login = [
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const data: LoginInput = req.body;
        const result = await authService.login(data);

        logger.info(`User logged in via API: ${result.user.email}`);

        res.status(200).json({
          success: true,
          data: {
            user: result.user,
            token: result.token,
            refreshToken: result.refreshToken,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refresh = [
    validateBody(refreshTokenSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { token } = req.body;
        const newToken = await authService.refreshToken(token);

        res.status(200).json({
          success: true,
          data: {
            token: newToken,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = await authService.me(authReq.user.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout current user
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      await authService.logout(authReq.user.userId);

      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
