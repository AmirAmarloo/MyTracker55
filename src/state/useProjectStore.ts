import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Project {
  id: string;
  name: string;
  clientName: string; // ✅ نام صحیح فیلد
}

export interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  syncProjectsFromQR: (qrData: any) => void; 
  selectProject: (project: Project) => void;
  clearSelection: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      selectedProject: null,
      loading: false,
      syncProjectsFromQR: (qrData: any) => {
        if (qrData && qrData.projects) {
          const formatted = qrData.projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            // ✅ مطابقت دقیق با کلید موجود در JSON شما
            clientName: p.clientName || p.companyName || "No Client" 
          }));
          
          set({ projects: formatted, loading: false });
          console.log("✅ Store Updated with:", formatted);
        }
      },
      selectProject: (project) => set({ selectedProject: project }),
      clearSelection: () => set({ projects: [], selectedProject: null }),
    }),
    {
      name: 'project-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);