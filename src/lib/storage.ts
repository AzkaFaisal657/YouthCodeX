import type { Profile } from "../types";

const KEY = "tether_profile_v1";
const TASK_HISTORY_KEY = "tether_task_history_v1";

export function getProfile(): Profile | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Profile;
  } catch {
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
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function addTask(task: string): boolean {
  const history = getTaskHistory();
  const normalized = normalizeTask(task);
  const isShameSpiralTask = history.some((prev) => {
    const n = normalizeTask(prev);
    return n === normalized || n.includes(normalized) || normalized.includes(n);
  });
  const updated = [task, ...history].slice(0, 20);
  localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(updated));
  return isShameSpiralTask;
}