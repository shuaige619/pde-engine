import client from './client';
import type { Project, CreateProjectInput, PaginatedResult, QueryParams } from '@/types';
export const projectApi = {
  getProjects: (p?: QueryParams): Promise<PaginatedResult<Project>> => client.get('/projects', { params: p }),
  getProject: (id: string): Promise<Project> => client.get(`/projects/${id}`),
  createProject: (d: CreateProjectInput): Promise<Project> => client.post('/projects', d),
  deleteProject: (id: string): Promise<void> => client.delete(`/projects/${id}`),
  startPipeline: (pid: string): Promise<void> => client.post(`/projects/${pid}/start`),
  pausePipeline: (pid: string): Promise<void> => client.post(`/projects/${pid}/pause`),
};
