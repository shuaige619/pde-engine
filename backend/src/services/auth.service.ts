import bcrypt from 'bcryptjs';
import { User, UserStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import logger from '../utils/logger';
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors';
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  UserResponse,
  TokenPayload,
} from '../types/auth.types';

/**
 * Strip password from user object for safe response
 */
function sanitizeUser(user: User): UserResponse {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

/**
 * AuthService handles authentication-related business logic
 * including registration, login, token refresh, and user retrieval
 */
class AuthService {
  /**
   * Register a new user
   * @param data - Registration input with email, username, password
   * @returns Object containing user data and JWT token
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const { email, username, password, name } = data;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name: name || username,
        status: UserStatus.ACTIVE,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        entity: 'User',
        entityId: user.id,
        details: { email: user.email, username: user.username },
      },
    });

    logger.info(`User registered: ${user.email}`, { userId: user.id });

    // Generate token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const safeUser = sanitizeUser(user);
    return { user: safeUser, token, refreshToken };
  }

  /**
   * Login an existing user
   * @param data - Login input with email and password
   * @returns Object containing user data and JWT token
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedError('Account has been suspended');
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedError('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        details: { email: user.email },
      },
    });

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    };
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const safeUser = sanitizeUser(updatedUser);
    return { user: safeUser, token, refreshToken };
  }

  /**
   * Refresh an access token using a refresh token
   * @param token - The refresh token
   * @returns New access token
   */
  async refreshToken(token: string): Promise<string> {
    try {
      const payload = verifyToken(token);

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) {
        throw new UnauthorizedError('User not found');
      }
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedError('Account is not active');
      }

      // Generate new access token
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      logger.info(`Token refreshed for user: ${user.email}`, { userId: user.id });

      return generateToken(tokenPayload);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Get current user by ID
   * @param userId - The user ID
   * @returns User data or null if not found
   */
  async getCurrentUser(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    return sanitizeUser(user);
  }

  /**
   * Get current user by ID (throws NotFoundError if not found)
   * @param userId - The user ID
   * @returns User data
   */
  async me(userId: string): Promise<UserResponse> {
    const user = await this.getCurrentUser(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Logout a user (creates audit log)
   * @param userId - The user ID
   */
  async logout(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGOUT',
          entity: 'User',
          entityId: user.id,
          details: { email: user.email },
        },
      });

      logger.info(`User logged out: ${user.email}`, { userId: user.id });
    }
  }
}

export default new AuthService();
