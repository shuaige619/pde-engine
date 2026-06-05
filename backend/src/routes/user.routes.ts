import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();

/**
 * @route   GET /api/users
 * @desc    List all users with pagination and filtering
 * @access  Admin
 */
router.get('/', authenticate, requireAdmin, ...userController.list);

/**
 * @route   GET /api/users/profile/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile/me', authenticate, userController.getMyProfile);

/**
 * @route   PUT /api/users/profile/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile/me', authenticate, ...userController.updateMyProfile);

/**
 * @route   GET /api/users/:id
 * @desc    Get a user by ID
 * @access  Admin
 */
router.get('/:id', authenticate, requireAdmin, ...userController.getById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Admin
 */
router.put('/:id', authenticate, requireAdmin, ...userController.update);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status
 * @access  Admin
 */
router.patch('/:id/status', authenticate, requireAdmin, ...userController.updateStatus);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Admin
 */
router.delete('/:id', authenticate, requireAdmin, ...userController.delete);

export default router;
