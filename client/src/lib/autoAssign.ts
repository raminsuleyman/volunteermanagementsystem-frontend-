import { TimeSlot, Volunteer, SlotAssignments } from "./types";

export const MIN_SAME_AREA_GAP_MINUTES = 90;

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

    // Bu slotda əl ilə təyin edilmiş könüllüləri tapırıq ki, onların yerini dəyişməyək
    const manuallyAssignedVols = new Set<string>();
    for (const areaId of selectedAreaIds) {
      if (assignments[slotId][areaId]) {
        for (const volId of assignments[slotId][areaId]) {
          manuallyAssignedVols.add(volId);
        }
      }
    }

    // Bu slotda hələ heç bir sahəyə təyin edilməmiş könüllüləri tapırıq
    const unassignedVols = volunteers.filter(vol => !manuallyAssignedVols.has(vol.id));

    // Könüllüləri əvvəlki təyinat sayına görə sıralayırıq (ən az xidmət edənlər prioritetlidir)
    unassignedVols.sort((a, b) => {
      const countA = volunteerAssignmentCount[a.id] || 0;
      const countB = volunteerAssignmentCount[b.id] || 0;
      if (countA !== countB) return countA - countB;
      return Math.random() - 0.5;
    });

    const autoAssignedThisSlot = new Set<string>();

    for (const vol of unassignedVols) {
      // BFS vasitəsilə ən uyğun (ən az könüllüsü olan) sahəyə yol tapırıq (Augmenting path)
      const queue: { currentVolId: string, path: {volId: string, areaId: string}[] }[] = [];
      queue.push({ currentVolId: vol.id, path: [] });
      
      const visitedVols = new Set<string>();
      visitedVols.add(vol.id);
      const visitedAreas = new Set<string>();
      
      const reachableAreas: { areaId: string, finalSize: number, path: {volId: string, areaId: string}[] }[] = [];

      while(queue.length > 0) {
        const { currentVolId, path } = queue.shift()!;
        
        for (const areaId of selectedAreaIds) {
          // Bu könüllünün bu sahəyə təyin edilib-edilə bilməyəcəyini yoxlayırıq
          let isValid = true;
          if (lastAreaAssignment[currentVolId] && lastAreaAssignment[currentVolId][areaId] !== undefined) {
            const lastTime = lastAreaAssignment[currentVolId][areaId];
            if (Math.abs(currentSlotStartTime - lastTime) < MIN_SAME_AREA_GAP_MINUTES) {
              isValid = false;
            }
          }
          
          if (isValid) {
            const currentSize = assignments[slotId][areaId].length;
            const finalSize = currentSize + 1;
            const newPath = [...path, { volId: currentVolId, areaId }];
            
            if (!visitedAreas.has(areaId)) {
              visitedAreas.add(areaId);
              reachableAreas.push({ areaId, finalSize, path: newPath });
              
              // Daha yaxşı balans üçün bu sahədəki könüllülərin yerini dəyişdirməyə çalışırıq
              for (const assignedVolId of assignments[slotId][areaId]) {
                if (!manuallyAssignedVols.has(assignedVolId) && !visitedVols.has(assignedVolId)) {
                  visitedVols.add(assignedVolId);
                  queue.push({ currentVolId: assignedVolId, path: newPath });
                }
              }
            }
          }
        }
      }

      if (reachableAreas.length > 0) {
        // Ən az könüllüsü olan və ən qısa yolla çatıla bilən sahəni seçirik
        reachableAreas.sort((a, b) => {
          if (a.finalSize !== b.finalSize) return a.finalSize - b.finalSize;
          return a.path.length - b.path.length;
        });

        const best = reachableAreas[0];
        
        // Tapılmış yolu tətbiq edirik (könüllülərin yerini dəyişirik)
        for (const step of best.path) {
          for (const aId of selectedAreaIds) {
            const idx = assignments[slotId][aId].indexOf(step.volId);
            if (idx !== -1) {
              assignments[slotId][aId].splice(idx, 1);
            }
          }
          assignments[slotId][step.areaId].push(step.volId);
          autoAssignedThisSlot.add(step.volId);
        }
        filledCount++;
      } else {
        // Bu könüllü üçün heç bir uyğun sahə tapılmadı
        unfilledCount++;
      }
    }

    // Slot bitdikdən sonra bu slotda avtomatik təyin edilmiş könüllülərin məlumatlarını yeniləyirik
    for (const volId of autoAssignedThisSlot) {
      let assignedAreaId = "";
      for (const areaId of selectedAreaIds) {
        if (assignments[slotId][areaId].includes(volId)) {
          assignedAreaId = areaId;
          break;
        }
      }
      
      if (assignedAreaId) {
        if (!lastAreaAssignment[volId]) lastAreaAssignment[volId] = {};
        lastAreaAssignment[volId][assignedAreaId] = currentSlotStartTime;
        volunteerAssignmentCount[volId] = (volunteerAssignmentCount[volId] || 0) + 1;
      }
    }
  }

  return { assignments, filledCount, unfilledCount };
}
