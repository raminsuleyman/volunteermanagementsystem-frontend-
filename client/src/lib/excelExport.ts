/**
 * Excel Export — SRS bölmə 10.
 * Hazırlanan sənəd kağız formasına maksimum uyğundur:
 * sətirlər = xidmət sahələri, sütunlar = zaman intervalları.
 */
import * as XLSX from "xlsx";
import {
  NOTE_LABELS,
  SERVICE_AREAS,
  Shift,
  Volunteer,
  generateTimeSlots,
  shiftTypeInfo,
} from "./types";

export function exportShiftToExcel(shift: Shift, volunteers: Volunteer[]) {
  const volName = (id: string) => {
    const v = volunteers.find((x) => x.id === id);
    return v ? `${v.firstName} ${v.lastName}` : "—";
  };

  const info = shiftTypeInfo(shift.shiftType);
  const slots = generateTimeSlots(shift.shiftType);

  const rows: (string | undefined)[][] = [];
  rows.push(["DOST Agentliyi — Könüllü Növbə İş Bölgüsü"]);
  rows.push([]);
  rows.push(["Tarix:", shift.date]);
  rows.push(["Növbə:", `${info.label} (${info.start} – ${info.end})`]);
  rows.push(["Team Leader:", `${shift.teamLeaderFirstName} ${shift.teamLeaderLastName}`]);
  rows.push([
    "Könüllülər:",
    shift.volunteerIds.map(volName).join(", "),
  ]);
  rows.push([]);

  // Cədvəl başlığı: Xidmət sahəsi | slot1 | slot2 | ...
  rows.push(["Xidmət sahəsi", ...slots.map((s) => `${s.start}–${s.end}`)]);
  for (const area of SERVICE_AREAS) {
    const row: string[] = [area.name];
    for (const slot of slots) {
      const ids = shift.assignments[slot.id]?.[area.id] ?? [];
      row.push(ids.map(volName).join(", "));
    }
    rows.push(row);
  }

  rows.push([]);
  rows.push(["Gün Sonu Qeydləri"]);
  for (const { key, label } of NOTE_LABELS) {
    rows.push([label, shift.notes[key] || "—"]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 22 }, ...slots.map(() => ({ wch: 20 }))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${info.label} ${shift.date}`);
  XLSX.writeFile(wb, `DOST_novbe_${shift.date}_${shift.shiftType}.xlsx`);
}
