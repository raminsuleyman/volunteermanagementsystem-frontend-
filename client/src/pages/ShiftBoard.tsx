/**
 * İş Bölgüsü Lövhəsi — SRS Addım 4–5, bölmə 5 (Drag & Drop), 8 (qeydlər), 9 (Save).
 * Sol: könüllü siyahısı (drag mənbəyi). Sağ: zaman intervalı tabları + xidmət sahələri (drop hədəfi).
 * @dnd-kit istifadə olunur — touch dəstəyi daxildir (mobil/tablet).
 */
import { motion, AnimatePresence } from "framer-motion";

// ... existing imports ...
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { exportShiftToExcel } from "@/lib/excelExport";
import { genId, getVolunteers, saveShift, saveDraft, getShifts, getShiftById } from "@/lib/store";
import {
  EMPTY_NOTES,
  NOTE_LABELS,
  SERVICE_AREAS,
  Shift,
  ShiftNotes,
  SlotAssignments,
  TimeSlot,
  Volunteer,
  generateTimeSlots,
  shiftTypeInfo,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Clock,
  Download,
  GripVertical,
  NotebookPen,
  Save,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { autoAssignShift } from "@/lib/autoAssign";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import type { DraftShift } from "./NewShift";

// ---- Draggable könüllü kartı ----
function VolunteerChip({
  volunteer,
  dragId,
  assignedCount,
}: {
  volunteer: Volunteer;
  dragId: string;
  assignedCount?: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium shadow-sm cursor-grab active:cursor-grabbing select-none touch-none transition-all duration-150",
        isDragging ? "opacity-40 scale-95" : "hover:border-primary/50 hover:shadow-md"
      )}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-colors group-hover:text-primary" />
      <span className="truncate">{volunteer.firstName} {volunteer.lastName}</span>
      {assignedCount !== undefined && assignedCount > 0 && (
        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 border-primary/40 text-primary">
          {assignedCount}
        </Badge>
      )}
    </div>
  );
}

