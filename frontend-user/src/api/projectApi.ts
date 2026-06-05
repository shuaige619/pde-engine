import client from './client';
import type { Project, CreateProjectInput, PipelineInstance, PaginatedResult, QueryParams } from '@/types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

const normalizeProject = (project: Project): Project => ({
  ...project,
  progress: project.progress ?? project.pipeline?.progress ?? 0,
});

export const projectApi = {
  getProjects: async (p?: QueryParams): Promise<PaginatedResult<Project>> => {
    const response = await client.get<unknown, ApiResponse<Project[]>>('/projects', { params: p });
    const items = response.data.map(normalizeProject);
    return {
      items,
      total: response.meta?.total ?? items.length,
      page: response.meta?.page ?? 1,
      pageSize: response.meta?.limit ?? items.length,
      totalPages: response.meta?.totalPages ?? 1,
    };
  },
  getProject: async (id: string): Promise<Project> => {
    const response = await client.get<unknown, ApiResponse<Project>>(`/projects/${id}`);
    return normalizeProject(response.data);
  },
  createProject: async (d: CreateProjectInput): Promise<Project> => {
    const response = await client.post<unknown, ApiResponse<Project>>('/projects', d);
    return normalizeProject(response.data);
  },
  deleteProject: (id: string): Promise<void> => client.delete(`/projects/${id}`),
  startPipeline: async (pid: string): Promise<PipelineInstance> => {
    const response = await client.post<unknown, ApiResponse<PipelineInstance>>(`/projects/${pid}/pipeline/start`);
    return response.data;
  },
  pausePipeline: (pid: string): Promise<void> => client.post(`/projects/${pid}/pipeline/pause`),
  getPipeline: async (pid: string): Promise<PipelineInstance | null> => {
    try {
      const response = await client.get<unknown, ApiResponse<PipelineInstance>>(`/pipelines/project/${pid}`);
      return response.data;
    } catch {
      return null;
    }
  },
};
