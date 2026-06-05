import { Router } from "express";
import artifactController from "../controllers/artifact.controller";

const router = Router();
const controller = artifactController;

/**
 * @route   GET /api/v1/projects/:projectId/artifacts
 * @desc    查询项目的所有产物
 */
router.get("/projects/:projectId/artifacts", controller.findByProject);

/**
 * @route   GET /api/v1/projects/:projectId/artifacts/type/:type
 * @desc    按类型查询产物
 */
router.get("/projects/:projectId/artifacts/type/:type", controller.findByType);

/**
 * @route   GET /api/v1/artifacts/:id
 * @desc    根据ID查询产物详情
 */
router.get("/:id", controller.findById);

/**
 * @route   POST /api/v1/artifacts
 * @desc    创建产物
 * @body    { projectId, name, type, filePath, fileSize?, checksum?, metadata? }
 */
router.post("/", controller.create);

/**
 * @route   PUT /api/v1/artifacts/:id
 * @desc    更新产物
 * @body    { name?, filePath?, fileSize?, checksum?, metadata? }
 */
router.put("/:id", controller.update);

/**
 * @route   DELETE /api/v1/artifacts/:id
 * @desc    删除产物
 */
router.delete("/:id", controller.delete);

/**
 * @route   GET /api/v1/artifacts/:id/download
 * @desc    获取产物下载URL
 */
router.get("/:id/download", controller.getDownloadUrl);

/**
 * @route   POST /api/v1/artifacts/:id/version
 * @desc    标记产物版本
 */
router.post("/:id/version", controller.markVersion);

/**
 * @route   GET /api/v1/artifacts/:id/versions
 * @desc    获取产物版本历史
 */
router.get("/:id/versions", controller.getVersionHistory);

export default router;
