import { prisma } from "../utils/prisma";
import { createLogger } from "../utils/logger";
import { NotFoundError, ValidationError, PipelineError } from "../utils/errors";
import {
  PIPELINE_STAGES,
  PipelineStageDef,
  NodeOutput,
  calculateProgressPercentage,
  isValidNodeTransition,
} from "../types/pipeline.types";
import {
  PipelineInstance,
  PipelineNode,
  PipelineStatus,
  NodeStatus,
  Prisma,
} from "@prisma/client";

const logger = createLogger("PipelineService");

export class PipelineService {
  /**
   * 创建流程实例（12个阶段）
   */
  async createInstance(projectId: string): Promise<PipelineInstance> {
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    // 检查是否已存在流程实例
    const existing = await prisma.pipelineInstance.findUnique({
      where: { projectId },
    });

    if (existing) {
      throw new ValidationError("Pipeline instance already exists for this project");
    }

    // 创建流程实例
    const pipeline = await prisma.pipelineInstance.create({
      data: {
        projectId,
        status: "PENDING",
        progress: 0,
        currentNode: null,
      },
    });

    // 创建12个流程节点
    const nodeData: Prisma.PipelineNodeCreateManyInput[] = PIPELINE_STAGES.map(
      (stageDef: PipelineStageDef) => ({
        pipelineId: pipeline.id,
        stage: stageDef.stage,
        name: stageDef.name,
        description: stageDef.description,
        status: stageDef.order === 1 ? "WAITING" : ("PENDING" as NodeStatus),
        order: stageDef.order,
        config: Prisma.JsonNull,
        retryCount: 0,
        maxRetries: 3,
      })
    );

    await prisma.pipelineNode.createMany({
      data: nodeData,
    });

    logger.info("Pipeline instance created", {
      projectId,
      pipelineId: pipeline.id,
      stages: PIPELINE_STAGES.length,
    });

    // 返回包含 nodes 的完整实例
    return this.findByProject(projectId) as Promise<PipelineInstance>;
  }

  /**
   * 根据项目ID查询流程实例
   */
  async findByProject(projectId: string): Promise<PipelineInstance | null> {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { projectId },
      include: {
        nodes: {
          orderBy: { order: "asc" },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return pipeline;
  }

  /**
   * 根据流程ID查询流程实例
   */
  async findById(id: string): Promise<
    | (PipelineInstance & {
        nodes: PipelineNode[];
        project: { id: string; name: string; status: string };
      })
    | null
  > {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { order: "asc" },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return pipeline;
  }

  /**
   * 更新节点状态
   */
  async updateNodeStatus(
    nodeId: string,
    status: NodeStatus,
    output?: NodeOutput
  ): Promise<void> {
    const node = await prisma.pipelineNode.findUnique({
      where: { id: nodeId },
      include: { pipeline: true },
    });

    if (!node) {
      throw new NotFoundError("PipelineNode", nodeId);
    }

    // 校验状态转换
    if (!isValidNodeTransition(node.status, status)) {
      throw new ValidationError(
        `Invalid node status transition: ${node.status} -> ${status}`
      );
    }

    const updateData: Prisma.PipelineNodeUpdateInput = {
      status,
    };

    // 状态为 RUNNING 时记录开始时间
    if (status === "RUNNING") {
      updateData.startedAt = new Date();
    }

    // 状态为 COMPLETED/FAILED/SKIPPED 时记录完成时间
    if (["COMPLETED", "FAILED", "SKIPPED"].includes(status)) {
      updateData.completedAt = new Date();
    }

    // 更新 output
    if (output !== undefined) {
      updateData.output = output as unknown as Prisma.JsonObject;
    }

    // 重试次数+1
    if (status === "RETRYING") {
      updateData.retryCount = { increment: 1 };
    }

    // 更新节点
    await prisma.pipelineNode.update({
      where: { id: nodeId },
      data: updateData,
    });

    // 更新流程实例状态
    await this.syncPipelineStatus(node.pipelineId);

    logger.info("Node status updated", {
      nodeId,
      stage: node.stage,
      from: node.status,
      to: status,
      pipelineId: node.pipelineId,
    });
  }

  /**
   * 重试节点
   */
  async retryNode(nodeId: string): Promise<void> {
    const node = await prisma.pipelineNode.findUnique({
      where: { id: nodeId },
      include: { pipeline: { include: { nodes: true } } },
    });

    if (!node) {
      throw new NotFoundError("PipelineNode", nodeId);
    }

    // 只有 FAILED 或 RETRYING 状态的节点可以重试
    if (node.status !== "FAILED" && node.status !== "RETRYING") {
      throw new PipelineError(
        `Cannot retry node in status: ${node.status}. Must be FAILED or RETRYING.`
      );
    }

    // 检查重试次数
    if (node.retryCount >= node.maxRetries) {
      throw new PipelineError(
        `Node has reached max retries (${node.maxRetries})`
      );
    }

    // 更新为重试状态
    await prisma.pipelineNode.update({
      where: { id: nodeId },
      data: {
        status: "RETRYING",
        retryCount: { increment: 1 },
        error: null,
      },
    });

    logger.info("Node retrying", {
      nodeId,
      stage: node.stage,
      retryCount: node.retryCount + 1,
      maxRetries: node.maxRetries,
    });
  }

  /**
   * 跳过节点
   */
  async skipNode(nodeId: string): Promise<void> {
    const node = await prisma.pipelineNode.findUnique({
      where: { id: nodeId },
      include: { pipeline: true },
    });

    if (!node) {
      throw new NotFoundError("PipelineNode", nodeId);
    }

    // 只能跳过 PENDING, WAITING, FAILED 状态的节点
    const skippableStatuses: NodeStatus[] = ["PENDING", "WAITING", "FAILED"];
    if (!skippableStatuses.includes(node.status)) {
      throw new PipelineError(
        `Cannot skip node in status: ${node.status}. Must be one of: ${skippableStatuses.join(", ")}`
      );
    }

    await prisma.pipelineNode.update({
      where: { id: nodeId },
      data: {
        status: "SKIPPED",
        completedAt: new Date(),
        output: { skipped: true, message: "Manually skipped" } as Prisma.JsonObject,
      },
    });

    // 同步流程状态
    await this.syncPipelineStatus(node.pipelineId);

    logger.info("Node skipped", { nodeId, stage: node.stage });
  }

  /**
   * 计算流程进度（0-100）
   */
  async calculateProgress(pipelineId: string): Promise<number> {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { id: pipelineId },
      include: { nodes: true },
    });

    if (!pipeline) {
      throw new NotFoundError("PipelineInstance", pipelineId);
    }

    const progress = calculateProgressPercentage(
      pipeline.nodes.map((n) => ({ status: n.status, order: n.order }))
    );

    // 更新进度到数据库
    await prisma.pipelineInstance.update({
      where: { id: pipelineId },
      data: { progress },
    });

    return progress;
  }

