import client from './client';
import type { ChatMessage, Creation } from '@/types';

interface ApiResponse<T> { success: boolean; data: T; }

export const creationApi = {
  getCreations: async (params?: { type?: string; status?: string }): Promise<Creation[]> => {
    const response = await client.get<unknown, ApiResponse<Creation[]>>('/creations', { params });
    return response.data;
  },

  getCreation: async (id: string): Promise<Creation> => {
    const response = await client.get<unknown, ApiResponse<Creation>>(`/creations/${id}`);
    return response.data;
  },

  createFromPrompt: async (prompt: string, type: string): Promise<Creation> => {
    const response = await client.post<unknown, ApiResponse<Creation>>('/creations/from-prompt', { prompt, type });
    return response.data;
  },

  bindFigma: async (id: string, figmaUrl: string): Promise<Creation> => {
    const response = await client.post<unknown, ApiResponse<Creation>>(`/creations/${id}/figma`, { figmaUrl });
    return response.data;
  },

  sendMessage: async (id: string, content: string): Promise<{ message: ChatMessage; updatedCode?: string }> => {
    const response = await client.post<unknown, ApiResponse<{ message: ChatMessage; updatedCode?: string }>>(
      `/creations/${id}/chat`,
      { content }
    );
    return response.data;
  },

  updateCode: async (id: string, code: string): Promise<void> => {
    await client.put(`/creations/${id}/code`, { code });
  },

  getPreviewUrl: async (id: string): Promise<{ url: string }> => {
    const response = await client.get<unknown, ApiResponse<{ url: string }>>(`/creations/${id}/preview-url`);
    return response.data;
  },

  publish: async (id: string): Promise<{ url: string }> => {
    const response = await client.post<unknown, ApiResponse<{ url: string }>>(`/creations/${id}/publish`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/creations/${id}`);
  },
};
