import { User, UserRole, UserStatus } from '@prisma/client';

export { UserRole, UserStatus };
export type { User };

/**
 * User registration input
 */
export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  name?: string;
}

/**
 * User login input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Authentication response with user and token
 */
export interface AuthResponse {
  user: UserResponse;
  token: string;
  refreshToken?: string;
}

/**
 * Safe user response (without password)
 */
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token payload for JWT
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Refresh token request body
 */
export interface RefreshTokenInput {
  token: string;
}

/**
 * Authenticated request with user property
 */
export interface AuthenticatedRequest {
  user: UserResponse;
}

/**
 * Password change input
 */
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
