import { AuditLog, SystemConfig, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';
import {
  SystemStats,
  AuditLogQuery,
  AuditLogResponse,
  PaginatedResult,
} from '../types/user.types';

/**
 * AdminService handles admin-related business logic
 * including system stats, audit logs, and system configuration
 */
class AdminService {
  /**
   * Get system-wide statistics
   * @returns System statistics object
   */
  async getStats(): Promise<SystemStats> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    // Get user counts by status
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      pendingUsers,
      totalAuditLogs,
      todayAuditLogs,
      thisWeekAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'INACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: startOfWeek } } }),
    ]);

    logger.debug('System stats retrieved');

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        pending: pendingUsers,
      },
      auditLogs: {
        total: totalAuditLogs,
        today: todayAuditLogs,
        thisWeek: thisWeekAuditLogs,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
      },
    };
  }

  /**
   * Get audit logs with filtering and pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated list of audit logs
   */
  async getAuditLogs(params: AuditLogQuery = {}): Promise<PaginatedResult<AuditLogResponse>> {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      entity,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action as Prisma.EnumAuditActionFilter;
    }

    if (entity) {
      where.entity = entity;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Build order by
    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
    if (sortBy === 'entity') {
      orderBy.entity = sortOrder;
    } else if (sortBy === 'action') {
      orderBy.action = sortOrder;
    } else if (sortBy === 'userId') {
      orderBy.userId = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute count and find in parallel
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Map to response format
    const mappedLogs: AuditLogResponse[] = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name ?? null,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    logger.debug(`Retrieved ${logs.length} audit logs (total: ${total})`);

    return {
      data: mappedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get all system configuration items
   * @returns Array of system config items
   */
  async getSystemConfig(): Promise<SystemConfig[]> {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    });

    logger.debug(`Retrieved ${configs.length} system config items`);

    return configs;
  }

  /**
   * Get a specific system configuration by key
   * @param key - Config key
   * @returns System config or null
   */
  async getSystemConfigByKey(key: string): Promise<SystemConfig | null> {
    const config = await prisma.systemConfig.findUnique({
      where: { key },
    });

    return config;
  }

  /**
   * Update a system configuration value
   * @param key - Config key
   * @param value - New value
   * @returns Updated system config
   */
  async updateSystemConfig(key: string, value: unknown): Promise<SystemConfig> {
    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundError(`System config with key '${key}' not found`);
    }

    const updated = await prisma.systemConfig.update({
      where: { key },
      data: {
        value: value as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CONFIG_UPDATE',
        entity: 'SystemConfig',
        entityId: updated.id,
        details: { key, oldValue: existing.value, newValue: value },
      },
    });

    logger.info(`System config updated: ${key}`, { oldValue: existing.value, newValue: value });

    return updated;
  }

  /**
   * Create a new system configuration
   * @param key - Config key
   * @param value - Config value
   * @param description - Optional description
   * @param isPublic - Whether the config is publicly visible
   * @returns Created system config
   */
  async createSystemConfig(
    key: string,
    value: unknown,
    description?: string,
    isPublic: boolean = false
  ): Promise<SystemConfig> {
    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (existing) {
      throw new Error(`System config with key '${key}' already exists`);
    }

    const config = await prisma.systemConfig.create({
      data: {
        key,
        value: value as Prisma.InputJsonValue,
        description,
        isPublic,
      },
    });

    logger.info(`System config created: ${key}`);

    return config;
  }

  /**
   * Delete a system configuration
   * @param key - Config key to delete
   */
  async deleteSystemConfig(key: string): Promise<void> {
    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!existing) {
      throw new NotFoundError(`System config with key '${key}' not found`);
    }

    await prisma.systemConfig.delete({
      where: { key },
    });

    logger.info(`System config deleted: ${key}`);
  }
}

export default new AdminService();