// ---- Droppable xidmət sahəsi ----
function AreaCell({
  areaId,
  areaName,
  volunteerIds,
  volunteers,
  onRemove,
}: {
  areaId: string;
  areaName: string;
  volunteerIds: string[];
  volunteers: Volunteer[];
  onRemove: (areaId: string, volId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `area:${areaId}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border-2 border-dashed p-3 min-h-[92px] transition-all duration-300 ease-out bg-card",
        isOver
          ? "border-primary bg-primary/5 ring-4 ring-primary/20 scale-[1.02] shadow-lg"
          : volunteerIds.length > 0
            ? "border-emerald-300 border-solid bg-emerald-50/10"
            : "border-border hover:border-primary/30"
      )}
    >
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex justify-between items-center">
        {areaName}
        {volunteerIds.length > 0 && (
          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{volunteerIds.length}</span>
        )}
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {volunteerIds.map((id) => {
            const v = volunteers.find((x) => x.id === id);
            if (!v) return null;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group flex items-center justify-between gap-1"
              >
                <div className="flex-1 min-w-0">
                  <VolunteerChip volunteer={v} dragId={`assigned:${areaId}:${id}`} />
                </div>
                <button
                  onClick={() => onRemove(areaId, id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-destructive/10"
                  title="Sahədən çıxar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {volunteerIds.length === 0 && (
          <div className="text-xs text-muted-foreground/60 italic py-3 text-center border border-dashed border-transparent rounded-lg">
            Könüllünü bura sürüklə
          </div>
        )}
      </div>
    </div>
  );
}

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 100,
      staggerChildren: 0.1
    }
  }
};

const childVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function ShiftBoard() {
  const [, navigate] = useLocation();
  const [draft, setDraft] = useState<DraftShift | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [activeSlot, setActiveSlot] = useState("slot-0");
  const [assignments, setAssignments] = useState<Record<string, SlotAssignments>>({});
  const [notes, setNotes] = useState<ShiftNotes>({ ...EMPTY_NOTES });
  const [notesOpen, setNotesOpen] = useState(false);
  const [activeDragVol, setActiveDragVol] = useState<Volunteer | null>(null);
  const [savedShift, setSavedShift] = useState<Shift | null>(null);
  const [draftShiftId, setDraftShiftId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [autoAssignOpen, setAutoAssignOpen] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>(SERVICE_AREAS.map(a => a.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  useEffect(() => {
    const raw = sessionStorage.getItem("dost_draft_shift");
    if (!raw) {
      navigate("/novbe/yeni");
      return;
    }
    const parsedDraft: DraftShift = JSON.parse(raw);
    setDraft(parsedDraft);
    
    Promise.all([
      getVolunteers(),
      getShifts("draft")
    ]).then(async ([vols, drafts]) => {
      setVolunteers(vols);
      const existing = drafts.find(
        (d) => d.date === parsedDraft.date && d.shiftType === parsedDraft.shiftType
      );
      if (existing) {
        setDraftShiftId(existing.id);
        
        // Taslağın bütün detallarını (volunteerIds, assignments, notes) yüklə
        try {
          const fullDraft = await getShiftById(existing.id);
          if (fullDraft) {
            // Yalnız əgər sessionStorage-dakı draft-da könüllülər yoxdursa (Arxivdən gələndə), backend-dən götür
            if (fullDraft.volunteerIds && fullDraft.volunteerIds.length > 0 && (!parsedDraft.volunteerIds || parsedDraft.volunteerIds.length === 0)) {
              setDraft(prev => prev ? { ...prev, volunteerIds: fullDraft.volunteerIds.map(String) } : null);
            }
            if (fullDraft.assignments && Object.keys(fullDraft.assignments).length > 0) {
              setAssignments(fullDraft.assignments);
            }
            if (fullDraft.notes) {
              setNotes(fullDraft.notes);
            }
          }
        } catch (err) {
          console.error("Draft detalları yüklənə bilmədi:", err);
        }
      } else if (parsedDraft.id && (parsedDraft as any).assignments) {
        // Redaktə rejimi: əgər tam obyekt sessionStorage-da gəlibsə
        setDraftShiftId(parsedDraft.id);
        setAssignments((parsedDraft as any).assignments || {});
        setNotes((parsedDraft as any).notes || { ...EMPTY_NOTES });
      }
      setIsInitialized(true);
    }).catch(console.error);
  }, [navigate]);

  useEffect(() => {
    if (!isInitialized || !draft) return;
    
    const timer = setTimeout(async () => {
      try {
        const payload: Partial<Shift> = {
          ...(draftShiftId ? { id: draftShiftId } : {}),
          date: draft.date,
          shiftType: draft.shiftType,
          teamLeaderFirstName: draft.teamLeaderFirstName,
          teamLeaderLastName: draft.teamLeaderLastName,
          volunteerIds: draft.volunteerIds,
          assignments,
          notes,
          savedAt: new Date().toISOString(),
        };
        const saved = await saveDraft(payload);
        if (saved && saved.id) {
          setDraftShiftId(String(saved.id));
        }
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [assignments, notes, draft, isInitialized]);

  const slots: TimeSlot[] = useMemo(
    () => (draft ? generateTimeSlots(draft.shiftType) : []),
    [draft]
  );

  const shiftVolunteers = useMemo(
    () => volunteers.filter((v) => draft?.volunteerIds.includes(v.id)),
    [volunteers, draft]
  );

  if (!draft) return null;
  const info = shiftTypeInfo(draft.shiftType);
  const slotAssign: SlotAssignments = assignments[activeSlot] ?? {};

  const assignedCountInSlot = (volId: string) =>
    Object.values(slotAssign).filter((ids) => ids.includes(volId)).length;

  const totalAssignedSlots = (volId: string) =>
    slots.filter((s) =>
      Object.values(assignments[s.id] ?? {}).some((ids) => ids.includes(volId))
    ).length;

  const parseDragId = (id: string) => {
    // "vol:v1" | "assigned:areaId:v1"
    const parts = id.split(":");
    if (parts[0] === "vol") return { volId: parts[1], fromArea: null as string | null };
    return { volId: parts[2], fromArea: parts[1] };
  };

  const handleDragStart = (e: DragStartEvent) => {
    const { volId } = parseDragId(String(e.active.id));
    setActiveDragVol(volunteers.find((v) => v.id === volId) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragVol(null);
    const { active, over } = e;
    if (!over) return;
    const overId = String(over.id);
    if (!overId.startsWith("area:")) return;
    const targetArea = overId.slice(5);
    const { volId, fromArea } = parseDragId(String(active.id));

    setAssignments((prev) => {
      const slot: SlotAssignments = { ...(prev[activeSlot] ?? {}) };
      // mənbə sahədən çıxar
      if (fromArea && slot[fromArea]) {
        slot[fromArea] = slot[fromArea].filter((x) => x !== volId);
      }
      // eyni sahəyə təkrar əlavəni önlə
      const target = slot[targetArea] ?? [];
      if (!target.includes(volId)) {
        // Yerdəyişmə: başqa sahədə eyni interval daxilində varsa, çıxar (bir interval = bir sahə)
        for (const key of Object.keys(slot)) {
          if (key !== targetArea) slot[key] = (slot[key] ?? []).filter((x) => x !== volId);
        }
        slot[targetArea] = [...target, volId];
      }
      return { ...prev, [activeSlot]: slot };
    });
    const v = volunteers.find((x) => x.id === volId);
    const area = SERVICE_AREAS.find((a) => a.id === targetArea);
    if (v && area) toast.success(`${v.firstName} → ${area.name}`);
  };

  const removeFromArea = (areaId: string, volId: string) => {
    setAssignments((prev) => {
      const slot = { ...(prev[activeSlot] ?? {}) };
      slot[areaId] = (slot[areaId] ?? []).filter((x) => x !== volId);
      return { ...prev, [activeSlot]: slot };
    });
  };

  const handleSave = async () => {
    const shift: Shift = {
      id: draftShiftId || genId("shift"),
      date: draft.date,
      shiftType: draft.shiftType,
      teamLeaderFirstName: draft.teamLeaderFirstName,
      teamLeaderLastName: draft.teamLeaderLastName,
      volunteerIds: draft.volunteerIds,
      assignments,
      notes,
      savedAt: new Date().toISOString(),
      status: "completed",
    };
    try {
      await saveShift(shift, "completed");
      setSavedShift(shift);
      sessionStorage.removeItem("dost_draft_shift");
      toast.success("Növbə yadda saxlanıldı və arxivə əlavə edildi");
    } catch (err) {
      toast.error("Növbəni yadda saxlayarkən xəta baş verdi");
    }
  };

  const handleExport = () => {
    const shift: Shift = savedShift ?? {
      id: "preview",
      date: draft.date,
      shiftType: draft.shiftType,
      teamLeaderFirstName: draft.teamLeaderFirstName,
      teamLeaderLastName: draft.teamLeaderLastName,
      volunteerIds: draft.volunteerIds,
      assignments,
      notes,
      savedAt: new Date().toISOString(),
    };
    exportShiftToExcel(shift, volunteers);
    toast.success("Excel faylı yükləndi");
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div 
        className="container py-6 space-y-5"
        initial="hidden"
        animate="visible"
        variants={pageVariants}
      >
        {/* Header */}
        <motion.div variants={childVariants} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2.5 flex-wrap">
              İş Bölgüsü
              <Badge variant="outline" className="border-primary/40 text-primary font-mono-time shadow-sm">
                {info.label} · {info.start}–{info.end}
              </Badge>
              <Badge variant="outline" className="font-mono-time shadow-sm">{draft.date}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              TL: <span className="font-medium text-foreground">{draft.teamLeaderFirstName} {draft.teamLeaderLastName}</span> · {shiftVolunteers.length} könüllü
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={() => setAutoAssignOpen(true)} className="gap-2 transition-colors hover:bg-purple-500 hover:text-white border-purple-500/30">
                <Wand2 className="w-4 h-4" /> Avtomatik böl
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={() => setNotesOpen(true)} className="gap-2 transition-colors hover:bg-primary hover:text-white">
                <NotebookPen className="w-4 h-4" /> Gün sonu qeydləri
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={handleExport} className="gap-2 transition-colors hover:bg-emerald-500 hover:text-white hover:border-emerald-500">
                <Download className="w-4 h-4" /> Excel
              </Button>
            </motion.div>
            <motion.div whileHover={savedShift ? {} : { scale: 1.05 }} whileTap={savedShift ? {} : { scale: 0.95 }}>
              <Button onClick={handleSave} disabled={!!savedShift} className={cn("gap-2 shadow-md transition-all", savedShift ? "bg-emerald-600 text-white" : "bg-gradient-to-r from-primary to-purple-600")}>
                <Save className="w-4 h-4" /> {savedShift ? "Saxlanıldı" : "Yadda saxla"}
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Zaman intervalı tabları */}
        <motion.div variants={childVariants} className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
          {slots.map((s) => {
            const filled = Object.values(assignments[s.id] ?? {}).reduce(
              (n, ids) => n + ids.length,
              0
            );
            return (
              <motion.button
                key={s.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveSlot(s.id)}
                className={cn(
                  "shrink-0 rounded-lg border px-4 py-2 text-sm font-mono-time font-medium transition-all duration-300",
                  activeSlot === s.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105"
                    : "bg-card hover:bg-muted hover:border-primary/30"
                )}
              >
                <Clock className={cn("w-3.5 h-3.5 inline mr-1.5 -mt-0.5", activeSlot === s.id ? "animate-pulse" : "")} />
                {s.start}–{s.end}
                {filled > 0 && (
                  <span className={cn(
                    "ml-2 text-[10px] rounded-full px-1.5 py-0.5 font-sans transition-colors",
                    activeSlot === s.id ? "bg-white/20" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {filled}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Əsas grid: sol könüllülər, sağ sahələr */}
        <motion.div variants={childVariants} className="grid md:grid-cols-[260px_1fr] gap-5">
          <Card className="md:sticky md:top-4 flex flex-col max-h-[calc(100vh-8rem)] shadow-md border-primary/10">
            <CardHeader className="pb-3 shrink-0 bg-muted/30 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Könüllülər
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-3">
              <ScrollArea className="h-full max-h-[420px] overflow-hidden pr-3 -mr-3">
                <div className="space-y-2.5">
                  {shiftVolunteers.map((v) => (
                    <div key={v.id} className="group">
                      <VolunteerChip
                        volunteer={v}
                        dragId={`vol:${v.id}`}
                        assignedCount={assignedCountInSlot(v.id)}
                      />
                      <div className="text-[10px] text-muted-foreground pl-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity h-0 group-hover:h-auto overflow-hidden">
                        {totalAssignedSlots(v.id)}/6 intervalda təyin edilib
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICE_AREAS.map((area) => (
              <AreaCell
                key={area.id}
                areaId={area.id}
                areaName={area.name}
                volunteerIds={slotAssign[area.id] ?? []}
                volunteers={volunteers}
                onRemove={removeFromArea}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeDragVol && (
          <div className="flex items-center gap-2 rounded-lg border border-primary bg-card px-3 py-2 text-sm font-medium shadow-xl scale-105 ring-4 ring-primary/20 rotate-2">
            <GripVertical className="w-3.5 h-3.5 text-primary" />
            {activeDragVol.firstName} {activeDragVol.lastName}
          </div>
        )}
      </DragOverlay>

      {/* Gün sonu qeydləri dialoqu */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gün Sonu Qeydləri</DialogTitle>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-4">
            {NOTE_LABELS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-sm">{label}</Label>
                <Textarea
                  rows={2}
                  value={notes[key]}
                  onChange={(e) => setNotes((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder="Qeyd daxil et..."
                  className="transition-all focus:scale-[1.01]"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => { setNotesOpen(false); toast.success("Qeydlər əlavə edildi"); }} className="bg-gradient-to-r from-primary to-purple-600">
              Təsdiqlə
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avtomatik bölgü dialoqu */}
      <Dialog open={autoAssignOpen} onOpenChange={setAutoAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Avtomatik Bölgü</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Hansı sahələr üzrə avtomatik bölgü aparılsın?</p>
            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox 
                id="select-all" 
                checked={selectedAreas.length === SERVICE_AREAS.length}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedAreas(SERVICE_AREAS.map(a => a.id));
                  else setSelectedAreas([]);
                }}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Hamısını seç
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {SERVICE_AREAS.map((area) => (
                <div key={area.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`area-${area.id}`} 
                    checked={selectedAreas.includes(area.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedAreas([...selectedAreas, area.id]);
                      else setSelectedAreas(selectedAreas.filter(id => id !== area.id));
                    }}
                  />
                  <label
                    htmlFor={`area-${area.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {area.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                const result = autoAssignShift(slots, selectedAreas, shiftVolunteers, assignments);
                setAssignments(result.assignments);
                setAutoAssignOpen(false);
                if (result.unfilledCount === 0) {
                  toast.success(`${result.filledCount} xana avtomatik dolduruldu`);
                } else {
                  toast.warning(`${result.filledCount} xana dolduruldu, ${result.unfilledCount} xana üçün uyğun könüllü tapılmadı (1.5 saat qaydası və ya məşğulluq səbəbiylə)`);
                }
              }} 
              disabled={selectedAreas.length === 0}
              className="bg-gradient-to-r from-primary to-purple-600 text-white"
            >
              Başla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
