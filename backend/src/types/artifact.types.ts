import { ArtifactType } from "@prisma/client";

// ==================== 输入类型 ====================

export interface CreateArtifactInput {
  projectId: string;
  name: string;
  type: ArtifactType;
  filePath: string;
  fileSize?: number;
  checksum?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateArtifactInput {
  name?: string;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  metadata?: Record<string, unknown>;
}

// ==================== 查询类型 ====================

export interface ArtifactQuery {
  projectId?: string;
  type?: ArtifactType;
  isVersioned?: boolean;
  search?: string;
}

// ==================== 版本管理 ====================

export interface VersionBumpInput {
  artifactId: string;
  bumpType: "major" | "minor" | "patch";
}

export function bumpVersion(currentVersion: string, bumpType: "major" | "minor" | "patch"): string {
  const parts = currentVersion.split(".").map(Number);
  const [major, minor, patch] = parts.length === 3 ? parts : [1, 0, 0];

  switch (bumpType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// ==================== 预签名URL配置 ====================

export interface PresignedUrlConfig {
  expiresIn?: number; // seconds
  contentType?: string;
}

export const DEFAULT_PRESIGNED_URL_EXPIRY = 3600; // 1 hour

// ==================== API 响应类型 ====================

export interface ArtifactResponse {
  id: string;
  projectId: string;
  name: string;
  type: ArtifactType;
  filePath: string;
  fileSize: number | null;
  checksum: string | null;
  version: string;
  isVersioned: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  parentId: string | null;
}

export interface ArtifactVersionResponse {
  id: string;
  version: string;
  filePath: string;
  createdAt: Date;
}
