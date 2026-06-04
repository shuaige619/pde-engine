import { Router } from "express";
import { PipelineController } from "../controllers/pipeline.controller";

const router = Router();
const controller = new PipelineController();

/**
 * @route   POST /api/v1/pipelines
 * @desc    创建流程实例（12阶段）
 * @body    { projectId }
 */
router.post("/", controller.create);

/**
 * @route   GET /api/v1/pipelines/project/:projectId
 * @desc    根据项目ID查询流程详情
 */
router.get("/project/:projectId", controller.findByProject);

/**
 * @route   GET /api/v1/pipelines/:id
 * @desc    根据流程ID查询详情
 */
router.get("/:id", controller.findById);

/**
 * @route   POST /api/v1/pipelines/:id/cancel
 * @desc    取消流程
 */
router.post("/:id/cancel", controller.cancel);

/**
 * @route   GET /api/v1/pipelines/:id/nodes
 * @desc    获取流程的所有节点
 */
router.get("/:id/nodes", controller.getNodes);

/**
 * @route   GET /api/v1/pipelines/:id/progress
 * @desc    计算流程进度（0-100）
 */
router.get("/:id/progress", controller.getProgress);

/**
 * @route   PATCH /api/v1/pipelines/nodes/:nodeId/status
 * @desc    更新节点状态
 * @body    { status, output? }
 */
router.patch("/nodes/:nodeId/status", controller.updateNodeStatus);

/**
 * @route   POST /api/v1/pipelines/nodes/:nodeId/retry
 * @desc    重试节点
 */
router.post("/nodes/:nodeId/retry", controller.retryNode);

/**
 * @route   POST /api/v1/pipelines/nodes/:nodeId/skip
 * @desc    跳过节点
 */
router.post("/nodes/:nodeId/skip", controller.skipNode);

export default router;
