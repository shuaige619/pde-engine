import client from './client';
import type { NodeExecution } from '@/types';

interface ApiResponse<T> { success: boolean; data: T; }

export const pipelineApi = {
  getNodes: async (pid: string): Promise<NodeExecution[]> => {
    const response = await client.get<unknown, ApiResponse<NodeExecution[]>>(`/pipelines/${pid}/nodes`);
    return response.data;
  },
  retryNode: (_pid: string, nid: string): Promise<void> => client.post(`/pipelines/nodes/${nid}/retry`),
};
