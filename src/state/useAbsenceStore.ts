import { create } from 'zustand';
import { useProfileStore } from './useProfileStore';
import { API_BASE_URL } from '../utils/config';

// آدرس IP جدید و درست لپ‌تاپ شما
//const API_BASE_URL = 'http://172.20.10.12:8000'; 

export interface AbsenceItem {
  id?: string;
  absenceType: 'urlaub' | 'krankheit';
  startDate: string;
  endDate: string;
  note?: string;
  isApproved?: boolean;
}

interface AbsenceState {
  absences: AbsenceItem[];
  isLoading: boolean;
  submitAbsence: (absence: AbsenceItem) => Promise<boolean>;
  fetchAbsences: () => Promise<void>;
}

export const useAbsenceStore = create<AbsenceState>((set, get) => ({
  absences: [],
  isLoading: false,

  submitAbsence: async (absence) => {
    const { tenantSchema } = useProfileStore.getState();
    if (!tenantSchema) return false;

    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/absences/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSchema,
          userId: 'usr_default',
          ...absence,
        }),
      });

      if (response.ok) {
        await get().fetchAbsences();
        set({ isLoading: false });
        return true;
      }
    } catch (e) {
      console.error('Absence submission error:', e);
    }
    set({ isLoading: false });
    return false;
  },

  fetchAbsences: async () => {
    const { tenantSchema } = useProfileStore.getState();
    if (!tenantSchema) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/absences/list?tenantSchema=${tenantSchema}&user_id=usr_default`
      );
      if (response.ok) {
        const data = await response.json();
        set({ absences: data.absences || [] });
      }
    } catch (e) {
      console.error('Fetch absences error:', e);
    }
  },
}));