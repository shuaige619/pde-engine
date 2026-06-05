import { prisma } from "../utils/prisma";
import { createLogger } from "../utils/logger";
import { NotFoundError, ValidationError, ConflictError, PipelineError } from "../utils/errors";
import {
  CreateProjectInput,
  UpdateProjectInput,
  PaginationParams,
  PaginatedResult,
  isValidTransition,
} from "../types/project.types";
import { CodeSource, Platform, Project, ProjectStatus, Prisma, TestMode } from "@prisma/client";
import { PipelineService } from "./pipeline.service";

const logger = createLogger("ProjectService");

export interface ProjectWithPipeline extends Project {
  pipeline: {
    id: string;
    status: string;
    progress: number;
  } | null;
}

export class ProjectService {
  private pipelineService: PipelineService;

  constructor() {
    this.pipelineService = new PipelineService();
  }

  /**
   * 查询所有项目（支持分页、筛选、搜索）
   */
  async findAll(
    params: PaginationParams & { status?: string; platform?: string; search?: string }
  ): Promise<PaginatedResult<Project>> {
    const { page = 1, limit = 20, status, platform, search, sortBy = "createdAt", sortOrder = "desc" } = params;

    const where: Prisma.ProjectWhereInput = {};

    if (status) {
      where.status = status as ProjectStatus;
    }

    if (platform) {
      where.platform = platform as Platform;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          pipeline: {
            select: {
              id: true,
              status: true,
              progress: true,
            },
          },
          _count: {
            select: { artifacts: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info("Projects queried", { page, limit, total, filters: { status, platform, search } });

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * 根据ID查询项目
   */
  async findById(id: string): Promise<Project | null> {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        pipeline: {
          include: {
            nodes: {
              orderBy: { createdAt: "asc" },
            },
            stages: {
              orderBy: { order: "asc" },
            },
          },
        },
        _count: {
          select: { artifacts: true },
        },
      },
    });

    if (!project) {
      return null;
    }

    logger.info("Project found", { projectId: id });
    return project;
  }

  /**
   * 创建项目
   */
  async create(data: CreateProjectInput): Promise<Project> {
    // 验证平台类型
    const validPlatforms = Object.values(Platform);
    if (!validPlatforms.includes(data.platform as Platform)) {
      throw new ValidationError(
        `Invalid platform: ${data.platform}. Must be one of: ${validPlatforms.join(", ")}`
      );
    }

    // 检查项目名称是否已存在
    const existing = await prisma.project.findFirst({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictError(`Project with name "${data.name}" already exists`);
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        platform: data.platform as Platform,
        codeSource: data.codeSource || CodeSource.TEMPLATE,
        gitConfig: data.gitUrl ? { url: data.gitUrl } : Prisma.JsonNull,
        figmaBinding: data.figmaUrl ? { url: data.figmaUrl } : Prisma.JsonNull,
        testMode: data.testMode || TestMode.LOCAL,
        createdById: data.createdById,
        status: ProjectStatus.DRAFT,
      },
    });

    logger.info("Project created", { projectId: project.id, name: project.name });
    return project;
  }

  /**
   * 更新项目
   */
  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    // 如果更新名称，检查是否与其他项目冲突
    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.project.findFirst({
        where: { name: data.name, id: { not: id } },
      });
      if (nameConflict) {
        throw new ConflictError(`Project with name "${data.name}" already exists`);
      }
    }

    const updateData: Prisma.ProjectUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.platform !== undefined) updateData.platform = data.platform as Platform;
    if (data.codeSource !== undefined) updateData.codeSource = data.codeSource;
    if (data.gitUrl !== undefined) {
      updateData.gitConfig = data.gitUrl ? { url: data.gitUrl } : Prisma.JsonNull;
    }
    if (data.figmaUrl !== undefined) {
      updateData.figmaBinding = data.figmaUrl ? { url: data.figmaUrl } : Prisma.JsonNull;
    }
    if (data.testMode !== undefined) updateData.testMode = data.testMode;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    logger.info("Project updated", { projectId: id });
    return updated;
  }

  /**
   * 删除项目（级联删除流程和产物）
   */
  async delete(id: string): Promise<void> {
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError("Project", id);
    }

    await prisma.project.delete({
      where: { id },
    });

    logger.info("Project deleted", { projectId: id });
  }

  /**
   * 启动流程
   */
  async startPipeline(projectId: string): Promise<import("@prisma/client").PipelineInstance> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { pipeline: true },
    });

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    if (project.status === "RUNNING") {
      throw new ConflictError("Project pipeline is already running");
    }

    // 状态机校验：草稿、暂停、失败状态可以启动或重启
    const canStartFrom: ProjectStatus[] = [ProjectStatus.DRAFT, ProjectStatus.PAUSED, ProjectStatus.FAILED];
    if (!canStartFrom.includes(project.status)) {
      throw new PipelineError(
        `Cannot start pipeline from status: ${project.status}. Must be one of: ${canStartFrom.join(", ")}`
      );
    }

    // 如果已有流程实例，先删除旧实例
    if (project.pipeline) {
      await prisma.pipelineInstance.delete({
        where: { id: project.pipeline.id },
      });
    }

    // 创建新的流程实例（12阶段）
    const pipeline = await this.pipelineService.createInstance(projectId);

    // 更新项目状态为 RUNNING
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "RUNNING" },
    });

    logger.info("Pipeline started", { projectId, pipelineId: pipeline.id });
    return pipeline;
  }

  /**
   * 暂停流程
   */
  async pausePipeline(projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { pipeline: true },
    });

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    if (project.status !== "RUNNING") {
      throw new PipelineError(`Cannot pause pipeline from status: ${project.status}`);
    }

    if (!project.pipeline) {
      throw new NotFoundError("Pipeline for project", projectId);
    }

    // 更新流程状态为 PAUSED
    await prisma.pipelineInstance.update({
      where: { id: project.pipeline.id },
      data: { status: "PAUSED" },
    });

    // 更新项目状态
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "PAUSED" },
    });

    logger.info("Pipeline paused", { projectId, pipelineId: project.pipeline.id });
  }

  /**
   * 恢复流程
   */
  async resumePipeline(projectId: string): Promise<void> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { pipeline: true },
    });

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    if (project.status !== "PAUSED") {
      throw new PipelineError(`Cannot resume pipeline from status: ${project.status}`);
    }

    if (!project.pipeline) {
      throw new NotFoundError("Pipeline for project", projectId);
    }

    // 更新流程状态为 RUNNING
    await prisma.pipelineInstance.update({
      where: { id: project.pipeline.id },
      data: { status: "RUNNING" },
    });

    // 更新项目状态
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "RUNNING" },
    });

    logger.info("Pipeline resumed", { projectId, pipelineId: project.pipeline.id });
  }

  /**
   * 项目状态机转换
   */
  async transitionStatus(projectId: string, newStatus: ProjectStatus): Promise<Project> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    if (!isValidTransition(project.status, newStatus)) {
      throw new ValidationError(
        `Invalid status transition: ${project.status} -> ${newStatus}`
      );
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: newStatus },
    });

    logger.info("Project status transitioned", {
      projectId,
      from: project.status,
      to: newStatus,
    });

    return updated;
  }
}
