import { User, UserStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import logger from '../utils/logger';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import {
  UpdateUserInput,
  PaginationParams,
  PaginatedResult,
  UserFilterParams,
} from '../types/user.types';

/**
 * UserService handles user-related business logic
 * including listing, filtering, updating users
 */
class UserService {
  /**
   * Find all users with pagination, filtering and search
   * @param params - Pagination, filter and search parameters
   * @returns Paginated list of users
   */
  async findAll(
    params: PaginationParams & UserFilterParams = {}
  ): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      role,
      search,
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build order by
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'role') {
      orderBy.role = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute count and find in parallel
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.debug(`Found ${users.length} users (total: ${total})`, { page, limit, status, role });

    return {
      data: users,
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
   * Find a user by ID
   * @param id - User ID
   * @returns User object or null
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user;
  }

  /**
   * Find a user by ID (throws if not found)
   * @param id - User ID
   * @returns User object
   */
  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Find a user by email
   * @param email - User email
   * @returns User object or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  /**
   * Update user data
   * @param id - User ID
   * @param data - Update data
   * @returns Updated user
   */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictError('Email already in use');
      }
    }

    // Build update data
    const updateData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: id,
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        details: { updatedFields: Object.keys(data) },
      },
    });

    logger.info(`User updated: ${updatedUser.email}`, { userId: id, updatedFields: Object.keys(data) });

    return updatedUser;
  }

  /**
   * Update user profile (self-service)
   * @param id - User ID
   * @param data - Profile update data
   * @returns Updated user
   */
  async updateProfile(id: string, data: { name?: string; avatar?: string }): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    });

    logger.info(`User profile updated: ${updatedUser.email}`, { userId: id });

    return updatedUser;
  }

  /**
   * Update user status
   * @param id - User ID
   * @param status - New status
   * @returns Updated user
   */
  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    if (!Object.values(UserStatus).includes(status)) {
      throw new BadRequestError(`Invalid status value: ${status}`);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: id,
        action: 'STATUS_CHANGE',
        entity: 'User',
        entityId: id,
        details: { oldStatus: user.status, newStatus: status },
      },
    });

    logger.info(`User status changed: ${updatedUser.email} -> ${status}`, { userId: id });

    return updatedUser;
  }

  /**
   * Delete a user (soft delete pattern could be added here)
   * @param id - User ID
   */
  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`);
    }

    await prisma.user.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: id,
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        details: { email: user.email, username: user.username },
      },
    });

    logger.info(`User deleted: ${user.email}`, { userId: id });
  }
}

export default new UserService();
