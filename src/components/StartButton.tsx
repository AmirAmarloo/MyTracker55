import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { TimeEntry, ConnectionStatus } from '../types/TimeEntry';
import { createLocalStartEntry } from '../helpers/entryHelper';

// External Dependencies طبق SRS
import { checkPreviousDayOverLimit } from "../utils/legalChecks";
import { useTimeStore } from "../state/useTimeStore";
import { TimeEntryAPI } from "../api/TimeEntryAPI";
import { pushToLocalQueue } from "../storage/localQueue";

interface StartButtonProps {
  projectId: string | null;
  isProjectRequired: boolean;
  connectionStatus: ConnectionStatus;
  activeEntry: TimeEntry | null;
  onStartSuccess: (entry: TimeEntry) => void;
}

export const StartButton: React.FC<StartButtonProps> = ({
  projectId,
  isProjectRequired,
  connectionStatus,
  activeEntry,
  onStartSuccess,
}) => {
  // دسترسی به اکشن‌های Zustand
  const setActiveEntry = useTimeStore((state) => state.setActiveEntry);

  const handlePress = async () => {
    // ۱. بررسی فعال بودن یک تایمر دیگر (Duplicate Start Prevention)
    if (activeEntry) return;

    // ۲. بررسی انتخاب پروژه در صورت اجباری بودن
    if (isProjectRequired && !projectId) {
      Alert.alert("Validation Error", "Please select a project before starting.");
      return;
    }

    // ۳. بررسی قوانین کار آلمان (Legal Check)
    // استفاده از helper برای بررسی اینکه آیا روز قبل بیش از حد مجاز کار شده یا خیر
    const isOverLimit = await checkPreviousDayOverLimit();
    if (isOverLimit) {
      // نمایش Alert غیرمسدودکننده (Non-blocking)
      // کاربر باید تایید کند (Acknowledgment) اما مانع شروع کار نمی‌شود.
      Alert.alert(
        "Arbeitszeit-Warnung", // هشدار زمان کار
        "You exceeded the legal daily limit yesterday. Please ensure you comply with mandatory rest periods.",
        [{ text: "OK", onPress: () => initiateStart() }]
      );
    } else {
      initiateStart();
    }
  };

  const initiateStart = async () => {
    const newEntry = createLocalStartEntry(projectId);

    try {
      if (connectionStatus === 'online') {
        // تلاش برای ثبت در سرور
        const response = await TimeEntryAPI.start(newEntry);
        // جایگزینی اطلاعات محلی با اطلاعات تایید شده سرور (در صورت نیاز)
        processFinalization(response.data);
      } else {
        // مدیریت حالت آفلاین
        handleOfflineFlow(newEntry);
      }
    } catch (error) {
      // در صورت خطای غیرمنتظره شبکه، به حالت آفلاین سوئیچ می‌کنیم
      console.warn("API Error, falling back to local queue", error);
      handleOfflineFlow(newEntry);
    }
  };

  const handleOfflineFlow = (entry: TimeEntry) => {
    // ذخیره در LocalQueue (MMKV) برای همگام‌سازی آینده
    pushToLocalQueue({
      id: entry.id,
      action: 'START',
      payload: entry,
      timestamp: Date.now(),
    });
    processFinalization(entry);
  };

  const processFinalization = (entry: TimeEntry) => {
    // بروزرسانی Global State (Zustand)
    setActiveEntry(entry);
    // فراخوانی callback خروجی
    onStartSuccess(entry);
  };

  return (
    <Toucha bleOpacity
      onPress={handlePress}
      disabled={!!activeEntry}
      style={{
        padding: 15,
        backgroundColor: activeEntry ? '#ccc' : '#007AFF',
        alignItems: 'center',
        borderRadius: 8,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>
        {activeEntry ? 'Tracking Active' : 'Start Working'}
      </Text>
    </TouchableOpacity>
    
  );
  
};
export default StartButton;