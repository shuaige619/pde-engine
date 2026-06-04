import { Request, Response, NextFunction } from "express";
import { ArtifactService } from "../services/artifact.service";
import { ArtifactType } from "@prisma/client";

export class ArtifactController {
  private service: ArtifactService;

  constructor() {
    this.service = new ArtifactService();
  }

  /**
   * GET /api/v1/projects/:projectId/artifacts
   * 查询项目的所有产物
   */
  findByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const artifacts = await this.service.findByProject(projectId);

      res.status(200).json({
        success: true,
        data: artifacts,
        meta: { count: artifacts.length },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/artifacts/:id
   * 根据ID查询产物
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const artifact = await this.service.findById(id);

      if (!artifact) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: `Artifact (${id}) not found` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: artifact,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/artifacts
   * 创建产物
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, name, type, filePath, fileSize, checksum, metadata } = req.body;

      if (!projectId || !name || !type || !filePath) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "projectId, name, type, and filePath are required",
          },
        });
        return;
      }

      const artifact = await this.service.create({
        projectId,
        name,
        type: type as ArtifactType,
        filePath,
        fileSize,
        checksum,
        metadata,
      });

      res.status(201).json({
        success: true,
        data: artifact,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/artifacts/:id
   * 更新产物
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, filePath, fileSize, checksum, metadata } = req.body;

      const artifact = await this.service.update(id, {
        name,
        filePath,
        fileSize,
        checksum,
        metadata,
      });

      res.status(200).json({
        success: true,
        data: artifact,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/artifacts/:id
   * 删除产物
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
   * GET /api/v1/artifacts/:id/download
   * 获取产物下载URL
   */
  getDownloadUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const downloadUrl = await this.service.getDownloadUrl(id);

      res.status(200).json({
        success: true,
        data: { downloadUrl },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/artifacts/:id/version
   * 标记产物版本
   */
  markVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const artifact = await this.service.markVersion(id);

      res.status(200).json({
        success: true,
        data: artifact,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/artifacts/:id/versions
   * 获取产物版本历史
   */
  getVersionHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const versions = await this.service.getVersionHistory(id);

      res.status(200).json({
        success: true,
        data: versions,
        meta: { count: versions.length },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/projects/:projectId/artifacts/type/:type
   * 按类型查询产物
   */
  findByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, type } = req.params;
      const artifacts = await this.service.findByType(projectId, type as ArtifactType);

      res.status(200).json({
        success: true,
        data: artifacts,
        meta: { count: artifacts.length },
      });
    } catch (error) {
      next(error);
    }
  };
}
