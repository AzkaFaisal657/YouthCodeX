import type { Profile } from "../types";

const KEY = "tether_profile_v1";

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