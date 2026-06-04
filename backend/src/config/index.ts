/**
 * 配置管理模块
 * 从环境变量读取所有配置，提供类型安全的配置对象
 */

import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量（优先从项目根目录的 .env 文件加载）
const envPath = process.env.DOTENV_CONFIG_PATH || path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// 从 process.env 读取环境变量，不存在时使用默认值
function getEnvString(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvInt(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid integer, got: ${value}`);
  }
  return parsed;
}

function getEnvBoolean(key: string, defaultValue?: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * 运行环境枚举
 */
export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * 全局配置对象接口
 */
export interface AppConfig {
  /** 运行环境 */
  nodeEnv: NodeEnv;
  /** HTTP 服务端口 */
  port: number;
  /** 数据库连接 URL */
  databaseUrl: string;
  /** Redis 连接 URL */
  redisUrl: string;
  /** RabbitMQ 连接 URL */
  rabbitmqUrl: string;
  /** JWT 配置 */
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  /** 密码哈希配置 */
  bcrypt: {
    saltRounds: number;
  };
  /** CORS 配置 */
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
  };
  /** 日志配置 */
  log: {
    level: string;
    prettyPrint: boolean;
  };
  /** API 配置 */
  api: {
    prefix: string;
    version: string;
  };
  /** 分页配置 */
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
}

/**
 * 解析 CORS origin 配置
 * 支持逗号分隔的多 origin、通配符 *、以及布尔值
 */
function parseCorsOrigin(originStr: string | undefined): string | string[] | boolean {
  if (!originStr || originStr === '') {
    // 开发环境默认允许所有
    return process.env.NODE_ENV === NodeEnv.Production ? false : true;
  }
  if (originStr.toLowerCase() === 'true') return true;
  if (originStr.toLowerCase() === 'false') return false;
  if (originStr === '*') return true;
  const origins = originStr.split(',').map((s) => s.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

// 初始化全局配置
const config: AppConfig = {
  nodeEnv: (process.env.NODE_ENV as NodeEnv) || NodeEnv.Development,
  port: getEnvInt('PORT', 3000),
  databaseUrl: getEnvString('DATABASE_URL'),
  redisUrl: getEnvString('REDIS_URL', 'redis://localhost:6379'),
  rabbitmqUrl: getEnvString('RABBITMQ_URL', 'amqp://localhost:5672'),
  jwt: {
    secret: getEnvString('JWT_SECRET'),
    expiresIn: getEnvString('JWT_EXPIRES_IN', '1h'),
    refreshSecret: getEnvString('JWT_REFRESH_SECRET', getEnvString('JWT_SECRET') + '_refresh'),
    refreshExpiresIn: getEnvString('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  bcrypt: {
    saltRounds: getEnvInt('BCRYPT_SALT_ROUNDS', 12),
  },
  cors: {
    origin: parseCorsOrigin(process.env.CORS_ORIGIN),
    credentials: getEnvBoolean('CORS_CREDENTIALS', true),
  },
  log: {
    level: getEnvString('LOG_LEVEL', 'info'),
    prettyPrint: getEnvBoolean('LOG_PRETTY_PRINT', process.env.NODE_ENV !== NodeEnv.Production),
  },
  api: {
    prefix: getEnvString('API_PREFIX', '/api'),
    version: getEnvString('API_VERSION', 'v1'),
  },
  pagination: {
    defaultPageSize: getEnvInt('DEFAULT_PAGE_SIZE', 20),
    maxPageSize: getEnvInt('MAX_PAGE_SIZE', 100),
  },
};

/**
 * 检查当前是否为开发环境
 */
export function isDevelopment(): boolean {
  return config.nodeEnv === NodeEnv.Development;
}

/**
 * 检查当前是否为生产环境
 */
export function isProduction(): boolean {
  return config.nodeEnv === NodeEnv.Production;
}

/**
 * 检查当前是否为测试环境
 */
export function isTest(): boolean {
  return config.nodeEnv === NodeEnv.Test;
}

export default config;
