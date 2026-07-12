/**
 * Mock data — backend hazır olana qədər istifadə olunur.
 * Backend inteqrasiyası zamanı bu fayl API çağırışları ilə əvəz olunacaq
 * (bax: BACKEND_GUIDE.md, bölmə "Frontend inteqrasiya nöqtələri")
 */
import { EMPTY_NOTES, Shift, Volunteer } from "./types";

export const MOCK_VOLUNTEERS: Volunteer[] = [
  { id: "v1", firstName: "Murad", lastName: "Əliyev", shifts: ["seher"], clubCount: 5, initiativeCount: 2, remainingLeaveHours: 1, active: true },
  { id: "v2", firstName: "Leyla", lastName: "Məmmədova", shifts: ["gunorta"], clubCount: 3, initiativeCount: 0, remainingLeaveHours: 0, active: true },
  { id: "v3", firstName: "Ramin", lastName: "Süleymanlı", shifts: ["axsam"], clubCount: 7, initiativeCount: 1, remainingLeaveHours: 2, active: true },
  { id: "v4", firstName: "Günay", lastName: "Həsənova", shifts: ["seher", "gunorta"], clubCount: 4, initiativeCount: 3, remainingLeaveHours: 0, active: true },
  { id: "v5", firstName: "Solmaz", lastName: "Quliyeva", shifts: ["gunorta", "axsam"], clubCount: 2, initiativeCount: 1, remainingLeaveHours: 3, active: true },
  { id: "v6", firstName: "Şahin", lastName: "Kərimov", shifts: ["seher"], clubCount: 6, initiativeCount: 0, remainingLeaveHours: 0, active: true },
  { id: "v7", firstName: "Aysel", lastName: "İbrahimova", shifts: ["seher", "gunorta", "axsam"], clubCount: 8, initiativeCount: 4, remainingLeaveHours: 0, active: true },
  { id: "v8", firstName: "Elvin", lastName: "Rzayev", shifts: ["axsam"], clubCount: 1, initiativeCount: 0, remainingLeaveHours: 3, active: true },
  { id: "v9", firstName: "Nigar", lastName: "Abbasova", shifts: ["gunorta"], clubCount: 3, initiativeCount: 2, remainingLeaveHours: 1, active: true },
  { id: "v10", firstName: "Tural", lastName: "Nəbiyev", shifts: ["seher"], clubCount: 0, initiativeCount: 0, remainingLeaveHours: 0, active: true },
  { id: "v11", firstName: "Fidan", lastName: "Cəfərova", shifts: ["axsam"], clubCount: 5, initiativeCount: 1, remainingLeaveHours: 0, active: true },
  { id: "v12", firstName: "Kamran", lastName: "Orucov", shifts: ["gunorta"], clubCount: 2, initiativeCount: 0, remainingLeaveHours: 2, active: true },
];

export const MOCK_SHIFTS: Shift[] = [
  {
    id: "s1",
    date: "2026-07-10",
    shiftType: "seher",
    teamLeaderFirstName: "Orxan",
    teamLeaderLastName: "Vəliyev",
    volunteerIds: ["v1", "v4", "v6", "v7", "v10"],
    assignments: {
      "slot-0": { sorgu: ["v1"], aparat: ["v4"], "esas-giris": ["v6"], "zal-1": ["v7"], "konullu-masasi": ["v10"] },
      "slot-1": { sorgu: ["v4"], aparat: ["v1"], ozunexidmet: ["v6"], "zal-2-sima": ["v7"], "mertebe-2": ["v10"] },
      "slot-2": { sorgu: ["v6"], "esas-giris": ["v1"], "zal-1": ["v4"], "konullu-masasi": ["v7"], aparat: ["v10"] },
      "slot-3": { sorgu: ["v7"], aparat: ["v6"], ozunexidmet: ["v1"], "zal-2-sima": ["v4"], "esas-giris": ["v10"] },
      "slot-4": { sorgu: ["v10"], "mertebe-2": ["v6"], "zal-1": ["v1"], aparat: ["v7"], ozunexidmet: ["v4"] },
      "slot-5": { sorgu: ["v1"], "konullu-masasi": ["v4"], "esas-giris": ["v7"], "zal-2-sima": ["v6"], "zal-1": ["v10"] },
    },
    notes: {
      ...EMPTY_NOTES,
      gelmeyenler: "Yoxdur",
      gecikenler: "Tural Nəbiyev (15 dəq)",
      klubaGedenler: "Aysel İbrahimova",
    },
    savedAt: "2026-07-10T12:05:00Z",
  },
  {
    id: "s2",
    date: "2026-07-10",
    shiftType: "gunorta",
    teamLeaderFirstName: "Səbinə",
    teamLeaderLastName: "Axundova",
    volunteerIds: ["v2", "v4", "v5", "v9", "v12"],
    assignments: {
      "slot-0": { sorgu: ["v2"], aparat: ["v4"], "esas-giris": ["v5"], "zal-1": ["v9"], ozunexidmet: ["v12"] },
      "slot-1": { sorgu: ["v5"], aparat: ["v2"], "zal-2-sima": ["v4"], "konullu-masasi": ["v9"], "mertebe-2": ["v12"] },
      "slot-2": { sorgu: ["v9"], "esas-giris": ["v2"], "zal-1": ["v5"], aparat: ["v12"], ozunexidmet: ["v4"] },
      "slot-3": { sorgu: ["v12"], "zal-2-sima": ["v2"], "mertebe-2": ["v5"], "esas-giris": ["v9"], "konullu-masasi": ["v4"] },
      "slot-4": { sorgu: ["v4"], aparat: ["v5"], "zal-1": ["v2"], ozunexidmet: ["v9"], "esas-giris": ["v12"] },
      "slot-5": { sorgu: ["v2"], "konullu-masasi": ["v5"], "zal-2-sima": ["v9"], aparat: ["v4"], "zal-1": ["v12"] },
    },
    notes: {
      ...EMPTY_NOTES,
      icazeliler: "Kamran Orucov (1 saat)",
      tesebbus: "Günay Həsənova (12:00–13:00)",
    },
    savedAt: "2026-07-10T15:10:00Z",
  },
  {
    id: "s3",
    date: "2026-07-11",
    shiftType: "axsam",
    teamLeaderFirstName: "Orxan",
    teamLeaderLastName: "Vəliyev",
    volunteerIds: ["v3", "v5", "v8", "v11"],
    assignments: {
      "slot-0": { sorgu: ["v3"], aparat: ["v5"], "esas-giris": ["v8"], "zal-1": ["v11"] },
      "slot-1": { sorgu: ["v5"], "zal-2-sima": ["v3"], "konullu-masasi": ["v8"], ozunexidmet: ["v11"] },
      "slot-2": { sorgu: ["v8"], aparat: ["v3"], "mertebe-2": ["v5"], "esas-giris": ["v11"] },
      "slot-3": { sorgu: ["v11"], "zal-1": ["v3"], aparat: ["v8"], "zal-2-sima": ["v5"] },
      "slot-4": { sorgu: ["v3"], ozunexidmet: ["v5"], "esas-giris": ["v8"], "konullu-masasi": ["v11"] },
      "slot-5": { sorgu: ["v5"], "zal-1": ["v8"], aparat: ["v11"], "mertebe-2": ["v3"] },
    },
    notes: {
      ...EMPTY_NOTES,
      gelmeyenler: "Elvin Rzayev — icazə borcu 3 saat",
      evezeGelenler: "Solmaz Quliyeva",
    },
    savedAt: "2026-07-11T18:08:00Z",
  },
];
