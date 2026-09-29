import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Project {
  id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  clientName?: string;
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSelectedProject: (project: Project | null) => void;
  clearProjects: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      selectedProject: null,
      setProjects: (projects) => set({ projects }),
      setSelectedProject: (project) => set({ selectedProject: project }),
      clearProjects: () => set({ projects: [], selectedProject: null }),
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);