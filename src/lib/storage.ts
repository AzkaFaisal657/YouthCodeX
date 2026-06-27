import type { Profile } from "../types";

const KEY = "tether_profile_v1";
const TASK_HISTORY_KEY = "tether_task_history_v1";
const SESSION_RECORDS_KEY = "tether_sessions_v1";
export function getProfile(): Profile | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { 
    return JSON.parse(raw) as Profile; 
  } catch 
  { 
    return null; 
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function updateProfileNotes(notes: string) {
  const p = getProfile();
  if (!p) return;
  saveProfile({ ...p, notes });
}

export function clearProfile() {
  localStorage.removeItem(KEY);
}

function normalizeTask(task: string): string {
  return task.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}

export function getTaskHistory(): string[] {
  const raw = localStorage.getItem(TASK_HISTORY_KEY);
  if (!raw) return [];
  try { 
    return JSON.parse(raw) as string[]; } 
    catch { return []; }
}

export function addTask(task: string): { isShameSpiral: boolean; spiralCount: number } {
  const history = getTaskHistory();
  const normalized = normalizeTask(task);
  // Count consecutive leading entries that match this task
  let spiralCount = 0;
  for (const prev of history) {
    const n = normalizeTask(prev);
     if (n === normalized || n.includes(normalized) || normalized.includes(n)) {
      spiralCount++;
    } else {
      break;
    }
  }
  const updated = [task, ...history].slice(0, 30);
  localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(updated));
  return { isShameSpiral: spiralCount >= 1, spiralCount: spiralCount + 1 };
}
export interface SessionRecord {
  task: string;
  soundType: "brown" | "pink" | "binaural";
  energy: number;
  didIt: boolean;
  timestamp: number;
  hour: number;
}
export function getSessionRecords(): SessionRecord[] {
  const raw = localStorage.getItem(SESSION_RECORDS_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as SessionRecord[]; } catch { return []; }
}
export function addSessionRecord(record: SessionRecord) {
  const records = getSessionRecords();
  const updated = [record, ...records].slice(0, 50);
  localStorage.setItem(SESSION_RECORDS_KEY, JSON.stringify(updated));
}