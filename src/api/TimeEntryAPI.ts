// src/api/TimeEntryAPI.ts

import { TimeEntry } from "../types/TimeEntry";

export const TimeEntryAPI = {
  start: async (entry: TimeEntry) => {
    // Stub version — simulate server response
    return {
      data: {
        ...entry,
        serverConfirmed: true,
      },
    };
  },
};