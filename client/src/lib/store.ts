import axios from "axios";
import { Shift, Volunteer } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "https://volunteermanagementsystem-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
}

// ---- Könüllülər (API: GET/POST/PUT/DELETE /api/volunteers) ----

export async function getVolunteers(): Promise<Volunteer[]> {
  try {
    const res = await api.get<ApiResponse<Volunteer[]>>("/volunteers");
    if (res.data.success && res.data.data) {
      // Backend might return numeric IDs from PostgreSQL, ensure they are strings for the frontend
      return res.data.data.map((v: any) => ({ ...v, id: String(v.id) }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch volunteers:", error);
    return [];
  }
}

export async function addVolunteer(v: Omit<Volunteer, "id"> | Volunteer): Promise<void> {
  try {
    // We send without id if it's a new volunteer, backend will assign id
    await api.post<ApiResponse<Volunteer>>("/volunteers", v);
  } catch (error) {
    console.error("Failed to add volunteer:", error);
    throw error;
  }
}

export async function updateVolunteer(v: Volunteer): Promise<void> {
  try {
    await api.put<ApiResponse<Volunteer>>(`/volunteers/${v.id}`, v);
  } catch (error) {
    console.error("Failed to update volunteer:", error);
    throw error;
  }
}

/** Soft delete — arxiv məlumatları qorunur (SRS bölmə 11) */
export async function deactivateVolunteer(id: string): Promise<void> {
  try {
    await api.delete<ApiResponse<any>>(`/volunteers/${id}`);
  } catch (error) {
    console.error("Failed to deactivate volunteer:", error);
    throw error;
  }
}

// ---- Növbələr / Arxiv (API: GET/POST /api/shifts) ----

export async function getShifts(): Promise<Shift[]> {
  try {
    const res = await api.get<ApiResponse<Shift[]>>("/shifts");
    if (res.data.success && res.data.data) {
      return res.data.data.map((s: any) => ({ ...s, id: String(s.id) }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch shifts:", error);
    return [];
  }
}

export async function getShiftById(id: string): Promise<Shift | undefined> {
  try {
    const res = await api.get<ApiResponse<Shift>>(`/shifts/${id}`);
    if (res.data.success && res.data.data) {
      return { ...res.data.data, id: String(res.data.data.id) };
    }
    return undefined;
  } catch (error) {
    console.error("Failed to fetch shift:", error);
    return undefined;
  }
}

export async function saveShift(shift: Partial<Shift>): Promise<void> {
  try {
    await api.post<ApiResponse<Shift>>("/shifts", shift);
  } catch (error) {
    console.error("Failed to save shift:", error);
    throw error;
  }
}

// Keep genId just in case some local state still needs it temporarily,
// though mostly backend handles IDs now.
export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
