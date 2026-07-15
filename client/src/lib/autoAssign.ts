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

    // Əvvəlcə seçilmiş bütün sahələri cari slot üçün boş massiv olaraq inisializasiya edirik (əgər yoxdursa)
    for (const areaId of selectedAreaIds) {
      if (!assignments[slotId][areaId]) {
        assignments[slotId][areaId] = [];
      }
    }

    // Bu slotda hələ heç bir sahəyə təyin edilməmiş könüllüləri tapırıq
    const unassignedVols = volunteers.filter(vol => {
      const isAssignedInThisSlot = Object.values(assignments[slotId]).some(volsInArea => volsInArea.includes(vol.id));
      return !isAssignedInThisSlot;
    });

    // Könüllüləri əvvəlki təyinat sayına görə sıralayırıq (ən az xidmət edənlər prioritetlidir)
    unassignedVols.sort((a, b) => {
      const countA = volunteerAssignmentCount[a.id] || 0;
      const countB = volunteerAssignmentCount[b.id] || 0;
      if (countA !== countB) return countA - countB;
      return Math.random() - 0.5;
    });

    for (const vol of unassignedVols) {
      // Bu könüllü üçün 2.5 saat (150 dəqiqə) qaydasını pozmayan uyğun sahələri tapırıq
      const validAreas = selectedAreaIds.filter(areaId => {
        if (lastAreaAssignment[vol.id] && lastAreaAssignment[vol.id][areaId] !== undefined) {
          const lastTime = lastAreaAssignment[vol.id][areaId];
          if (currentSlotStartTime - lastTime < MIN_SAME_AREA_GAP_MINUTES) {
            return false;
          }
        }
        return true;
      });

      if (validAreas.length > 0) {
        // Uyğun sahələr arasından bu slotda ƏN AZ könüllüsü olanı seçirik (bərabər paylanma üçün)
        validAreas.sort((a, b) => {
          const countA = assignments[slotId][a].length;
          const countB = assignments[slotId][b].length;
          if (countA !== countB) return countA - countB;
          return Math.random() - 0.5;
        });

        const selectedArea = validAreas[0];
        assignments[slotId][selectedArea].push(vol.id);
        
        // İzləmə məlumatlarını yenilə
        if (!lastAreaAssignment[vol.id]) lastAreaAssignment[vol.id] = {};
        lastAreaAssignment[vol.id][selectedArea] = currentSlotStartTime;
        volunteerAssignmentCount[vol.id] = (volunteerAssignmentCount[vol.id] || 0) + 1;
        
        filledCount++;
      } else {
        // Bu könüllü üçün bu slotda heç bir uyğun sahə tapılmadı (150 dəq qaydası mane oldu)
        unfilledCount++;
      }
    }
  }

  return { assignments, filledCount, unfilledCount };
}
