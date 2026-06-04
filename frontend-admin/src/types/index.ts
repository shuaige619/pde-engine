export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  lastLoginAt?: string
}

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName: string
  status: 'active' | 'paused' | 'archived' | 'error'
  platform: 'android' | 'ios' | 'web' | 'cross'
  engineId?: string
  engineName?: string
  templateId?: string
  templateName?: string
  createdAt: string
  updatedAt: string
  buildCount: number
  lastBuildAt?: string
}

export interface Engine {
  id: string
  name: string
  version: string
  status: 'running' | 'stopped' | 'error' | 'maintenance'
  type: 'build' | 'deploy' | 'test' | 'scan'
  description: string
  endpoint: string
  healthCheck: boolean
  taskCount: number
  createdAt: string
  updatedAt: string
}

export interface Template {
  id: string
  name: string
  description: string
  category: string
  version: string
  latestVersion: string
  engineType: string
  status: 'published' | 'draft' | 'deprecated'
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId: string
  detail: string
  ip: string
  createdAt: string
}

export interface SystemConfig {
  key: string
  value: any
  description: string
  category: string
  updatedAt: string
}

export interface SystemStats {
  totalProjects: number
  totalUsers: number
  activeEngines: number
  totalEngines: number
  todayTasks: number
  weekGrowth: number
  platformDistribution: { name: string; value: number }[]
  weeklyTrend: { date: string; projects: number; builds: number }[]
  recentAlerts: AlertItem[]
}

export interface AlertItem {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  source: string
  createdAt: string
}

export interface PaginationParams {
  page: number
  pageSize: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface AuditLogQuery extends PaginationParams {
  startDate?: string
  endDate?: string
  userId?: string
  action?: string
}

export interface LoginForm {
  email: string
  password: string
}

export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}
