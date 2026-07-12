/**
 * LocalStorage əsaslı data store — mock backend rolunu oynayır.
 * Real backend hazır olduqda bu funksiyalar API çağırışları ilə əvəzlənəcək
 * (hər funksiyanın üzərində uyğun endpoint qeyd olunub — bax BACKEND_GUIDE.md).
 */
import { MOCK_SHIFTS, MOCK_VOLUNTEERS } from "./mockData";
import { Shift, Volunteer } from "./types";

const VOL_KEY = "dost_volunteers_v1";
const SHIFT_KEY = "dost_shifts_v1";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Könüllülər (API: GET/POST/PUT/DELETE /api/volunteers) ----

export function getVolunteers(): Volunteer[] {
  const v = load<Volunteer[] | null>(VOL_KEY, null);
  if (!v) {
    save(VOL_KEY, MOCK_VOLUNTEERS);
    return MOCK_VOLUNTEERS;
  }
  return v;
}

export function saveVolunteers(vols: Volunteer[]) {
  save(VOL_KEY, vols);
}

export function addVolunteer(v: Volunteer) {
  const all = getVolunteers();
  saveVolunteers([...all, v]);
}

export function updateVolunteer(v: Volunteer) {
  const all = getVolunteers().map((x) => (x.id === v.id ? v : x));
  saveVolunteers(all);
}

/** Soft delete — arxiv məlumatları qorunur (SRS bölmə 11) */
export function deactivateVolunteer(id: string) {
  const all = getVolunteers().map((x) => (x.id === id ? { ...x, active: false } : x));
  saveVolunteers(all);
}

// ---- Növbələr / Arxiv (API: GET/POST /api/shifts) ----

export function getShifts(): Shift[] {
  const s = load<Shift[] | null>(SHIFT_KEY, null);
  if (!s) {
    save(SHIFT_KEY, MOCK_SHIFTS);
    return MOCK_SHIFTS;
  }
  return s;
}

export function saveShift(shift: Shift) {
  const all = getShifts().filter((s) => s.id !== shift.id);
  save(SHIFT_KEY, [shift, ...all]);
}

export function getShiftById(id: string): Shift | undefined {
  return getShifts().find((s) => s.id === id);
}

export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

