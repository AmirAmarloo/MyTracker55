// src/storage/localQueue.ts

interface QueueItem {
  id: string;
  action: string;
  payload: any;
  timestamp: number;
}

export function pushToLocalQueue(item: QueueItem) {
  // Stub version — no real storage yet
  console.log("Pushed to local queue (stub):", item);
}