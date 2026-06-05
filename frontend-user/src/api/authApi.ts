import client from './client';
import type { User } from '@/types';
interface AuthResponse { user: User; token: string; }
interface ApiResponse<T> { success: boolean; data: T; }
export const authApi = {
  login: async (d: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await client.post<unknown, ApiResponse<AuthResponse>>('/auth/login', d);
    return response.data;
  },
  getMe: async (): Promise<User> => {
    const response = await client.get<unknown, ApiResponse<{ user: User }>>('/auth/me');
    return response.data.user;
  },
};
