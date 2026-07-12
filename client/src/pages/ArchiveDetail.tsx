/**
 * Arxiv Detalı — tam iş bölgüsü cədvəli, gün sonu qeydləri, Excel export.
 */
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportShiftToExcel } from "@/lib/excelExport";
import { deleteShift, getShiftById, getVolunteers } from "@/lib/store";
import {
  NOTE_LABELS,
  SERVICE_AREAS,
  Shift,
  Volunteer,
  generateTimeSlots,
  shiftTypeInfo,
} from "@/lib/types";
import { ArrowLeft, Download, NotebookPen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useParams } from "wouter";

const SHIFT_BADGE: Record<string, string> = {
  seher: "bg-amber-100 text-amber-800 border-amber-200",
  gunorta: "bg-orange-100 text-orange-800 border-orange-200",
  axsam: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [shift, setShift] = useState<Shift | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm("Bu növbəni arxivdən silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz!")) return;
    try {
      setIsDeleting(true);
      await deleteShift(id);
      toast.success("Növbə arxivdən silindi");
      navigate("/arxiv");
    } catch (err) {
      toast.error("Silinmə zamanı xəta baş verdi");
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        if (id) {
          const shiftData = await getShiftById(id);
          setShift(shiftData ?? null);
        }
        const vols = await getVolunteers();
        setVolunteers(vols);
      } catch (err) {
        toast.error("Məlumatlar yüklənərkən xəta baş verdi");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return <div className="container py-12 text-center text-muted-foreground">Yüklənir...</div>;
  }

  if (!shift) {
    return (
      <div className="container py-12 text-center space-y-4">
        <p className="text-muted-foreground">Növbə tapılmadı.</p>
        <Link href="/arxiv"><Button variant="outline">Arxivə qayıt</Button></Link>
      </div>
    );
  }

  const info = shiftTypeInfo(shift.shiftType);
  const slots = generateTimeSlots(shift.shiftType);
  const volName = (vid: string) => {
    const v = volunteers.find((x) => x.id === vid);
    return v ? `${v.firstName} ${v.lastName}` : "—";
  };

  return (
    <motion.div 
      className="container py-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/arxiv">
            <motion.div whileHover={{ x: -3 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2.5 flex-wrap">
              <span className="font-mono-time">{shift.date}</span>
              <Badge variant="outline" className={`${SHIFT_BADGE[shift.shiftType]} shadow-sm`}>
                {info.label} · {info.start}–{info.end}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              TL: <span className="font-medium text-foreground">{shift.teamLeaderFirstName} {shift.teamLeaderLastName}</span> ·{" "}
              {shift.volunteerIds.length} könüllü
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="destructive"
              className="gap-2 shadow-md transition-all"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" /> {isDeleting ? "Silinir..." : "Sil"}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="gap-2 shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all border-none"
              onClick={() => { exportShiftToExcel(shift, volunteers); toast.success("Excel faylı yükləndi"); }}
            >
              <Download className="w-4 h-4" /> Excel
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Könüllülər */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2 p-4 rounded-xl bg-muted/30 border border-border/50">
        <span className="text-sm font-semibold text-muted-foreground w-full mb-1">Növbədə iştirak edənlər:</span>
        {shift.volunteerIds.map((vid, idx) => (
          <motion.div
            key={vid}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.02 + 0.2 }}
          >
            <Badge variant="outline" className="text-sm py-1.5 px-3 bg-card hover:bg-primary/5 hover:border-primary/30 transition-colors shadow-sm">
              {volName(vid)}
            </Badge>
          </motion.div>
        ))}
      </motion.div>

      {/* İş bölgüsü cədvəli (desktop) */}
      <motion.div variants={itemVariants}>
        <Card className="hidden md:block overflow-x-auto shadow-sm hover:shadow-md transition-shadow">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="min-w-[140px] font-bold">Xidmət sahəsi</TableHead>
                {slots.map((s) => (
                  <TableHead key={s.id} className="font-mono-time text-center min-w-[110px] text-primary/80 font-bold">
                    {s.start}–{s.end}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {SERVICE_AREAS.map((area, idx) => (
                <motion.tr 
                  key={area.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.3 }}
                  className="border-b transition-colors hover:bg-muted/30 group"
                >
                  <TableCell className="font-medium group-hover:text-primary transition-colors">{area.name}</TableCell>
                  {slots.map((s) => {
                    const ids = shift.assignments[s.id]?.[area.id] ?? [];
                    return (
                      <TableCell key={s.id} className="text-center text-sm">
                        {ids.length > 0 ? (
                          <div className="space-y-1.5">
                            {ids.map((vid) => (
                              <div key={vid} className="rounded-md bg-primary/10 border border-primary/20 px-2 py-1 text-primary-foreground text-xs font-medium shadow-sm hover:scale-105 transition-transform text-foreground">
                                {volName(vid)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 font-light">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {/* Mobil: interval kartları */}
      <div className="md:hidden space-y-3">
        {slots.map((s, idx) => {
          const slotA = shift.assignments[s.id] ?? {};
          const entries = SERVICE_AREAS.filter((a) => (slotA[a.id] ?? []).length > 0);
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 + 0.2 }}
            >
              <Card className="border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-muted/30 border-b border-border/50">
                  <CardTitle className="text-base font-mono-time text-primary">{s.start}–{s.end}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-3">
                  {entries.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-2">Təyinat yoxdur</p>
                  )}
                  {entries.map((a) => (
                    <div key={a.id} className="flex flex-col text-sm gap-1 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">{a.name}</span>
                      <span className="font-medium">
                        {(slotA[a.id] ?? []).map(volName).join(", ")}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Gün sonu qeydləri */}
      <motion.div variants={itemVariants}>
        <Card className="shadow-sm border-t-4 border-t-purple-500 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg">
              <NotebookPen className="w-5 h-5 text-purple-600" /> Gün Sonu Qeydləri
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-4">
            {NOTE_LABELS.map(({ key, label }, idx) => (
              <motion.div 
                key={key} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.4 }}
                className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow hover:border-purple-200"
              >
                <div className="text-xs font-bold text-purple-600/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                  {label}
                </div>
                <div className="text-sm leading-relaxed">
                  {shift.notes[key] || <span className="text-muted-foreground/50 italic">— Qeyd yoxdur</span>}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

