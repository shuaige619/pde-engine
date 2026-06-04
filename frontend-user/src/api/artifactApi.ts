import client from './client';
import type { Artifact } from '@/types';
export const artifactApi = {
  getArtifacts: (pid: string): Promise<Artifact[]> => client.get(`/projects/${pid}/artifacts`),
};
