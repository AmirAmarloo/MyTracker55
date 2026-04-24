import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useProfileStore } from './useProfileStore';

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  startTime: number;
  endTime?: number | null;
  duration?: number; // Minutes (Rounded)
  synced: boolean;   // برای مراحل آینده Sync
  userId: string | null;
}

interface TimeState {
  activeEntry: TimeEntry | null;
  entries: TimeEntry[];
  startEntry: (projectId: string, projectName: string, company: string) => void;
  stopActiveEntry: () => void;
  clearAllEntries: () => void;
}


export const useTimeStore = create<TimeState>()(
  
  persist(
    (set) => ({
      activeEntry: null,
      entries: [],

   
      startEntry: (id: string, name: string, company: string) => {
        const newEntry = {
          id: Date.now().toString(),
          projectId: id, // در این نسخه ساده، از نام پروژه به عنوان شناسه استفاده می‌کنیم
          projectName: name,
          clientName: company,
          startTime: Date.now(),
          endTime: null,
          duration: 0,
          synced: false,
          userId: useProfileStore.getState().userId,
        };
        set({ activeEntry: newEntry });
      },
      
      stopActiveEntry: () => set((state) => {
        if (!state.activeEntry) return state;

        const endTime = Date.now();
        const diffInMs = endTime - state.activeEntry.startTime;
        
        const totalMinutes = Math.floor(diffInMs / 60000);

        const completedEntry = {
          ...state.activeEntry,
          endTime,
          duration: totalMinutes, 
          synced: false,
        };

        return {
          activeEntry: null,
          entries: [completedEntry, ...state.entries],
        };
      }),

      clearAllEntries: () => set({ entries: [], activeEntry: null }),

    }),
    {
      name: 'time-entries-storage', // نام کلید در حافظه گوشی
      storage: createJSONStorage(() => AsyncStorage),

    }
  )
);