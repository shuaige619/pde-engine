import { create } from 'zustand';
import type { ChatMessage, Creation } from '@/types';

interface CreationState {
  creations: Creation[];
  currentCreation: Creation | null;
  isLoading: boolean;
  setCreations: (creations: Creation[]) => void;
  setCurrentCreation: (creation: Creation | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateCode: (code: string) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useCreationStore = create<CreationState>((set) => ({
  creations: [],
  currentCreation: null,
  isLoading: false,
  setCreations: (creations) => set({ creations }),
  setCurrentCreation: (creation) => set({ currentCreation: creation }),
  addMessage: (message) =>
    set((state) => ({
      currentCreation: state.currentCreation
        ? { ...state.currentCreation, messages: [...state.currentCreation.messages, message] }
        : null,
    })),
  updateCode: (code) =>
    set((state) => ({
      currentCreation: state.currentCreation ? { ...state.currentCreation, code } : null,
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
