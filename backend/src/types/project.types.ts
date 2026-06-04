import { ProjectStatus } from "@prisma/client";

// Platform type
export type Platform = "web" | "ios" | "android" | "wechat";

// ==================== 输入类型 ====================

export interface CreateProjectInput {
  name: string;
  description?: string;
  platform: Platform;
  config?: Record<string, unknown>;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  platform?: Platform;
  config?: Record<string, unknown>;
  status?: ProjectStatus;
}

// ==================== 查询类型 ====================

export interface ProjectQuery {
  status?: ProjectStatus;
  platform?: Platform;
  search?: string;
}

// ==================== 分页类型 ====================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== 状态机 ====================

export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: [ProjectStatus.CONFIGURING, ProjectStatus.ARCHIVED],
  CONFIGURING: [ProjectStatus.READY, ProjectStatus.DRAFT, ProjectStatus.ARCHIVED],
  READY: [ProjectStatus.RUNNING, ProjectStatus.CONFIGURING, ProjectStatus.ARCHIVED],
  RUNNING: [ProjectStatus.PAUSED, ProjectStatus.COMPLETED, ProjectStatus.FAILED],
  PAUSED: [ProjectStatus.RUNNING, ProjectStatus.FAILED, ProjectStatus.ARCHIVED],
  COMPLETED: [ProjectStatus.ARCHIVED],
  FAILED: [ProjectStatus.CONFIGURING, ProjectStatus.RUNNING, ProjectStatus.ARCHIVED],
  ARCHIVED: [],
};

export function isValidTransition(
  from: ProjectStatus,
  to: ProjectStatus
): boolean {
  const allowed = PROJECT_STATUS_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

// ==================== API 响应类型 ====================

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  status: ProjectStatus;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  pipeline?: { id: string; status: string; progress: number } | null;
  _count?: { artifacts: number };
}
