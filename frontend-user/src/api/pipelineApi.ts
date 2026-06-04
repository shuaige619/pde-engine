import client from './client';
import type { NodeExecution } from '@/types';
export const pipelineApi = {
  getNodes: (pid: string): Promise<NodeExecution[]> => client.get(`/pipelines/${pid}/nodes`),
  retryNode: (pid: string, nid: string): Promise<void> => client.post(`/pipelines/${pid}/nodes/${nid}/retry`),
};
