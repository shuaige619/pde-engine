import client from './client'
import type { ApiResponse, User, PaginationParams, PaginatedResult } from '@/types'

export function getUsers(params: PaginationParams): Promise<ApiResponse<PaginatedResult<User>>> {
  return client.get('/admin/users', { params })
}

export function updateUserStatus(userId: string, status: string): Promise<ApiResponse<User>> {
  return client.patch(`/admin/users/${userId}/status`, { status })
}

export function deleteUser(userId: string): Promise<ApiResponse<void>> {
  return client.delete(`/admin/users/${userId}`)
}
