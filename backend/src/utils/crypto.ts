/**
 * 加密工具模块
 * 提供 JWT 签名/验证、密码哈希/比较、ID 生成等功能
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import config from '../config';
import { UnauthorizedError } from './error';

// ─── 密码哈希 ──────────────────────────────────────────────────

/**
 * 对明文密码进行 bcrypt 哈希
 * @param password 明文密码
 * @returns 哈希后的密码字符串
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
  return bcrypt.hash(password, salt);
}

/**
 * 比较明文密码与哈希值
 * @param password 明文密码
 * @param hash 存储的哈希值
 * @returns 是否匹配
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token ─────────────────────────────────────────────────

/**
 * JWT 载荷接口
 */
export interface TokenPayload {
  /** 用户 ID */
  userId: string;
  /** 用户邮箱 */
  email: string;
  /** 用户角色 */
  role: string;
  /** Token 类型 */
  type?: 'access' | 'refresh';
  /** 签发时间 */
  iat?: number;
  /** 过期时间 */
  exp?: number;
}

/**
 * 使用 JWT 签名 Token
 * @param payload Token 载荷
 * @param options 额外选项（是否生成 refresh token）
 * @returns 签名的 JWT 字符串
 */
export function signToken(
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  options: { type?: 'access' | 'refresh' } = {}
): string {
  const { type = 'access' } = options;
  const secret = type === 'refresh' ? config.jwt.refreshSecret : config.jwt.secret;
  const expiresIn = type === 'refresh' ? config.jwt.refreshExpiresIn : config.jwt.expiresIn;

  return jwt.sign({ ...payload, type }, secret, { expiresIn });
}

/**
 * 生成访问令牌和刷新令牌对
 * @param payload Token 载荷（不含 type/iat/exp）
 * @returns Token 对
 */
export function signTokenPair(payload: { userId: string; email: string; role: string }): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const accessToken = signToken(payload, { type: 'access' });
  const refreshToken = signToken(payload, { type: 'refresh' });

  // 解析过期时间（秒）
  const decoded = jwt.decode(accessToken) as { exp: number; iat: number } | null;
  const expiresIn = decoded ? decoded.exp - decoded.iat : 3600;

  return { accessToken, refreshToken, expiresIn };
}

/**
 * 验证 JWT Token
 * @param token JWT 字符串
 * @param options 验证选项
 * @returns 解码后的 Token 载荷
 * @throws UnauthorizedError 当 Token 无效或过期时
 */
export function verifyToken(
  token: string,
  options: { type?: 'access' | 'refresh' } = {}
): TokenPayload {
  const { type = 'access' } = options;
  const secret = type === 'refresh' ? config.jwt.refreshSecret : config.jwt.secret;

  try {
    const decoded = jwt.verify(token, secret, {
      clockTolerance: 60, // 允许 60 秒时钟偏差
    }) as TokenPayload;

    if (decoded.type !== type) {
      throw new UnauthorizedError(`Invalid token type, expected ${type}`);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Token verification failed');
  }
}

// ─── ID 生成 ───────────────────────────────────────────────────

/**
 * 生成 UUID v4
 * @returns UUID 字符串
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * 生成带前缀的唯一 ID
 * @param prefix ID 前缀（如 'usr', 'prj'）
 * @returns 带前缀的唯一 ID
 */
export function generatePrefixedId(prefix: string): string {
  const uuid = randomUUID().replace(/-/g, '').substring(0, 16);
  return `${prefix}_${uuid}`;
}

// ─── 随机 Token ────────────────────────────────────────────────

/**
 * 生成安全的随机令牌（用于邮件验证、密码重置等）
 * @param length 令牌长度（默认 32）
 * @returns 十六进制编码的随机字符串
 */
export function generateRandomToken(length: number = 32): string {
  const { randomBytes } = require('crypto');
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}
