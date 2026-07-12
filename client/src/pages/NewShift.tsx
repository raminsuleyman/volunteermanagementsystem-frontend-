/**
 * Yeni Növbə — SRS Addım 1–3: növbə seçimi, TL məlumatları, könüllülərin əlavə edilməsi.
 * Tamamlandıqda məlumatlar sessionStorage-a yazılır və ShiftBoard-a keçilir.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVolunteers } from "@/lib/store";
import { SHIFT_TYPES, ShiftType, Volunteer, shiftTypeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight, Clock, Moon, Sun, Sunset, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const SHIFT_ICONS = { seher: Sun, gunorta: Sunset, axsam: Moon } as const;

const SHIFT_STYLES: Record<ShiftType, { ring: string; bg: string; icon: string }> = {
  seher: { ring: "ring-amber-400 border-amber-400", bg: "bg-amber-50", icon: "text-amber-500" },
  gunorta: { ring: "ring-orange-500 border-orange-500", bg: "bg-orange-50", icon: "text-orange-500" },
  axsam: { ring: "ring-indigo-500 border-indigo-500", bg: "bg-indigo-50", icon: "text-indigo-500" },
};

export interface DraftShift {
  shiftType: ShiftType;
  teamLeaderFirstName: string;
  teamLeaderLastName: string;
  volunteerIds: string[];
  date: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

export default function NewShift() {
  const [, navigate] = useLocation();
  const [shiftType, setShiftType] = useState<ShiftType | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setVolunteers(getVolunteers().filter((v) => v.active));
  }, []);

  const filtered = useMemo(
    () =>
      volunteers.filter((v) =>
        `${v.firstName} ${v.lastName}`.toLowerCase().includes(search.toLowerCase())
      ),
    [volunteers, search]
  );

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const canContinue =
    shiftType && firstName.trim() && lastName.trim() && selected.length > 0;

  const handleContinue = () => {
    if (!canContinue || !shiftType) return;
    const draft: DraftShift = {
      shiftType,
      teamLeaderFirstName: firstName.trim(),
      teamLeaderLastName: lastName.trim(),
      volunteerIds: selected,
      date: new Date().toISOString().slice(0, 10),
    };
    sessionStorage.setItem("dost_draft_shift", JSON.stringify(draft));
    toast.success("Növbə hazırlandı — iş bölgüsünə keçilir");
    navigate("/novbe/board");
  };

  return (
    <motion.div 
      className="container py-8 space-y-8 max-w-4xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
          <span className="w-2 h-7 bg-primary rounded-full inline-block" />
          Yeni Növbə
        </h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          3 addımda növbəni hazırla: növbə seçimi <ArrowRight className="w-3 h-3 inline mx-1 opacity-50" /> Team Leader <ArrowRight className="w-3 h-3 inline mx-1 opacity-50" /> könüllülər
        </p>
      </motion.div>

      {/* Addım 1: Növbə seçimi */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm flex items-center justify-center font-extrabold">1</span>
              Növbəni seç
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SHIFT_TYPES.map((s) => {
              const Icon = SHIFT_ICONS[s.id];
              const st = SHIFT_STYLES[s.id];
              const active = shiftType === s.id;
              return (
                <motion.button
                  key={s.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShiftType(s.id)}
                  className={cn(
                    "rounded-xl border-2 p-5 text-left transition-all duration-300 ease-out",
                    active ? cn("ring-4 ring-offset-1", st.ring, st.bg, "shadow-lg scale-[1.02]") : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <Icon className={cn("w-8 h-8 mb-4 transition-transform duration-500", st.icon, active ? "rotate-12 scale-110" : "")} />
                  <div className="font-bold text-lg">{s.label}</div>
                  <div className="text-sm text-muted-foreground font-mono-time flex items-center gap-1.5 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    {s.start} – {s.end}
                  </div>
                </motion.button>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Addım 2: Team Leader */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm flex items-center justify-center font-extrabold">2</span>
              Team Leader məlumatları
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="fn" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ad</Label>
              <Input id="fn" className="transition-shadow focus:shadow-md h-11" placeholder="Məsələn: Orxan" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ln" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Soyad</Label>
              <Input id="ln" className="transition-shadow focus:shadow-md h-11" placeholder="Məsələn: Vəliyev" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Addım 3: Könüllülər */}
      <motion.div variants={itemVariants}>
        <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm flex items-center justify-center font-extrabold">3</span>
              Könüllüləri daxil et
              <AnimatePresence>
                {selected.length > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                    <Badge className="ml-2 bg-primary/10 text-primary border-primary/30 py-1" variant="outline">
                      {selected.length} seçilib
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-2 relative">
              <UserPlus className="w-4 h-4 text-muted-foreground absolute left-3" />
              <Input className="pl-9 h-11 transition-shadow focus:shadow-md" placeholder="Könüllü axtar..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence>
                {filtered.map((v) => (
                  <motion.label
                    key={v.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01 }}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200",
                      selected.includes(v.id) ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" : "hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <Checkbox checked={selected.includes(v.id)} onCheckedChange={() => toggle(v.id)} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                    <div className="min-w-0">
                      <div className={cn("font-medium truncate transition-colors", selected.includes(v.id) ? "text-primary font-bold" : "")}>{v.firstName} {v.lastName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {v.shifts.map((s) => shiftTypeInfo(s).label).join(", ") || "Növbə təyin edilməyib"}
                      </div>
                    </div>
                  </motion.label>
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2 py-8 text-center italic border border-dashed rounded-lg bg-muted/20">
                  Nəticə tapılmadı. Yeni könüllünü "Könüllülər" səhifəsindən əlavə edin.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-end pt-4">
        <motion.div whileHover={canContinue ? { scale: 1.05 } : {}} whileTap={canContinue ? { scale: 0.95 } : {}}>
          <Button 
            size="lg" 
            disabled={!canContinue} 
            onClick={handleContinue} 
            className={cn("gap-2 shadow-lg transition-all h-12 px-8 text-base", canContinue ? "bg-gradient-to-r from-primary to-purple-600" : "bg-muted text-muted-foreground")}
          >
            İş bölgüsünə keç <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

