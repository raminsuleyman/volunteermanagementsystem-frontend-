/**
 * Layout — Premium sidebar: gradient bənövşəyi fon, glassmorphism,
 * glow effektləri, micro-animasiyalar.
 */
import { cn } from "@/lib/utils";
import { Archive, CalendarPlus, Home, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

const LOGO_URL = "/logo.png";

const NAV_ITEMS = [
  { href: "/", label: "Ana səhifə", icon: Home },
  { href: "/novbe/yeni", label: "Yeni Növbə", icon: CalendarPlus },
  { href: "/konulluler", label: "Könüllülər", icon: Users },
  { href: "/arxiv", label: "Arxiv", icon: Archive },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen flex">
      {/* ─── Desktop sidebar ─── */}
      <aside
        className="hidden md:flex w-64 shrink-0 flex-col relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #6B21A8 0%, #551A8B 40%, #3B0764 100%)",
        }}
      >
        {/* Decorative glow orbs */}
        <div
          className="pointer-events-none absolute -top-20 -left-20 w-56 h-56 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #c084fc 0%, transparent 70%)" }}
        />

        {/* Logo area */}
        <div className="relative flex items-center gap-3.5 px-5 py-6 border-b border-white/10">
          {/* Subtle shine sweep */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 4s ease-in-out infinite",
            }}
          />
          <div className="relative w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shadow-lg">
            <img src={LOGO_URL} alt="DOST" className="w-8 h-8 object-contain drop-shadow-md" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-white leading-tight tracking-tight" style={{ fontFamily: "Manrope" }}>
              DOST Növbə
            </div>
            <div className="text-[11px] text-white/50 font-medium tracking-wide uppercase mt-0.5">
              Könüllü idarəetməsi
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 space-y-1.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out",
                isActive(href)
                  ? "bg-white/20 text-white shadow-lg backdrop-blur-sm ring-1 ring-white/20"
                  : "text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1"
              )}
            >
              {/* Active glow */}
              {isActive(href) && (
                <div
                  className="absolute inset-0 rounded-xl opacity-40 blur-md -z-10"
                  style={{ background: "rgba(168, 85, 247, 0.5)" }}
                />
              )}
              {/* Active bar */}
              {isActive(href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-white shadow-sm" />
              )}
              <Icon className={cn(
                "w-[18px] h-[18px] shrink-0 transition-transform duration-200",
                isActive(href) ? "drop-shadow-md" : "group-hover:scale-110"
              )} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 text-[11px] text-white/30 border-t border-white/10 font-medium">
          DOST Agentliyi © 2026
        </div>
      </aside>

      {/* ─── Mobile header ─── */}
      <div
        className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center gap-3 px-4 py-3 shadow-lg backdrop-blur-md"
        style={{
          background: "linear-gradient(135deg, rgba(107,33,168,0.95) 0%, rgba(85,26,139,0.95) 100%)",
        }}
      >
        <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
          <img src={LOGO_URL} alt="DOST" className="w-6 h-6 object-contain" />
        </div>
        <span className="font-bold text-white" style={{ fontFamily: "Manrope" }}>DOST Növbə</span>
      </div>

      {/* ─── Main content ─── */}
      <main className="flex-1 min-w-0 pt-14 pb-20 md:pt-0 md:pb-0">{children}</main>

      {/* ─── Mobile bottom nav ─── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-white/10 backdrop-blur-md"
        style={{
          background: "linear-gradient(135deg, rgba(107,33,168,0.97) 0%, rgba(59,7,100,0.97) 100%)",
        }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-all duration-200",
              isActive(href)
                ? "text-white"
                : "text-white/50"
            )}
          >
            <div className={cn(
              "flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200",
              isActive(href) && "bg-white/20 shadow-md"
            )}>
              <Icon className="w-[18px] h-[18px]" />
            </div>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
