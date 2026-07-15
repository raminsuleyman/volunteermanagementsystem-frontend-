import { TimeSlot, Volunteer, SlotAssignments } from "./types";

export const MIN_SAME_AREA_GAP_MINUTES = 150;

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function autoAssignShift(
  slots: TimeSlot[],
  selectedAreaIds: string[],
  volunteers: Volunteer[],
  existingAssignments: Record<string, SlotAssignments>
): { assignments: Record<string, SlotAssignments>; filledCount: number; unfilledCount: number } {
  // Dərin kopya (deep copy) - mövcud state-i dəyişməmək üçün
  const assignments: Record<string, SlotAssignments> = {};
  for (const slotId in existingAssignments) {
    assignments[slotId] = {};
    for (const areaId in existingAssignments[slotId]) {
      assignments[slotId][areaId] = [...existingAssignments[slotId][areaId]];
    }
  }

  let filledCount = 0;
  let unfilledCount = 0;

  // Hər könüllünün müəyyən bir sahəyə sonuncu dəfə nə vaxt təyin edildiyini izləyirik (dəqiqə ilə)
  // volId -> { areaId -> startTimeInMinutes }
  const lastAreaAssignment: Record<string, Record<string, number>> = {};

  // Hər könüllünün ümumi təyin edildiyi slot sayını izləyirik (iş yükünü bərabərləşdirmək üçün)
  // volId -> count
  const volunteerAssignmentCount: Record<string, number> = {};

  // Mövcud təyinatlar əsasında izləmə məlumatlarını ilkinləşdiririk
  slots.forEach(slot => {
    const slotStartTime = timeToMinutes(slot.start);
    const slotAssigns = assignments[slot.id] || {};
    Object.keys(slotAssigns).forEach(areaId => {
      slotAssigns[areaId].forEach(volId => {
        if (!lastAreaAssignment[volId]) lastAreaAssignment[volId] = {};
        lastAreaAssignment[volId][areaId] = slotStartTime;
        volunteerAssignmentCount[volId] = (volunteerAssignmentCount[volId] || 0) + 1;
      });
    });
  });

  // Slotları xronoloji sırayla gəzirik
  for (const slot of slots) {
    const slotId = slot.id;
    if (!assignments[slotId]) assignments[slotId] = {};
    const currentSlotStartTime = timeToMinutes(slot.start);

    for (const areaId of selectedAreaIds) {
      if (!assignments[slotId][areaId]) {
        assignments[slotId][areaId] = [];
      }

      // Əgər bu sahə bu slotda artıq doludursa, keç
      if (assignments[slotId][areaId].length > 0) {
        continue;
      }

      // Namizədləri tapırıq
      const candidates = volunteers.filter(vol => {
        // Şərt 1: Bu slotda başqa heç bir sahəyə təyin edilməyib
        const isAssignedInThisSlot = Object.values(assignments[slotId]).some(volsInArea => volsInArea.includes(vol.id));
        if (isAssignedInThisSlot) return false;

        // Şərt 2: Eyni sahə üçün minimum 2.5 saat (150 dəq) qaydası
        if (lastAreaAssignment[vol.id] && lastAreaAssignment[vol.id][areaId] !== undefined) {
          const lastTime = lastAreaAssignment[vol.id][areaId];
          if (currentSlotStartTime - lastTime < MIN_SAME_AREA_GAP_MINUTES) {
            return false;
          }
        }
        return true;
      });

      if (candidates.length > 0) {
        // Namizədləri ən az işləyəndən çoxa doğru sırala, bərabərlik varsa təsadüfi seç
        candidates.sort((a, b) => {
          const countA = volunteerAssignmentCount[a.id] || 0;
          const countB = volunteerAssignmentCount[b.id] || 0;
          if (countA !== countB) return countA - countB;
          return Math.random() - 0.5;
        });

        const selectedVol = candidates[0];
        assignments[slotId][areaId].push(selectedVol.id);
        
        // İzləmə məlumatlarını yenilə
        if (!lastAreaAssignment[selectedVol.id]) lastAreaAssignment[selectedVol.id] = {};
        lastAreaAssignment[selectedVol.id][areaId] = currentSlotStartTime;
        volunteerAssignmentCount[selectedVol.id] = (volunteerAssignmentCount[selectedVol.id] || 0) + 1;
        
        filledCount++;
      } else {
        unfilledCount++;
      }
    }
  }

  return { assignments, filledCount, unfilledCount };
}
