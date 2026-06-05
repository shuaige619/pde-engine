import { Router } from "express";
import projectController from "../controllers/project.controller";

const router = Router();
const controller = projectController;

/**
 * @route   GET /api/v1/projects
 * @desc    查询所有项目（支持分页、筛选、搜索）
 * @query   page, limit, sortBy, sortOrder, status, platform, search
 */
router.get("/", controller.findAll);

/**
 * @route   GET /api/v1/projects/:id
 * @desc    根据ID查询项目详情
 */
router.get("/:id", controller.findById);

/**
 * @route   POST /api/v1/projects
 * @desc    创建项目
 * @body    { name, description, platform, config }
 */
router.post("/", controller.create);

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    更新项目
 * @body    { name?, description?, platform?, config?, status? }
 */
router.put("/:id", controller.update);

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    删除项目（级联删除流程和产物）
 */
router.delete("/:id", controller.delete);

/**
 * @route   POST /api/v1/projects/:id/pipeline/start
 * @desc    启动项目流程（创建12阶段流程实例）
 */
router.post("/:id/pipeline/start", controller.startPipeline);

/**
 * @route   POST /api/v1/projects/:id/pipeline/pause
 * @desc    暂停项目流程
 */
router.post("/:id/pipeline/pause", controller.pausePipeline);

/**
 * @route   POST /api/v1/projects/:id/pipeline/resume
 * @desc    恢复项目流程
 */
router.post("/:id/pipeline/resume", controller.resumePipeline);

/**
 * @route   POST /api/v1/projects/:id/transition
 * @desc    项目状态机转换
 * @body    { status }
 */
router.post("/:id/transition", controller.transitionStatus);

export default router;
