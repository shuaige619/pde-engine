import { prisma } from "../utils/prisma";
import { createLogger } from "../utils/logger";
import { NotFoundError, ValidationError, PipelineError } from "../utils/errors";
import {
  PIPELINE_STAGES,
  NodeOutput,
  calculateProgressPercentage,
  isValidNodeTransition,
} from "../types/pipeline.types";
import {
  NodeExecution,
  NodeStatus,
  PipelineInstance,
  PipelineStatus,
  Prisma,
  ProjectStatus,
} from "@prisma/client";

const logger = createLogger("PipelineService");

type PipelineWithDetails = PipelineInstance & {
  nodes: NodeExecution[];
  project: { id: string; name: string; status: string };
};

export class PipelineService {
  /**
   * 创建流程实例（12个阶段）
   */
  async createInstance(projectId: string): Promise<PipelineInstance> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError("Project", projectId);
    }

    const existing = await prisma.pipelineInstance.findUnique({
      where: { projectId },
    });

    if (existing) {
      throw new ValidationError("Pipeline instance already exists for this project");
    }

    const pipeline = await prisma.pipelineInstance.create({
      data: {
        projectId,
        status: PipelineStatus.RUNNING,
        progress: 0,
        currentNode: null,
        startedAt: new Date(),
      },
    });

    for (const stageDef of PIPELINE_STAGES) {
      const stage = await prisma.stage.create({
        data: {
          pipelineId: pipeline.id,
          name: stageDef.name,
          order: stageDef.order,
          status: stageDef.order === 1 ? "RUNNING" : "PENDING",
          startedAt: stageDef.order === 1 ? new Date() : undefined,
        },
      });

      const node = await prisma.nodeExecution.create({
        data: {
          pipelineId: pipeline.id,
          stageId: stage.id,
          name: stageDef.name,
          type: stageDef.type,
          status: stageDef.order === 1 ? "WAITING" : "PENDING",
          input: { description: stageDef.description, order: stageDef.order },
          retryCount: 0,
        },
      });

      if (stageDef.order === 1) {
        await prisma.pipelineInstance.update({
          where: { id: pipeline.id },
          data: { currentNode: node.id },
        });
      }
    }

    logger.info("Pipeline instance created", {
      projectId,
      pipelineId: pipeline.id,
      stages: PIPELINE_STAGES.length,
    });

    return this.findByProject(projectId) as Promise<PipelineInstance>;
  }

  async findByProject(projectId: string): Promise<PipelineWithDetails | null> {
    return prisma.pipelineInstance.findUnique({
      where: { projectId },
      include: {
        nodes: {
          orderBy: { createdAt: "asc" },
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
  }

  async findById(id: string): Promise<PipelineWithDetails | null> {
    return prisma.pipelineInstance.findUnique({
      where: { id },
      include: {
        nodes: {
          orderBy: { createdAt: "asc" },
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
  }

  async updateNodeStatus(nodeId: string, status: NodeStatus, output?: NodeOutput): Promise<void> {
    const node = await prisma.nodeExecution.findUnique({
      where: { id: nodeId },
      include: { pipeline: true },
    });

    if (!node) {
      throw new NotFoundError("NodeExecution", nodeId);
    }

    if (!isValidNodeTransition(node.status, status)) {
      throw new ValidationError(`Invalid node status transition: ${node.status} -> ${status}`);
    }

    const updateData: Prisma.NodeExecutionUpdateInput = { status };

    if (status === "RUNNING") {
      updateData.startedAt = new Date();
    }

    if (["COMPLETED", "FAILED", "SKIPPED"].includes(status)) {
      updateData.completedAt = new Date();
    }

    if (output !== undefined) {
      updateData.output = output as unknown as Prisma.JsonObject;
    }

    await prisma.nodeExecution.update({
      where: { id: nodeId },
      data: updateData,
    });

    await this.syncPipelineStatus(node.pipelineId);

    logger.info("Node status updated", {
      nodeId,
      from: node.status,
      to: status,
      pipelineId: node.pipelineId,
    });
  }

  async retryNode(nodeId: string): Promise<void> {
    const node = await prisma.nodeExecution.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundError("NodeExecution", nodeId);
    }

    if (node.status !== "FAILED") {
      throw new PipelineError(`Cannot retry node in status: ${node.status}. Must be FAILED.`);
    }

    await prisma.nodeExecution.update({
      where: { id: nodeId },
      data: {
        status: "WAITING",
        retryCount: { increment: 1 },
        logs: null,
        completedAt: null,
      },
    });

    await this.syncPipelineStatus(node.pipelineId);
    logger.info("Node retrying", { nodeId, retryCount: node.retryCount + 1 });
  }

  async skipNode(nodeId: string): Promise<void> {
    const node = await prisma.nodeExecution.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      throw new NotFoundError("NodeExecution", nodeId);
    }

    const skippableStatuses: NodeStatus[] = ["PENDING", "WAITING", "FAILED", "WAITING_USER"];
    if (!skippableStatuses.includes(node.status)) {
      throw new PipelineError(
        `Cannot skip node in status: ${node.status}. Must be one of: ${skippableStatuses.join(", ")}`
      );
    }

    await prisma.nodeExecution.update({
      where: { id: nodeId },
      data: {
        status: "SKIPPED",
        completedAt: new Date(),
        output: { skipped: true, message: "Manually skipped" } as Prisma.JsonObject,
      },
    });

    await this.syncPipelineStatus(node.pipelineId);
    logger.info("Node skipped", { nodeId });
  }

  async calculateProgress(pipelineId: string): Promise<number> {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { id: pipelineId },
      include: { nodes: true },
    });

    if (!pipeline) {
      throw new NotFoundError("PipelineInstance", pipelineId);
    }

    const progress = calculateProgressPercentage(pipeline.nodes);

    await prisma.pipelineInstance.update({
      where: { id: pipelineId },
      data: { progress },
    });

    return progress;
  }

  async getNodes(pipelineId: string): Promise<NodeExecution[]> {
    return prisma.nodeExecution.findMany({
      where: { pipelineId },
      orderBy: { createdAt: "asc" },
    });
  }

  async cancelPipeline(pipelineId: string): Promise<void> {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { id: pipelineId },
    });

    if (!pipeline) {
      throw new NotFoundError("PipelineInstance", pipelineId);
    }

    if (pipeline.status === "COMPLETED") {
      throw new PipelineError(`Cannot cancel pipeline in status: ${pipeline.status}`);
    }

    await prisma.pipelineInstance.update({
      where: { id: pipelineId },
      data: { status: "FAILED", completedAt: new Date() },
    });

    await prisma.nodeExecution.updateMany({
      where: { pipelineId, status: { in: ["PENDING", "WAITING", "RUNNING", "WAITING_USER"] } },
      data: { status: "SKIPPED", completedAt: new Date() },
    });

    await prisma.project.update({
      where: { id: pipeline.projectId },
      data: { status: "FAILED" },
    });

    logger.info("Pipeline cancelled", { pipelineId });
  }

  private async syncPipelineStatus(pipelineId: string): Promise<void> {
    const pipeline = await prisma.pipelineInstance.findUnique({
      where: { id: pipelineId },
      include: { nodes: true },
    });

    if (!pipeline) return;

    const nodeStatuses = pipeline.nodes.map((node) => node.status);
    let newStatus: PipelineStatus = pipeline.status;

    if (nodeStatuses.every((status) => status === "COMPLETED" || status === "SKIPPED")) {
      newStatus = "COMPLETED";
    } else if (nodeStatuses.some((status) => status === "FAILED")) {
      newStatus = "FAILED";
    } else if (nodeStatuses.some((status) =>
      status === "RUNNING" || status === "WAITING" || status === "WAITING_USER"
    )) {
      newStatus = "RUNNING";
    }

    const currentNode = pipeline.nodes.find((node) =>
      node.status === "RUNNING" || node.status === "WAITING" || node.status === "WAITING_USER"
    );

    const progress = calculateProgressPercentage(pipeline.nodes);

    const updateData: Prisma.PipelineInstanceUpdateInput = {
      status: newStatus,
      progress,
      currentNode: currentNode?.id || null,
    };

    if (newStatus === "COMPLETED" && pipeline.status !== "COMPLETED") {
      updateData.completedAt = new Date();
    }

    await prisma.pipelineInstance.update({
      where: { id: pipelineId },
      data: updateData,
    });

    await this.syncProjectStatus(pipeline.projectId, newStatus);

    logger.debug("Pipeline status synced", {
      pipelineId,
      status: newStatus,
      progress,
    });
  }

  private async syncProjectStatus(projectId: string, pipelineStatus: PipelineStatus): Promise<void> {
    const statusMap: Record<PipelineStatus, ProjectStatus> = {
      PENDING: "DRAFT",
      RUNNING: "RUNNING",
      PAUSED: "PAUSED",
      COMPLETED: "COMPLETED",
      FAILED: "FAILED",
    };

    await prisma.project.update({
      where: { id: projectId },
      data: { status: statusMap[pipelineStatus] },
    });
  }
}
