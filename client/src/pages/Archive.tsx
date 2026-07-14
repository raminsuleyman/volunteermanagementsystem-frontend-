/**
 * Arxiv — SRS bölmə 14: keçmiş növbələrin siyahısı, tarixə görə filtr, Excel export.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { exportShiftToExcel } from "@/lib/excelExport";
import { getShifts, getVolunteers, deleteShift } from "@/lib/store";
import { SHIFT_TYPES, Shift, Volunteer, shiftTypeInfo } from "@/lib/types";
import { Calendar, Download, Eye, Users, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

const EMPTY_IMG = "/logo.png";

const SHIFT_BADGE: Record<string, string> = {
  seher: "bg-amber-100 text-amber-800 border-amber-200",
  gunorta: "bg-orange-100 text-orange-800 border-orange-200",
  axsam: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const DRAFT_BADGE = "bg-yellow-100 text-yellow-800 border-yellow-300";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function Archive() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  const handleContinueDraft = (s: Shift) => {
    sessionStorage.setItem("dost_draft_shift", JSON.stringify({
      id: s.id,
      date: s.date,
      shiftType: s.shiftType,
      teamLeaderFirstName: s.teamLeaderFirstName,
      teamLeaderLastName: s.teamLeaderLastName,
      volunteerIds: s.volunteerIds
    }));
    navigate("/novbe/board");
  };

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Bu taslağı silmək istədiyinizə əminsiniz?")) return;
    try {
      await deleteShift(id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
      toast.success("Taslaq silindi");
    } catch (err) {
      toast.error("Silinərkən xəta baş verdi");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [fetchedShifts, fetchedVolunteers] = await Promise.all([
          getShifts(),
          getVolunteers()
        ]);
        setShifts(fetchedShifts);
        setVolunteers(fetchedVolunteers);
      } catch (err) {
        toast.error("Məlumatlar yüklənərkən xəta baş verdi");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      shifts
        .filter((s) => (dateFilter ? s.date === dateFilter : true))
        .filter((s) => (typeFilter === "all" ? true : s.shiftType === typeFilter))
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
    [shifts, dateFilter, typeFilter]
  );

  const handleExport = (s: Shift) => {
    exportShiftToExcel(s, volunteers);
    toast.success("Excel faylı yükləndi");
  };

  return (
    <motion.div 
      className="container py-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <span className="w-2 h-7 bg-primary rounded-full inline-block" />
          Arxiv
        </h1>
        <p className="text-muted-foreground mt-1">
          Yadda saxlanılmış bütün növbələr — daimi qorunur, silinmir
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="date"
            className="pl-9 w-44 transition-shadow focus:shadow-md"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 transition-shadow focus:shadow-md">
            <SelectValue placeholder="Növbə tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Bütün növbələr</SelectItem>
            {SHIFT_TYPES.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AnimatePresence>
          {(dateFilter || typeFilter !== "all") && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button variant="ghost" onClick={() => { setDateFilter(""); setTypeFilter("all"); }}>
                Filtrləri təmizlə
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-12 text-center"
          >
            <p className="text-muted-foreground mt-4">Yüklənir...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center py-12 text-center"
          >
            <motion.img 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              src={EMPTY_IMG} 
              alt="Boş arxiv" 
              className="w-44 h-44 object-contain opacity-90 drop-shadow-xl" 
            />
            <p className="text-muted-foreground mt-4">Bu filtrlərə uyğun növbə tapılmadı.</p>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filtered.map((s) => {
              const info = shiftTypeInfo(s.shiftType);
              return (
                <motion.div key={s.id} variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Card className="border-l-4 border-l-primary/60 hover:border-l-primary hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/50">
                    <CardContent className="pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-lg font-mono-time">{s.date}</div>
                        <div className="flex gap-2">
                          {s.status === "draft" && (
                            <Badge variant="outline" className={DRAFT_BADGE}>
                              Taslaq
                            </Badge>
                          )}
                          <Badge variant="outline" className={SHIFT_BADGE[s.shiftType]}>
                            {info.label} · {info.start}–{info.end}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>TL: <span className="text-foreground font-medium">{s.teamLeaderFirstName} {s.teamLeaderLastName}</span></div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> <span className="text-primary/80">{s.volunteerIds.length} könüllü</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        {s.status === "draft" ? (
                          <>
                            <Button size="sm" className="flex-1 gap-1.5 transition-colors bg-yellow-500 hover:bg-yellow-600 text-white" onClick={() => handleContinueDraft(s)}>
                              <ArrowRight className="w-3.5 h-3.5" /> Davam et
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1.5 transition-colors flex-none px-3" onClick={() => handleDeleteDraft(s.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Link href={`/arxiv/${s.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full gap-1.5 hover:bg-primary/5 transition-colors">
                              <Eye className="w-3.5 h-3.5" /> Bax
                            </Button>
                          </Link>
                        )}
                        <Button size="sm" variant="outline" className="gap-1.5 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors" onClick={() => handleExport(s)}>
                          <Download className="w-3.5 h-3.5" /> Excel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
