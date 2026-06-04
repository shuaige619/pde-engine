import client from './client'
import type {
  ApiResponse,
  SystemStats,
  User,
  Project,
  AuditLog,
  SystemConfig,
  PaginationParams,
  PaginatedResult,
  AuditLogQuery,
  Engine,
  Template,
} from '@/types'

export function getStats(): Promise<ApiResponse<SystemStats>> {
  return client.get('/admin/stats')
}

export function getUsers(params: PaginationParams): Promise<ApiResponse<PaginatedResult<User>>> {
  return client.get('/admin/users', { params })
}

export function getProjects(params: PaginationParams): Promise<ApiResponse<PaginatedResult<Project>>> {
  return client.get('/admin/projects', { params })
}

export function updateProjectStatus(projectId: string, status: string): Promise<ApiResponse<Project>> {
  return client.patch(`/admin/projects/${projectId}/status`, { status })
}

export function getEngines(): Promise<ApiResponse<Engine[]>> {
  return client.get('/admin/engines')
}

export function updateEngineStatus(engineId: string, status: string): Promise<ApiResponse<Engine>> {
  return client.patch(`/admin/engines/${engineId}/status`, { status })
}

export function getTemplates(params: PaginationParams): Promise<ApiResponse<PaginatedResult<Template>>> {
  return client.get('/admin/templates', { params })
}

export function deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
  return client.delete(`/admin/templates/${templateId}`)
}

export function updateTemplateStatus(templateId: string, status: string): Promise<ApiResponse<Template>> {
  return client.patch(`/admin/templates/${templateId}/status`, { status })
}

export function getAuditLogs(params: AuditLogQuery): Promise<ApiResponse<PaginatedResult<AuditLog>>> {
  return client.get('/admin/audit-logs', { params })
}

export function getSystemConfig(): Promise<ApiResponse<SystemConfig[]>> {
  return client.get('/admin/config')
}

export function updateSystemConfig(key: string, value: any): Promise<ApiResponse<SystemConfig>> {
  return client.patch(`/admin/config/${key}`, { value })
}
