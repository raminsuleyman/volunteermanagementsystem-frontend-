/**
 * Könüllülər Səhifəsi — SRS bölmə 11–12: siyahı, əlavə/redaktə/silmə (soft delete),
 * klub/təşəbbüs sayları və qalan icazə saatı.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addVolunteer,
  deactivateVolunteer,
  getVolunteers,
  updateVolunteer,
} from "@/lib/store";
import { SHIFT_TYPES, ShiftType, Volunteer, shiftTypeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Search, Trash2, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const SHIFT_BADGE: Record<string, string> = {
  seher: "bg-amber-100 text-amber-800 border-amber-200",
  gunorta: "bg-orange-100 text-orange-800 border-orange-200",
  axsam: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

interface FormState {
  id: string | null;
  firstName: string;
  lastName: string;
  shifts: ShiftType[];
  clubCount: string;
  initiativeCount: string;
  remainingLeaveHours: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  firstName: "",
  lastName: "",
  shifts: [],
  clubCount: "0",
  initiativeCount: "0",
  remainingLeaveHours: "0",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Volunteer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    setVolunteers(await getVolunteers());
    setIsLoading(false);
  };
  
  useEffect(() => {
    refresh();
  }, []);

  const active = useMemo(
    () =>
      volunteers
        .filter((v) => v.active)
        .filter((v) =>
          `${v.firstName} ${v.lastName}`.toLowerCase().includes(search.toLowerCase())
        ),
    [volunteers, search]
  );

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (v: Volunteer) => {
    setForm({
      id: v.id,
      firstName: v.firstName,
      lastName: v.lastName,
      shifts: v.shifts,
      clubCount: String(v.clubCount),
      initiativeCount: String(v.initiativeCount),
      remainingLeaveHours: String(v.remainingLeaveHours),
    });
    setDialogOpen(true);
  };

  const toggleShift = (s: ShiftType) =>
    setForm((p) => ({
      ...p,
      shifts: p.shifts.includes(s) ? p.shifts.filter((x) => x !== s) : [...p.shifts, s],
    }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Ad və soyad mütləqdir");
      return;
    }
    try {
      if (form.id) {
        const data: Volunteer = {
          id: form.id,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          shifts: form.shifts,
          clubCount: Number(form.clubCount) || 0,
          initiativeCount: Number(form.initiativeCount) || 0,
          remainingLeaveHours: Number(form.remainingLeaveHours) || 0,
          active: true,
        };
        await updateVolunteer(data);
        toast.success("Könüllü məlumatları yeniləndi");
      } else {
        const data = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          shifts: form.shifts,
          clubCount: Number(form.clubCount) || 0,
          initiativeCount: Number(form.initiativeCount) || 0,
          remainingLeaveHours: Number(form.remainingLeaveHours) || 0,
          active: true,
        };
        await addVolunteer(data as Volunteer);
        toast.success("Yeni könüllü əlavə edildi");
      }
      setDialogOpen(false);
      refresh();
    } catch (err) {
      toast.error("Əməliyyat zamanı xəta baş verdi");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deactivateVolunteer(deleteTarget.id);
      toast.success(
        `${deleteTarget.firstName} aktiv siyahıdan çıxarıldı — arxiv qeydləri qorunur`
      );
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error("Silmə zamanı xəta baş verdi");
    }
  };

  return (
    <motion.div 
      className="container py-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
            <span className="w-2 h-7 bg-primary rounded-full inline-block" />
            Könüllülər
          </h1>
          <p className="text-muted-foreground mt-1">
            {active.length} aktiv könüllü · klub, təşəbbüs və icazə saatı izlənilir
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={openAdd} className="gap-2 shadow-md bg-gradient-to-r from-primary to-purple-600">
            <Plus className="w-4 h-4" /> Yeni könüllü
          </Button>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 transition-shadow focus:shadow-md focus:border-primary/50"
          placeholder="Ad və ya soyada görə axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      {/* Desktop cədvəl */}
      <motion.div variants={itemVariants}>
        <Card className="hidden md:block overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Ad və Soyad</TableHead>
                <TableHead>Növbə(lər)</TableHead>
                <TableHead className="text-center">Klub</TableHead>
                <TableHead className="text-center">Təşəbbüs</TableHead>
                <TableHead className="text-center">Qalan icazə saatı</TableHead>
                <TableHead className="text-right">Əməliyyatlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {active.map((v) => (
                  <TableRow 
                    key={v.id} 
                    className="transition-colors hover:bg-muted/30 group"
                  >
                    <TableCell className="font-medium">
                      {v.firstName} {v.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        {v.shifts.map((s) => (
                          <Badge key={s} variant="outline" className={cn(SHIFT_BADGE[s], "transition-transform hover:scale-105")}>
                            {shiftTypeInfo(s).label}
                          </Badge>
                        ))}
                        {v.shifts.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono-time">{v.clubCount}</TableCell>
                    <TableCell className="text-center font-mono-time">{v.initiativeCount}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "font-mono-time font-medium px-2 py-1 rounded-md",
                          v.remainingLeaveHours > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-50 text-emerald-600"
                        )}
                      >
                        {v.remainingLeaveHours} saat
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(v)} title="Redaktə et">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(v)}
                            title="Sil"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </AnimatePresence>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Yüklənir...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && active.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Könüllü tapılmadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Mobil kartlar */}
      <div className="md:hidden space-y-3">
        <AnimatePresence>
          {active.map((v, idx) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="border-l-4 border-l-primary/50 hover:shadow-md transition-all active:scale-[0.98]">
                <CardContent className="pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{v.firstName} {v.lastName}</div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget(v)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {v.shifts.map((s) => (
                      <Badge key={s} variant="outline" className={SHIFT_BADGE[s]}>
                        {shiftTypeInfo(s).label}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Klub:</span> <span className="font-mono-time">{v.clubCount}</span></div>
                    <div><span className="text-muted-foreground">Təşəbbüs:</span> <span className="font-mono-time">{v.initiativeCount}</span></div>
                    <div><span className="text-muted-foreground">İcazə:</span> <span className="font-mono-time">{v.remainingLeaveHours}s</span></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Əlavə/Redaktə dialoqu */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Könüllünü redaktə et" : "Yeni könüllü"}</DialogTitle>
            <DialogDescription>
              Könüllünün məlumatlarını daxil edin. Növbələr çoxsaylı seçilə bilər.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ad</Label>
                <Input className="transition-shadow focus:shadow-sm" value={form.firstName} onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Soyad</Label>
                <Input className="transition-shadow focus:shadow-sm" value={form.lastName} onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Növbələr</Label>
              <div className="flex gap-3 flex-wrap">
                {SHIFT_TYPES.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer group">
                    <Checkbox
                      checked={form.shifts.includes(s.id)}
                      onCheckedChange={() => toggleShift(s.id)}
                      className="group-hover:border-primary transition-colors"
                    />
                    <span className="group-hover:text-primary transition-colors">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Klub sayı</Label>
                <Input className="transition-shadow focus:shadow-sm" type="number" min="0" value={form.clubCount} onChange={(e) => setForm((p) => ({ ...p, clubCount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Təşəbbüs sayı</Label>
                <Input className="transition-shadow focus:shadow-sm" type="number" min="0" value={form.initiativeCount} onChange={(e) => setForm((p) => ({ ...p, initiativeCount: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">İcazə saatı</Label>
                <Input className="transition-shadow focus:shadow-sm" type="number" min="0" value={form.remainingLeaveHours} onChange={(e) => setForm((p) => ({ ...p, remainingLeaveHours: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Ləğv et</Button>
            <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-purple-600">{form.id ? "Yenilə" : "Əlavə et"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silmə təsdiqi */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-destructive" /> Könüllünü sil
            </DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong> aktiv
              siyahıdan çıxarılacaq. Əvvəlki növbələrdəki məlumatları və arxiv qeydləri
              qorunub saxlanılacaq.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Ləğv et</Button>
            <Button variant="destructive" onClick={handleDelete}>Sil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
