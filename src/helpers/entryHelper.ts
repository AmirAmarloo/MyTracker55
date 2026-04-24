// helpers/entryHelper.ts
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { TimeEntry } from '../types/TimeEntry';

/**
 * ایجاد یک شیء TimeEntry اولیه برای شروع عملیات.
 * استفاده از UUID برای اطمینان از یکتا بودن در حالت آفلاین.
 */
export const createLocalStartEntry = (projectId: string | null): TimeEntry => {
  return {
    id: uuidv4(),
    projectId,
    startTime: new Date().toISOString(),
    isOffline: true,
    status: 'active',
  };
};