  /**
   * 同步流程实例状态（根据所有节点状态计算）
   */
  private async syncPipelineStatus(pipelineId: string): Promise<void> {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { id: pipelineId },
      include: { nodes: true },
    });

    if (!pipeline) return;

    const nodeStatuses = pipeline.nodes.map((n) => n.status);

    let newStatus: PipelineStatus = pipeline.status;

    // 如果所有节点都完成，流程完成
    if (nodeStatuses.every((s) => s === "COMPLETED" || s === "SKIPPED")) {
      newStatus = "COMPLETED";
    }
    // 如果有节点失败，流程失败
    else if (nodeStatuses.some((s) => s === "FAILED")) {
      // 检查是否有节点还在重试中
      const hasRetrying = nodeStatuses.some((s) => s === "RETRYING");
      if (!hasRetrying) {
        newStatus = "FAILED";
      }
    }
    // 如果有节点正在运行，流程运行中
    else if (nodeStatuses.some((s) => s === "RUNNING" || s === "RETRYING")) {
      newStatus = "RUNNING";
    }

    // 计算当前节点
    const currentNode = pipeline.nodes.find(
      (n) => n.status === "RUNNING" || n.status === "WAITING" || n.status === "RETRYING"
    );

    // 计算进度
    const progress = calculateProgressPercentage(
      pipeline.nodes.map((n) => ({ status: n.status, order: n.order }))
    );

    const updateData: Prisma.PipelineInstanceUpdateInput = {
      status: newStatus,
      progress,
      currentNode: currentNode?.id || null,
    };

    if (newStatus === "COMPLETED" && pipeline.status !== "COMPLETED") {
      updateData.completedAt = new Date();
    }

    if (newStatus === "RUNNING" && !pipeline.startedAt) {
      updateData.startedAt = new Date();
    }

    await prisma.pipelineInstance.update({
      where: { id: pipelineId },
      data: updateData,
    });

    // 同步项目状态
    await this.syncProjectStatus(pipeline);

    logger.debug("Pipeline status synced", {
      pipelineId,
      status: newStatus,
      progress,
    });
  }

  /**
   * 同步项目状态
   */
  private async syncProjectStatus(pipeline: PipelineInstance): Promise<void> {
    const projectId = pipeline.projectId;

    const statusMap: Record<PipelineStatus, string> = {
      PENDING: "READY",
      RUNNING: "RUNNING",
      PAUSED: "PAUSED",
      COMPLETED: "COMPLETED",
      FAILED: "FAILED",
      CANCELLED: "FAILED",
    };

    const projectStatus = statusMap[pipeline.status];
    if (projectStatus) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: projectStatus as import("@prisma/client").ProjectStatus },
      });
    }
  }

  /**
   * 获取流程中的所有节点
   */
  async getNodes(pipelineId: string): Promise<PipelineNode[]> {
    const nodes = await prisma.pipelineNode.findMany({
      where: { pipelineId },
      orderBy: { order: "asc" },
    });

    return nodes;
  }

  /**
   * 取消流程
   */
  async cancelPipeline(pipelineId: string): Promise<void> {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { id: pipelineId },
    });

    if (!pipeline) {
      throw new NotFoundError("PipelineInstance", pipelineId);
    }

    if (pipeline.status === "COMPLETED" || pipeline.status === "CANCELLED") {
      throw new PipelineError(`Cannot cancel pipeline in status: ${pipeline.status}`);
    }

    await prisma.pipelineInstance.update({
      where: { id: pipelineId },
      data: { status: "CANCELLED", completedAt: new Date() },
    });

    // 取消所有运行中的节点
    await prisma.pipelineNode.updateMany({
      where: { pipelineId, status: { in: ["PENDING", "WAITING", "RUNNING", "RETRYING"] } },
      data: { status: "SKIPPED", completedAt: new Date() },
    });

    logger.info("Pipeline cancelled", { pipelineId });
  }
}
