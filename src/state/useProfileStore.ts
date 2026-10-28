import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'admin' | 'employee';

interface ProfileState {
  clientName: string | null;
  tenantSchema: string | null;
  authToken: string | null;
  userId: string | null; // ✅ اضافه شدن شناسه کاربر
  role: UserRole;
  profileStatus: 'inactive' | 'active';
  setActivationProfile: (data: { clientName: string; tenantSchema: string; authToken: string; userId: string; role?: UserRole; }) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      clientName: null,
      tenantSchema: null,
      authToken: null,
      userId: null, // ✅ مقدار اولیه
      role: 'employee',
      profileStatus: 'inactive',
      setActivationProfile: (data) =>
        set({
          clientName: data.clientName,
          tenantSchema: data.tenantSchema,
          authToken: data.authToken,
          userId: data.userId, // ✅ ذخیره شناسه کاربر
          role: data.role || 'employee',
          profileStatus: 'active',
        }),
      clearProfile: () =>
        set({ 
          clientName: null, 
          tenantSchema: null, 
          authToken: null,
          userId: null,
          role: 'employee',
          profileStatus: 'inactive'
        }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);