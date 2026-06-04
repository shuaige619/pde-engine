import { prisma } from "../utils/prisma";
import { createLogger } from "../utils/logger";
import { NotFoundError, ValidationError } from "../utils/errors";
import {
  CreateArtifactInput,
  bumpVersion,
} from "../types/artifact.types";
import { Artifact, Prisma, ArtifactType } from "@prisma/client";

const logger = createLogger("ArtifactService");

export interface ArtifactWithVersions extends Artifact {
  versions: Artifact[];
  parent: Artifact | null;
}

export class ArtifactService {
  /**
   * 查询项目的所有产物
   */
  async findByProject(projectId: string): Promise<Artifact[]> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    const artifacts = await prisma.artifact.findMany({
      where: {
        projectId,
        parentId: null, // 只返回主产物，不包含版本历史
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { versions: true },
        },
      },
    });

    logger.info("Artifacts queried", { projectId, count: artifacts.length });
    return artifacts;
  }

  /**
   * 根据ID查询产物
   */
  async findById(id: string): Promise<ArtifactWithVersions | null> {
    const artifact = await prisma.artifact.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
        parent: true,
      },
    });

    return artifact as ArtifactWithVersions | null;
  }

  /**
   * 创建产物
   */
  async create(data: CreateArtifactInput): Promise<Artifact> {
    // 验证项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundError("Project", data.projectId);
    }

    // 验证产物类型
    const validTypes: ArtifactType[] = [
      "DESIGN_DOC",
      "PRD",
      "TECH_SPEC",
      "SOURCE_CODE",
      "COMPONENT",
      "BUILD_OUTPUT",
      "TEST_REPORT",
      "DEPLOY_PACKAGE",
      "LOG",
      "CONFIG",
    ];
    if (!validTypes.includes(data.type)) {
      throw new ValidationError(
        `Invalid artifact type: ${data.type}. Must be one of: ${validTypes.join(", ")}`
      );
    }

    const artifact = await prisma.artifact.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        type: data.type,
        filePath: data.filePath,
        fileSize: data.fileSize || null,
        checksum: data.checksum || null,
        metadata: (data.metadata || {}) as Prisma.JsonObject,
        version: "1.0.0",
        isVersioned: false,
      },
    });

    logger.info("Artifact created", {
      artifactId: artifact.id,
      projectId: data.projectId,
      type: data.type,
    });

    return artifact;
  }

  /**
   * 获取产物下载URL
   */
  async getDownloadUrl(artifactId: string): Promise<string> {
    const artifact = await prisma.artifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      throw new NotFoundError("Artifact", artifactId);
    }

    // 构建下载URL
    // 实际生产环境中，这里应该调用对象存储服务生成预签名URL
    const baseUrl = process.env.STORAGE_BASE_URL || "/api/v1/storage";
    const downloadUrl = `${baseUrl}/download/${artifact.filePath}`;

    logger.info("Download URL generated", { artifactId, url: downloadUrl });
    return downloadUrl;
  }

  /**
   * 标记产物版本（创建版本快照）
   */
  async markVersion(artifactId: string): Promise<Artifact> {
    const artifact = await prisma.artifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      throw new NotFoundError("Artifact", artifactId);
    }

    if (!artifact.isVersioned) {
      // 首次标记版本，直接设置为已版本化
      const updated = await prisma.artifact.update({
        where: { id: artifactId },
        data: { isVersioned: true },
      });

      logger.info("Artifact versioned", { artifactId, version: updated.version });
      return updated;
    }

    // 已版本化，创建新版本
    const newVersion = bumpVersion(artifact.version, "minor");

    // 创建新版本记录（将当前产物作为新版本的历史记录）
    const newArtifact = await prisma.artifact.create({
      data: {
        projectId: artifact.projectId,
        name: artifact.name,
        type: artifact.type,
        filePath: artifact.filePath,
        fileSize: artifact.fileSize,
        checksum: artifact.checksum,
        metadata: artifact.metadata as Prisma.JsonObject,
        version: newVersion,
        isVersioned: true,
        parentId: artifactId,
      },
    });

    logger.info("Artifact version bumped", {
      artifactId,
      fromVersion: artifact.version,
      toVersion: newVersion,
      newArtifactId: newArtifact.id,
    });

    return newArtifact;
  }

  /**
   * 获取产物版本历史
   */
  async getVersionHistory(artifactId: string): Promise<Artifact[]> {
    const artifact = await prisma.artifact.findUnique({
      where: { id: artifactId },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!artifact) {
      throw new NotFoundError("Artifact", artifactId);
    }

    logger.info("Version history queried", {
      artifactId,
      versionCount: artifact.versions.length,
    });

    return artifact.versions;
  }

  /**
   * 更新产物
   */
  async update(
    id: string,
    data: {
      name?: string;
      filePath?: string;
      fileSize?: number;
      checksum?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Artifact> {
    const artifact = await prisma.artifact.findUnique({
      where: { id },
    });

    if (!artifact) {
      throw new NotFoundError("Artifact", id);
    }

    const updateData: Prisma.ArtifactUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.filePath !== undefined) updateData.filePath = data.filePath;
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize;
    if (data.checksum !== undefined) updateData.checksum = data.checksum;
    if (data.metadata !== undefined) updateData.metadata = data.metadata as Prisma.JsonObject;

    const updated = await prisma.artifact.update({
      where: { id },
      data: updateData,
    });

    logger.info("Artifact updated", { artifactId: id });
    return updated;
  }

  /**
   * 删除产物
   */
  async delete(id: string): Promise<void> {
    const artifact = await prisma.artifact.findUnique({
      where: { id },
    });

    if (!artifact) {
      throw new NotFoundError("Artifact", id);
    }

    await prisma.artifact.delete({
      where: { id },
    });

    logger.info("Artifact deleted", { artifactId: id });
  }

  /**
   * 按类型查询产物
   */
  async findByType(projectId: string, type: ArtifactType): Promise<Artifact[]> {
    const artifacts = await prisma.artifact.findMany({
      where: { projectId, type, parentId: null },
      orderBy: { createdAt: "desc" },
    });

    return artifacts;
  }
}
