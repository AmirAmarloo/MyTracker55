import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileState {
  userId: string | null;
  companyId: string | null;
  allowedProjects: string[];
  userName: string | null;
  clientName: string | null;
  profileStatus: "inactive" | "active";

  activateProfile: (data: {
    userId: string;
    companyId: string;
    allowedProjects: string[];
    userName: string;
    clientName: string;
  }) => void;

  

  resetProfile: () => void;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
}

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  // این تابع دیتای کامل اسکن شده را می‌گیرد
  fetchProjects: (qrData: any) => void; 
  selectProject: (project: Project) => void;
  clearSelection: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      // Default State
      userId: null,
      companyId: null,
      allowedProjects: [],
      userName: null,
      clientName: null,
      profileStatus: "inactive",

      // Actions
      activateProfile: (data) => set({
        userId: data.userId,
        companyId: data.companyId,
        allowedProjects: data.allowedProjects,
        userName: data.userName,
        clientName: data.clientName,
        profileStatus: "active",
      }),

      resetProfile: () => set({
        userId: null,
        companyId: null,
        allowedProjects: [],
        userName: null,
        clientName: null,
        profileStatus: "inactive",
      }),
    }),
    {
      name: 'profile-storage', // کلید ذخیره‌سازی در AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

