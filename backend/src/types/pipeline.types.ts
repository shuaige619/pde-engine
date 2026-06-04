import { PipelineStage, NodeStatus, PipelineStatus } from "@prisma/client";

// ==================== 12阶段定义 ====================

export interface PipelineStageDef {
  stage: PipelineStage;
  name: string;
  description: string;
  order: number;
}

export const PIPELINE_STAGES: PipelineStageDef[] = [
  // 阶段 1-3: 准备
  { stage: "REQUIREMENT_ANALYSIS", name: "需求分析", description: "分析项目需求，明确功能范围", order: 1 },
  { stage: "DESIGN_PRD", name: "PRD设计", description: "编写产品设计文档", order: 2 },
  { stage: "TECH_SPEC", name: "技术规格", description: "制定技术规格文档", order: 3 },
  // 阶段 4-6: 开发
  { stage: "PROJECT_SETUP", name: "项目初始化", description: "初始化项目结构和依赖", order: 4 },
  { stage: "COMPONENT_DEV", name: "组件开发", description: "开发业务组件", order: 5 },
  { stage: "API_INTEGRATION", name: "API集成", description: "集成后端API接口", order: 6 },
  // 阶段 7-9: 构建
  { stage: "BUILD_COMPILE", name: "构建编译", description: "编译和打包", order: 7 },
  { stage: "QUALITY_CHECK", name: "质量检查", description: "代码质量检查", order: 8 },
  { stage: "TEST_VALIDATION", name: "测试验证", description: "运行测试用例", order: 9 },
  // 阶段 10-12: 部署
  { stage: "DEPLOY_PREPARE", name: "部署准备", description: "准备部署环境", order: 10 },
  { stage: "PRODUCTION_DEPLOY", name: "生产部署", description: "部署到生产环境", order: 11 },
  { stage: "POST_DEPLOY_VERIFY", name: "部署验证", description: "验证部署结果", order: 12 },
];

export function getStageByOrder(order: number): PipelineStageDef | undefined {
  return PIPELINE_STAGES.find((s) => s.order === order);
}

export function getStageDef(stage: PipelineStage): PipelineStageDef | undefined {
  return PIPELINE_STAGES.find((s) => s.stage === stage);
}

// ==================== 节点输入 ====================

export interface NodeInput {
  nodeId: string;
  config?: Record<string, unknown>;
  variables?: Record<string, unknown>;
}

export interface NodeOutput {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  logs?: string[];
}

// ==================== 流程实例查询 ====================

export interface PipelineQuery {
  status?: PipelineStatus;
  projectId?: string;
}

export interface PipelineNodeUpdate {
  status: NodeStatus;
  output?: NodeOutput;
  error?: string;
}

// ==================== 进度计算 ====================

export function calculateProgressPercentage(
  nodes: { status: NodeStatus; order: number }[]
): number {
  if (nodes.length === 0) return 0;

  const totalStages = PIPELINE_STAGES.length; // 12
  let completedStages = 0;

  for (const node of nodes) {
    if (node.status === "COMPLETED" || node.status === "SKIPPED") {
      completedStages++;
    }
  }

  return Math.round((completedStages / totalStages) * 100);
}

// ==================== 状态转换 ====================

export const NODE_VALID_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  PENDING: ["WAITING", "RUNNING", "SKIPPED"],
  WAITING: ["RUNNING", "SKIPPED"],
  RUNNING: ["COMPLETED", "FAILED", "RETRYING"],
  COMPLETED: [],
  FAILED: ["RETRYING", "SKIPPED"],
  SKIPPED: ["RUNNING"],
  RETRYING: ["RUNNING", "FAILED"],
};

export function isValidNodeTransition(from: NodeStatus, to: NodeStatus): boolean {
  const allowed = NODE_VALID_TRANSITIONS[from] || [];
  return allowed.includes(to as NodeStatus);
}

// ==================== API 响应类型 ====================

export interface PipelineInstanceResponse {
  id: string;
  projectId: string;
  status: PipelineStatus;
  progress: number;
  currentNode: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  nodes: PipelineNodeResponse[];
}

export interface PipelineNodeResponse {
  id: string;
  stage: PipelineStage;
  name: string;
  description: string | null;
  status: NodeStatus;
  order: number;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  retryCount: number;
  maxRetries: number;
}
