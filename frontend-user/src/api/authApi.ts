import client from './client';
import type { User } from '@/types';
interface AuthResponse { user: User; token: string; }
export const authApi = {
  login: (d: { email: string; password: string }): Promise<AuthResponse> => client.post('/auth/login', d),
  getMe: (): Promise<User> => client.get('/auth/me'),
};
