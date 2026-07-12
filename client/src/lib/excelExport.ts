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
    const v = volunteers.find((x) => String(x.id) === String(id));
    return v ? `${v.firstName} ${v.lastName}` : "";
  };

  const info = shiftTypeInfo(shift.shiftType);
  const slots = generateTimeSlots(shift.shiftType);

  // Helper function to build a row with empty strings up to a specific length
  const makeRow = (length: number) => new Array(length).fill("");

  const rows: string[][] = [];

  // Row 0
  const row0 = makeRow(9);
  row0[0] = "Müraciət sayı:";
  row0[3] = "Könüllülərin iş qrafiki";
  row0[7] = `Tarix: ${shift.date}`;
  rows.push(row0);

  // Row 1
  const row1 = makeRow(9);
  row1[0] = `Könüllü sayı: ${shift.volunteerIds.length}`;
  rows.push(row1);

  // Row 2 (Empty)
  rows.push(makeRow(9));

  // Row 3 (Headers)
  const headers = [
    "Sorğu", 
    "Aparat", 
    "Əsas giriş", 
    "Özünəxidmət", 
    "1-ci zal", 
    "2-ci zal/SİMA", 
    "2-ci mərtəbə", 
    "Könüllü masası", 
    "Saat"
  ];
  rows.push(headers);

  // Make sure SERVICE_AREAS matches these headers.
  // SERVICE_AREAS: sorgu, aparat, esas-giris, ozunexidmet, zal-1, zal-2-sima, mertebe-2, konullu-masasi
  const areaIds = [
    "sorgu", "aparat", "esas-giris", "ozunexidmet", 
    "zal-1", "zal-2-sima", "mertebe-2", "konullu-masasi"
  ];

  // Rows 4 to 9 (Time Slots)
  for (const slot of slots) {
    const row = makeRow(9);
    for (let i = 0; i < areaIds.length; i++) {
      const ids = shift.assignments[slot.id]?.[areaIds[i]] ?? [];
      // Combine names with newline
      row[i] = ids.map(volName).filter(Boolean).join("\n");
    }
    row[8] = `${slot.start} - ${slot.end}`;
    rows.push(row);
  }

  // Row 10 (Empty)
  rows.push(makeRow(9));

  // Bottom section
  const n = shift.notes;
  const bottomLabels = [
    ["Gəlməyənlər:", n.gelmeyenler],
    ["İcazəlilər:", n.icazeliler],
    ["Gecikənlər:", n.gecikenler],
    ["Əvəzə gələnlər:", n.evezeGelenler],
    ["Əvəzə gedənlər:", n.evezeGedenler],
    ["Digər növbədən gəldi:", n.digerNovbedenGelenler],
    ["Klub, tədbirə gedənlər:", n.klubaGedenler],
    ["Təşəbbüs:", n.tesebbus],
    ["Digər növbəyə getdi:", n.digerNovbeyeGedenler]
  ];

  for (let i = 0; i < bottomLabels.length; i++) {
    const row = makeRow(9);
    if (i === 0) {
      row[0] = `Qrup rəhbəri: ${shift.teamLeaderFirstName} ${shift.teamLeaderLastName}`;
    } else if (i === 1) {
      row[0] = "Məsul Şəxs: _______________________";
    }

    row[4] = bottomLabels[i][0];
    row[5] = bottomLabels[i][1] || "";
    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  
  // Set column widths
  ws["!cols"] = [
    { wch: 18 }, // Sorğu
    { wch: 18 }, // Aparat
    { wch: 18 }, // Əsas giriş
    { wch: 18 }, // Özünəxidmət
    { wch: 18 }, // 1-ci zal
    { wch: 18 }, // 2-ci zal/SİMA
    { wch: 18 }, // 2-ci mərtəbə
    { wch: 18 }, // Könüllü masası
    { wch: 15 }, // Saat
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${info.label} ${shift.date}`);
  XLSX.writeFile(wb, `DOST_novbe_${shift.date}_${shift.shiftType}.xlsx`);
}
