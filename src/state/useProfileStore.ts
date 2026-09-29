import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileState {
  clientName: string | null;
  tenantSchema: string | null;
  authToken: string | null;
  profileStatus: 'inactive' | 'active'; // فیلد وضعیت
  setActivationProfile: (data: { clientName: string; tenantSchema: string; authToken: string }) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      clientName: null,
      tenantSchema: null,
      authToken: null,
      profileStatus: 'inactive',
      setActivationProfile: (data) =>
        set({
          clientName: data.clientName,
          tenantSchema: data.tenantSchema,
          authToken: data.authToken,
          profileStatus: 'active', // ✅ فعال‌سازی سوییچ شرط در App.tsx
        }),
      clearProfile: () =>
        set({ 
          clientName: null, 
          tenantSchema: null, 
          authToken: null, 
          profileStatus: 'inactive' // ✅ بازگشت به حالت اسکن
        }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);