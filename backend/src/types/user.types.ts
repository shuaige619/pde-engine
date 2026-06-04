import { User, UserRole, UserStatus } from '@prisma/client';

export { UserRole, UserStatus };
export type { User };

/**
 * Update user input (admin can update all fields)
 */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
}

/**
 * Update profile input (self-service)
 */
export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}

/**
 * User filter parameters for listing
 */
export interface UserFilterParams {
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Audit log query parameters
 */
export interface AuditLogQuery extends PaginationParams {
  userId?: string;
  action?: string;
  entity?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Audit log response
 */
export interface AuditLogResponse {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * System statistics
 */
export interface SystemStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
  };
  auditLogs: {
    total: number;
    today: number;
    thisWeek: number;
  };
  system: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    version: string;
  };
}

/**
 * System config item
 */
export interface SystemConfigItem {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update system config input
 */
export interface UpdateSystemConfigInput {
  key: string;
  value: unknown;
  description?: string;
  isPublic?: boolean;
}
