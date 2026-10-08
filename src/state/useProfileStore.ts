import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'admin' | 'employee';

interface ProfileState {
  clientName: string | null;
  tenantSchema: string | null;
  authToken: string | null;
  role: UserRole;
  profileStatus: 'inactive' | 'active'; // فیلد وضعیت
  setActivationProfile: (data: { clientName: string; tenantSchema: string; authToken: string; role?: UserRole; }) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      clientName: null,
      tenantSchema: null,
      authToken: null,
      role: 'employee',
      profileStatus: 'inactive',
      setActivationProfile: (data) =>
        set({
          clientName: data.clientName,
          tenantSchema: data.tenantSchema,
          authToken: data.authToken,
          role: data.role || 'employee',
          profileStatus: 'active', // ✅ فعال‌سازی سوییچ شرط در App.tsx
        }),
      clearProfile: () =>
        set({ 
          clientName: null, 
          tenantSchema: null, 
          authToken: null,
          role: 'employee',
          profileStatus: 'inactive' // ✅ بازگشت به حالت اسکن
        }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);