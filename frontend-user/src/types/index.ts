export interface User {
  id: string; email: string; name: string; role: string; status: string; createdAt: string;
}
export type ProjectStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'FAILED' | 'COMPLETED' | 'PENDING_ACCEPTANCE' | 'ACCEPTED' | 'ARCHIVED';
export type Platform = 'WEB' | 'APP' | 'UNIAPP' | 'CHROME_EXTENSION' | 'BACKEND_API';
export interface Project {
  id: string; name: string; description?: string; status: ProjectStatus;
  currentStage?: string; platform: Platform; codeSource: 'TEMPLATE' | 'GIT';
  progress: number; createdAt: string; updatedAt: string;
  pipeline?: PipelineInstance | null; _count?: { artifacts: number };
}
export interface CreateProjectInput {
  name: string; description?: string; platform: Platform; codeSource: 'TEMPLATE' | 'GIT';
  gitUrl?: string; figmaUrl?: string; testMode?: 'LOCAL' | 'BROWSER' | 'UPLOAD';
}
export interface PipelineInstance {
  id: string; projectId: string; status: string; currentNode: string | null;
  progress: number; stages?: Stage[]; nodes?: NodeExecution[];
}
export interface Stage { id: string; name: string; order: number; status: string; }
export interface NodeExecution {
  id: string; name: string; status: string; logs?: string;
  startedAt?: string; completedAt?: string; retryCount: number;
}
export interface Artifact {
  id: string; name: string; type: string; stage: string;
  version: number; isMarked: boolean; createdAt: string;
}
export type CreationType = 'website' | 'app' | 'miniapp' | 'extension' | 'landing';
export type CreationStatus = 'designing' | 'developing' | 'preview' | 'published';
export interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string; createdAt?: string; timestamp?: string;
}
export interface Creation {
  id: string; name: string; description: string; type: CreationType; status: CreationStatus;
  figmaUrl?: string | null; figmaFileKey?: string | null; previewUrl?: string | null;
  code?: string | null; thumbnail?: string | null; messages: ChatMessage[];
  createdAt: string; updatedAt: string;
}
export interface PaginatedResult<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number; }
export interface QueryParams { page?: number; pageSize?: number; search?: string; status?: string; }
