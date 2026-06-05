import { NodeStatus, PipelineStatus } from "@prisma/client";

// ==================== 12阶段定义 ====================

export interface PipelineStageDef {
  type: string;
  name: string;
  description: string;
  order: number;
}

export const PIPELINE_STAGES: PipelineStageDef[] = [
  { type: "REQUIREMENT_ANALYSIS", name: "需求分析", description: "分析项目需求，明确功能范围", order: 1 },
  { type: "DESIGN_PRD", name: "PRD设计", description: "编写产品设计文档", order: 2 },
  { type: "TECH_SPEC", name: "技术规格", description: "制定技术规格文档", order: 3 },
  { type: "PROJECT_SETUP", name: "项目初始化", description: "初始化项目结构和依赖", order: 4 },
  { type: "COMPONENT_DEV", name: "组件开发", description: "开发业务组件", order: 5 },
  { type: "API_INTEGRATION", name: "API集成", description: "集成后端API接口", order: 6 },
  { type: "BUILD_COMPILE", name: "构建编译", description: "编译和打包", order: 7 },
  { type: "QUALITY_CHECK", name: "质量检查", description: "代码质量检查", order: 8 },
  { type: "TEST_VALIDATION", name: "测试验证", description: "运行测试用例", order: 9 },
  { type: "DEPLOY_PREPARE", name: "部署准备", description: "准备部署环境", order: 10 },
  { type: "PRODUCTION_DEPLOY", name: "生产部署", description: "部署到生产环境", order: 11 },
  { type: "POST_DEPLOY_VERIFY", name: "部署验证", description: "验证部署结果", order: 12 },
];

// ==================== 节点输入输出 ====================

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
}

// ==================== 进度计算 ====================

export function calculateProgressPercentage(nodes: { status: NodeStatus }[]): number {
  if (nodes.length === 0) return 0;

  const completedStages = nodes.filter((node) =>
    node.status === "COMPLETED" || node.status === "SKIPPED"
  ).length;

  return Math.round((completedStages / nodes.length) * 100);
}

// ==================== 状态转换 ====================

export const NODE_VALID_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  PENDING: ["WAITING", "RUNNING", "SKIPPED"],
  WAITING: ["RUNNING", "SKIPPED"],
  RUNNING: ["COMPLETED", "FAILED", "SKIPPED"],
  COMPLETED: [],
  FAILED: ["WAITING", "SKIPPED"],
  SKIPPED: ["RUNNING"],
  WAITING_USER: ["RUNNING", "SKIPPED"],
};

export function isValidNodeTransition(from: NodeStatus, to: NodeStatus): boolean {
  const allowed = NODE_VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}
