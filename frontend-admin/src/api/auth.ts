import client from './client'
import type { ApiResponse, LoginForm } from '@/types'

export interface LoginResult {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export function login(data: LoginForm): Promise<ApiResponse<LoginResult>> {
  return client.post('/auth/login', data)
}

export function logout(): Promise<ApiResponse<void>> {
  return client.post('/auth/logout')
}

export function getCurrentUser(): Promise<ApiResponse<{
  id: string
  email: string
  name: string
  role: string
}>> {
  return client.get('/auth/me')
}
