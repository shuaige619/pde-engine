import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Admin
 */
router.get('/stats', adminController.getStats);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Admin
 */
router.get('/audit-logs', ...adminController.getAuditLogs);

/**
 * @route   GET /api/admin/config
 * @desc    Get all system configuration items
 * @access  Admin
 */
router.get('/config', adminController.getSystemConfig);

/**
 * @route   POST /api/admin/config
 * @desc    Create a new system configuration
 * @access  Admin
 */
router.post('/config', ...adminController.createSystemConfig);

/**
 * @route   GET /api/admin/config/:key
 * @desc    Get a specific config by key
 * @access  Admin
 */
router.get('/config/:key', ...adminController.getConfigByKey);

/**
 * @route   PUT /api/admin/config/:key
 * @desc    Update a system configuration
 * @access  Admin
 */
router.put('/config/:key', ...adminController.updateSystemConfig);

/**
 * @route   DELETE /api/admin/config/:key
 * @desc    Delete a system configuration
 * @access  Admin
 */
router.delete('/config/:key', ...adminController.deleteSystemConfig);

export default router;
