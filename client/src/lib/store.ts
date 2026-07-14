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

export async function getShifts(status?: "draft" | "completed"): Promise<Shift[]> {
  try {
    const url = status ? `/shifts?status=${status}` : "/shifts";
    const res = await api.get<ApiResponse<Shift[]>>(url);
    if (res.data.success && res.data.data) {
      return res.data.data.map((s: any) => ({ 
        ...s, 
        id: String(s.id),
        volunteerIds: s.volunteerIds?.map(String) || [] 
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch shifts:", error);
    return [];
  }
}

export async function getShiftById(id: string): Promise<Shift | undefined> {
  try {
    const res = await api.get<ApiResponse<any>>(`/shifts/${id}`);
    if (res.data.success && res.data.data) {
      const data = res.data.data;
      return { 
        ...data, 
        id: String(data.id),
        volunteerIds: data.volunteerIds?.map(String) || [],
        assignments: data.assignments ? Object.fromEntries(
          Object.entries(data.assignments).map(([slotKey, areas]) => [
            slotKey,
            Object.fromEntries(
              Object.entries(areas as Record<string, number[]>).map(([areaKey, ids]) => [areaKey, ids.map(String)])
            )
          ])
        ) : {}
      } as Shift;
    }
    return undefined;
  } catch (error) {
    console.error("Failed to fetch shift:", error);
    return undefined;
  }
}

export async function saveShift(shift: Partial<Shift>, status: "draft" | "completed" = "completed"): Promise<any> {
  try {
    const payload = {
      ...shift,
      status: shift.status || status,
      volunteerIds: shift.volunteerIds?.map(Number),
      assignments: shift.assignments ? Object.fromEntries(
        Object.entries(shift.assignments).map(([slotKey, areas]) => [
          slotKey,
          Object.fromEntries(
            Object.entries(areas).map(([areaKey, ids]) => [areaKey, ids.map(Number)])
          )
        ])
      ) : {}
    };
    if (shift.id && !shift.id.startsWith("shift-preview") && !shift.id.startsWith("shift-")) {
      // Mövcud sətir varsa (və genId deyilsə) PUT
      const res = await api.put<ApiResponse<any>>(`/shifts/${shift.id}`, payload);
      return res.data.data;
    } else {
      const res = await api.post<ApiResponse<any>>("/shifts", payload);
      return res.data.data;
    }
  } catch (error: any) {
    console.error("Failed to save shift:", error.response?.data || error.message);
    throw error;
  }
}

export async function saveDraft(shift: Partial<Shift>): Promise<Shift> {
  const res = await saveShift(shift, "draft");
  return {
    ...res,
    id: String(res.id),
    volunteerIds: res.volunteerIds?.map(String) || [],
  } as Shift;
}

export async function deleteShift(id: string): Promise<void> {
  try {
    await api.delete<ApiResponse<any>>(`/shifts/${id}`);
  } catch (error) {
    console.error("Failed to delete shift:", error);
    throw error;
  }
}

// Keep genId just in case some local state still needs it temporarily,
// though mostly backend handles IDs now.
export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
