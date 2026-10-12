import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useProfileStore } from './useProfileStore';
import { API_BASE_URL } from '../utils/config';


export interface BreakEntry {
  id: string;
  startTime: number;
  endTime?: number | null;
  duration?: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  startTime: number;
  endTime?: number | null;
  duration?: number;
  breaks?: BreakEntry[];
  totalBreakDuration?: number;
  synced: boolean;
  userId: string | null;
}

interface TimeState {
  activeEntry: TimeEntry | null;
  activeBreak: BreakEntry | null;
  entries: TimeEntry[];
  startEntry: (projectId: string, projectName: string, company: string) => void;
  pauseEntry: () => void;
  resumeEntry: () => void;
  stopActiveEntry: () => Promise<void>;
  clearAllEntries: () => void;
  syncWithBackend: () => Promise<void>;
}

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      activeEntry: null,
      activeBreak: null,
      entries: [],

      startEntry: (projectId: string, projectName: string, company: string) => {
        const newEntry: TimeEntry = {
          id: uuidv4(),
          projectId,
          projectName,
          clientName: company,
          startTime: Date.now(),
          endTime: null,
          duration: 0,
          breaks: [],
          totalBreakDuration: 0,
          synced: false,
          userId: null,
        };
        set({ activeEntry: newEntry, activeBreak: null });
      },

      pauseEntry: () => {
        const { activeEntry, activeBreak } = get();
        if (!activeEntry || activeBreak) return;

        const newBreak: BreakEntry = {
          id: uuidv4(),
          startTime: Date.now(),
          endTime: null,
          duration: 0,
        };

        set({ activeBreak: newBreak });
      },

      resumeEntry: () => {
        const { activeEntry, activeBreak } = get();
        if (!activeEntry || !activeBreak) return;

        const endTime = Date.now();
        const breakDurationMinutes = Math.round((endTime - activeBreak.startTime) / (1000 * 60));
        const validDuration = breakDurationMinutes > 0 ? breakDurationMinutes : 1;

        const completedBreak: BreakEntry = {
          ...activeBreak,
          endTime,
          duration: breakDurationMinutes > 0 ? breakDurationMinutes : 1,
        };

        const existingBreaks = activeEntry.breaks || [];
        const updatedBreaks = [...existingBreaks, completedBreak];
        const newTotalBreakDuration = (activeEntry.totalBreakDuration || 0) + validDuration;
        //const newTotalBreakDuration = (activeEntry.totalBreakDuration || 0) + completedBreak.duration;

        set({
          activeEntry: {
            ...activeEntry,
            breaks: updatedBreaks,
            totalBreakDuration: newTotalBreakDuration,
          },
          activeBreak: null,
        });
      },

      stopActiveEntry: async () => {
        const { activeEntry, activeBreak, entries, resumeEntry, syncWithBackend } = get();
        if (!activeEntry) return;

        if (activeBreak) {
          resumeEntry();
        }

        const latestState = get();
        const currentActive = latestState.activeEntry;
        if (!currentActive) return;

        const endTime = Date.now();
        const rawDurationMinutes = Math.round((endTime - currentActive.startTime) / (1000 * 60));
        const netDurationMinutes = Math.max(0, rawDurationMinutes - (currentActive.totalBreakDuration || 0));

        const completedEntry: TimeEntry = {
          ...currentActive,
          endTime,
          duration: netDurationMinutes > 0 ? netDurationMinutes : 1,
        };

        set({
          activeEntry: null,
          activeBreak: null,
          entries: [completedEntry, ...entries],
        });

        // سینک خودکار بلافاصله پس از ثبت
        await syncWithBackend();
      },

      clearAllEntries: () => set({ entries: [], activeEntry: null, activeBreak: null }),

      syncWithBackend: async () => {
        const { tenantSchema } = useProfileStore.getState();
        const unSyncedEntries = get().entries.filter((e) => !e.synced);

        if (unSyncedEntries.length === 0 || !tenantSchema) return;

        try {
          const response = await fetch(API_BASE_URL + '/time-entries/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tenantSchema: tenantSchema,
              entries: unSyncedEntries,
            }),
          });

          if (response.ok) {
            set((state) => ({
              entries: state.entries.map((entry) => ({
                ...entry,
                synced: true,
              })),
            }));
          }
        } catch (error) {
          console.log('Background Sync Warning (Will retry later):', error);
        }
      },
    }),
    {
      name: 'time-entries-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);