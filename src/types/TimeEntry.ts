// types/TimeEntry.ts

export type ConnectionStatus = "online" | "offline" | "pendingSync";

export interface TimeEntry {
  id: string; // UUID for local, DB-ID for remote
  projectId: string | null;
  startTime: string; // ISO 8601
  endTime?: string;
  isOffline: boolean;
  status: 'active' | 'completed';
}

export interface SyncAction {
  id: string;
  action: 'START';
  payload: TimeEntry;
  timestamp: number;
}