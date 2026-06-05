import { CodeSource, ProjectStatus, TestMode } from "@prisma/client";

// Platform type
export type Platform = "WEB" | "APP" | "UNIAPP" | "CHROME_EXTENSION" | "BACKEND_API";

// ==================== 输入类型 ====================

export interface CreateProjectInput {
  name: string;
  description?: string;
  platform: Platform;
  codeSource?: CodeSource;
  gitUrl?: string;
  figmaUrl?: string;
  testMode?: TestMode;
  createdById: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  platform?: Platform;
  codeSource?: CodeSource;
  gitUrl?: string;
  figmaUrl?: string;
  testMode?: TestMode;
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
  DRAFT: [ProjectStatus.RUNNING, ProjectStatus.ARCHIVED],
  RUNNING: [ProjectStatus.PAUSED, ProjectStatus.COMPLETED, ProjectStatus.FAILED],
  PAUSED: [ProjectStatus.RUNNING, ProjectStatus.FAILED, ProjectStatus.ARCHIVED],
  FAILED: [ProjectStatus.RUNNING, ProjectStatus.ARCHIVED],
  COMPLETED: [ProjectStatus.PENDING_ACCEPTANCE, ProjectStatus.ARCHIVED],
  PENDING_ACCEPTANCE: [ProjectStatus.ACCEPTED, ProjectStatus.FAILED, ProjectStatus.ARCHIVED],
  ACCEPTED: [ProjectStatus.ARCHIVED],
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
  createdAt: Date;
  updatedAt: Date;
  pipeline?: { id: string; status: string; progress: number } | null;
  _count?: { artifacts: number };
}
