import { Request, Response, NextFunction } from "express";
import { ProjectService } from "../services/project.service";
import { ProjectStatus } from "@prisma/client";
import { PaginationParams } from "../types/project.types";

export class ProjectController {
  private service: ProjectService;

  constructor() {
    this.service = new ProjectService();
  }

  /**
   * GET /api/v1/projects
   * 查询所有项目（支持分页、筛选、搜索）
   */
  findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const params: PaginationParams & { status?: string; platform?: string; search?: string } = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
        status: req.query.status as string | undefined,
        platform: req.query.platform as string | undefined,
        search: req.query.search as string | undefined,
      };

      const result = await this.service.findAll(params);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/projects/:id
   * 根据ID查询项目
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const project = await this.service.findById(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: `Project (${id}) not found` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/projects
   * 创建项目
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, platform, config } = req.body;

      const project = await this.service.create({
        name,
        description,
        platform,
        config,
      });

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/projects/:id
   * 更新项目
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, description, platform, config, status } = req.body;

      const project = await this.service.update(id, {
        name,
        description,
        platform,
        config,
        status,
      });

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/projects/:id
   * 删除项目
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.delete(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/projects/:id/pipeline/start
   * 启动项目流程
   */
  startPipeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const pipeline = await this.service.startPipeline(id);

      res.status(200).json({
        success: true,
        data: pipeline,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/projects/:id/pipeline/pause
   * 暂停项目流程
   */
  pausePipeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.pausePipeline(id);

      res.status(200).json({
        success: true,
        message: "Pipeline paused successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/projects/:id/pipeline/resume
   * 恢复项目流程
   */
  resumePipeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.resumePipeline(id);

      res.status(200).json({
        success: true,
        message: "Pipeline resumed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/projects/:id/transition
   * 项目状态机转换
   */
  transitionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !Object.values(ProjectStatus).includes(status as ProjectStatus)) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid status. Must be one of: ${Object.values(ProjectStatus).join(", ")}`,
          },
        });
        return;
      }

      const project = await this.service.transitionStatus(id, status as ProjectStatus);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  };
}


export default new ProjectController();
