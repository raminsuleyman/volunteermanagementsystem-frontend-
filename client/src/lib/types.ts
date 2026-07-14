/**
 * DOST Növbə İdarəetmə Sistemi — Tip Tərifləri
 * Dizayn: Civic Digital (bax: ideas.md)
 * Bu tiplər gələcək backend inteqrasiyası üçün API kontraktı ilə uyğundur
 * (bax: BACKEND_GUIDE.md)
 */

export type ShiftType = "seher" | "gunorta" | "axsam";

export interface ShiftTypeInfo {
  id: ShiftType;
  label: string;
  start: string; // "09:00"
  end: string; // "12:00"
  color: string; // tailwind rəng açarı
}

export const SHIFT_TYPES: ShiftTypeInfo[] = [
  { id: "seher", label: "Səhər", start: "09:00", end: "12:00", color: "amber" },
  { id: "gunorta", label: "Günorta", start: "12:00", end: "15:00", color: "orange" },
  { id: "axsam", label: "Axşam", start: "15:00", end: "18:00", color: "indigo" },
];

// Xidmət sahələri (SRS bölmə 6)
export const SERVICE_AREAS = [
  { id: "sorgu", name: "Sorğu" },
  { id: "aparat", name: "Aparat" },
  { id: "esas-giris", name: "Əsas giriş" },
  { id: "ozunexidmet", name: "Özünəxidmət" },
  { id: "zal-1", name: "1-ci zal" },
  { id: "zal-2-sima", name: "2-ci zal / SİMA" },
  { id: "mertebe-2", name: "2-ci mərtəbə" },
  { id: "konullu-masasi", name: "Könüllü masası" },
] as const;

export type AreaId = (typeof SERVICE_AREAS)[number]["id"];

export interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  shifts: ShiftType[]; // xidmət göstərdiyi növbə(lər)
  clubCount: number; // klubda iştirak sayı
  initiativeCount: number; // təşəbbüsdə iştirak sayı
  remainingLeaveHours: number; // qalan icazə saatı
  active: boolean;
}

export interface TimeSlot {
  id: string;
  start: string; // "09:00"
  end: string; // "09:30"
}

// Bir zaman intervalında sahə -> könüllü id-ləri
export type SlotAssignments = Record<string, string[]>; // areaId -> volunteerId[]

export interface ShiftNotes {
  gelmeyenler: string;
  icazeliler: string;
  gecikenler: string;
  evezeGelenler: string;
  evezeGedenler: string;
  digerNovbedenGelenler: string;
  klubaGedenler: string;
  tesebbus: string;
  digerNovbeyeGedenler: string;
}

export const EMPTY_NOTES: ShiftNotes = {
  gelmeyenler: "",
  icazeliler: "",
  gecikenler: "",
  evezeGelenler: "",
  evezeGedenler: "",
  digerNovbedenGelenler: "",
  klubaGedenler: "",
  tesebbus: "",
  digerNovbeyeGedenler: "",
};

export const NOTE_LABELS: { key: keyof ShiftNotes; label: string }[] = [
  { key: "gelmeyenler", label: "Gəlməyənlər" },
  { key: "icazeliler", label: "İcazəlilər" },
  { key: "gecikenler", label: "Gecikənlər" },
  { key: "evezeGelenler", label: "Əvəzə gələnlər" },
  { key: "evezeGedenler", label: "Əvəzə gedənlər" },
  { key: "digerNovbedenGelenler", label: "Digər növbədən gələnlər" },
  { key: "klubaGedenler", label: "Kluba gedənlər" },
  { key: "tesebbus", label: "Təşəbbüs" },
  { key: "digerNovbeyeGedenler", label: "Digər növbəyə gedənlər" },
];

export interface Shift {
  id: string;
  date: string; // ISO "2026-07-12"
  shiftType: ShiftType;
  teamLeaderFirstName: string;
  teamLeaderLastName: string;
  volunteerIds: string[]; // növbəyə əlavə edilmiş könüllülər
  // slotId -> (areaId -> volunteerId[])
  assignments: Record<string, SlotAssignments>;
  notes: ShiftNotes;
  savedAt: string; // ISO datetime
  status?: "draft" | "completed";
}

/** Növbə tipinə görə 6 x 30 dəqiqəlik zaman intervalı yaradır (SRS bölmə 4, addım 4) */
export function generateTimeSlots(shiftType: ShiftType): TimeSlot[] {
  const info = SHIFT_TYPES.find((s) => s.id === shiftType)!;
  const [h] = info.start.split(":").map(Number);
  const slots: TimeSlot[] = [];
  for (let i = 0; i < 6; i++) {
    const startMin = h * 60 + i * 30;
    const endMin = startMin + 30;
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    slots.push({ id: `slot-${i}`, start: fmt(startMin), end: fmt(endMin) });
  }
  return slots;
}

export function shiftTypeInfo(t: ShiftType): ShiftTypeInfo {
  return SHIFT_TYPES.find((s) => s.id === t)!;
}
