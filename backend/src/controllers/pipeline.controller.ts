import { Request, Response, NextFunction } from "express";
import { PipelineService } from "../services/pipeline.service";
import { NodeStatus } from "@prisma/client";

export class PipelineController {
  private service: PipelineService;

  constructor() {
    this.service = new PipelineService();
  }

  /**
   * GET /api/v1/pipelines/project/:projectId
   * 根据项目ID查询流程
   */
  findByProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.params;
      const pipeline = await this.service.findByProject(projectId);

      if (!pipeline) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: `Pipeline for project (${projectId}) not found` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: pipeline,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/pipelines/:id
   * 根据流程ID查询流程
   */
  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const pipeline = await this.service.findById(id);

      if (!pipeline) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: `Pipeline (${id}) not found` },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: pipeline,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/pipelines
   * 创建流程实例
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.body;

      if (!projectId) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "projectId is required" },
        });
        return;
      }

      const pipeline = await this.service.createInstance(projectId);

      res.status(201).json({
        success: true,
        data: pipeline,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/pipelines/:id/cancel
   * 取消流程
   */
  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.cancelPipeline(id);

      res.status(200).json({
        success: true,
        message: "Pipeline cancelled successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/pipelines/nodes/:nodeId/status
   * 更新节点状态
   */
  updateNodeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { nodeId } = req.params;
      const { status, output } = req.body;

      if (!status || !Object.values(NodeStatus).includes(status as NodeStatus)) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid status. Must be one of: ${Object.values(NodeStatus).join(", ")}`,
          },
        });
        return;
      }

      await this.service.updateNodeStatus(nodeId, status as NodeStatus, output);

      res.status(200).json({
        success: true,
        message: `Node status updated to ${status}`,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/pipelines/nodes/:nodeId/retry
   * 重试节点
   */
  retryNode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { nodeId } = req.params;
      await this.service.retryNode(nodeId);

      res.status(200).json({
        success: true,
        message: "Node retry initiated",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/pipelines/nodes/:nodeId/skip
   * 跳过节点
   */
  skipNode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { nodeId } = req.params;
      await this.service.skipNode(nodeId);

      res.status(200).json({
        success: true,
        message: "Node skipped successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/pipelines/:id/progress
   * 获取流程进度
   */
  getProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const progress = await this.service.calculateProgress(id);

      res.status(200).json({
        success: true,
        data: { progress, percentage: `${progress}%` },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/pipelines/:id/nodes
   * 获取流程的所有节点
   */
  getNodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const nodes = await this.service.getNodes(id);

      res.status(200).json({
        success: true,
        data: nodes,
      });
    } catch (error) {
      next(error);
    }
  };
}


export default new PipelineController();
