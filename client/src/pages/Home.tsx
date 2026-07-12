/**
 * Ana səhifə — Civic Digital: hero illüstrasiya, sürətli keçidlər, son növbələr.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getShifts, getVolunteers } from "@/lib/store";
import { Shift, shiftTypeInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight, Archive, CalendarPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const HERO_URL = "/foto.jpg";

const SHIFT_BADGE: Record<string, string> = {
  seher: "bg-amber-100 text-amber-800 border-amber-200",
  gunorta: "bg-orange-100 text-orange-800 border-orange-200",
  axsam: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function Home() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [fetchedShifts, fetchedVolunteers] = await Promise.all([
          getShifts(),
          getVolunteers()
        ]);
        setShifts(fetchedShifts);
        setVolunteerCount(fetchedVolunteers.filter((v) => v.active).length);
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recent = [...shifts]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, 4);

  return (
    <motion.div
      className="container py-8 md:py-12 space-y-10 overflow-x-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <motion.section variants={itemVariants} className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-center">
        <div className="space-y-5">
          <Badge variant="outline" className="border-primary/40 text-primary font-medium shadow-sm">
            DOST Agentliyi · Könüllü Proqramı
          </Badge>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Növbəni seç,{" "}
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              komandanla başla.
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg">
            Kağız qrafiklərə son. Hər 30 dəqiqəlik interval üçün könüllüləri
            xidmət sahələrinə drag & drop ilə yerləşdir, gün sonu qeydlərini
            əlavə et və bir kliklə Excel-ə ixrac et.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/novbe/yeni">
              <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform duration-300 bg-gradient-to-r from-primary to-[oklch(0.58_0.21_30)]">
                <CalendarPlus className="w-5 h-5" />
                Yeni növbə yarat
              </Button>
            </Link>
            <Link href="/arxiv">
              <Button size="lg" variant="outline" className="gap-2 hover:bg-primary/5 hover:scale-105 transition-all duration-300">
                <Archive className="w-5 h-5" />
                Arxivə bax
              </Button>
            </Link>
          </div>
        </div>
        <motion.div
          className="hidden md:block relative"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-xl -z-10" />
          <img
            src={HERO_URL}
            alt="DOST könüllüləri"
            className="rounded-2xl shadow-xl shadow-primary/10 w-full object-cover border border-white/10"
          />
        </motion.div>
      </motion.section>

      {/* Stats */}
      <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div whileHover={{ y: -5 }}>
          <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="text-3xl font-extrabold font-mono-time bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-600">
                {volunteerCount}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary/70" /> Aktiv könüllü
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -5 }}>
          <Card className="border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="text-3xl font-extrabold font-mono-time bg-clip-text text-transparent bg-gradient-to-br from-amber-400 to-amber-600">
                {shifts.length}
              </div>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-amber-500/70" /> Arxivlənmiş növbə
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="col-span-2 md:col-span-1">
          <Card className="border-l-4 border-l-indigo-400 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className="text-3xl font-extrabold font-mono-time bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-indigo-600">
                3 × 6
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Gündəlik növbə × zaman intervalı
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.section>

      {/* Recent shifts */}
      <motion.section variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-2 h-6 bg-primary rounded-full inline-block" />
            Son növbələr
          </h2>
          <Link href="/arxiv" className="group text-sm text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors">
            Hamısı <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {recent.map((s, idx) => {
            const info = shiftTypeInfo(s.shiftType);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={`/arxiv/${s.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-primary/60 hover:border-l-primary bg-gradient-to-br from-card to-card/50">
                    <CardContent className="pt-5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground/90">{s.date}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          TL: <span className="font-medium text-foreground/80">{s.teamLeaderFirstName} {s.teamLeaderLastName}</span> ·{" "}
                          <span className="text-primary/80">{s.volunteerIds.length} könüllü</span>
                        </div>
                      </div>
                      <Badge className={cn(SHIFT_BADGE[s.shiftType], "shadow-sm")} variant="outline">
                        {info.label}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
          {recent.length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-sm col-span-2 bg-muted/50 p-4 rounded-lg text-center"
            >
              Hələ heç bir növbə yadda saxlanılmayıb.
            </motion.p>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
