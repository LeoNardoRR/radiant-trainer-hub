import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Users, Bell, BarChart3,
  MessageSquare, Settings, LogOut, Moon, Sun,
  Dumbbell, TrendingUp, DollarSign, Camera, Activity
} from "lucide-react";
import { useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import OnboardingTour from "@/components/OnboardingTour";
import StudentPaymentBanner from "@/components/StudentPaymentBanner";
import { AppIcon } from "@/components/AppIcon";
import { OfflineBanner } from "@/components/OfflineBanner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/* ── Nav config ──────────────────────────────────────────── */
const TRAINER_SIDEBAR = [
  { icon: Activity,        label: "Dashboard",    path: "/dashboard" },
  { icon: CalendarDays,    label: "Agenda",        path: "/schedule" },
  { icon: Users,           label: "Alunos",        path: "/students" },
  { icon: Dumbbell,        label: "Treinos",       path: "/workouts" },
  { icon: TrendingUp,      label: "Progresso",     path: "/progress" },
  { icon: DollarSign,      label: "Financeiro",    path: "/payments" },
  { icon: MessageSquare,   label: "Mensagens",     path: "/messages" },
  { icon: BarChart3,       label: "Analytics",     path: "/analytics" },
  { icon: Bell,            label: "Notificações",  path: "/notifications" },
  { icon: Settings,        label: "Ajustes",       path: "/settings" },
];
const STUDENT_SIDEBAR = [
  { icon: Activity,        label: "Dashboard",    path: "/dashboard" },
  { icon: CalendarDays,    label: "Aulas",         path: "/schedule" },
  { icon: Dumbbell,        label: "Treinos",       path: "/workouts" },
  { icon: TrendingUp,      label: "Progresso",     path: "/progress" },
  { icon: MessageSquare,   label: "Mensagens",     path: "/messages" },
  { icon: Bell,            label: "Notificações",  path: "/notifications" },
  { icon: Settings,        label: "Ajustes",       path: "/settings" },
];

const TRAINER_BOTTOM = [
  { icon: Activity,        label: "Início",   path: "/dashboard" },
  { icon: CalendarDays,    label: "Agenda",    path: "/schedule" },
  { icon: Dumbbell,        label: "Treinos",   path: "/workouts" },
  { icon: MessageSquare,   label: "Chat",      path: "/messages" },
  { icon: Users,           label: "Alunos",    path: "/students" },
];
const STUDENT_BOTTOM = [
  { icon: Activity,        label: "Início",    path: "/dashboard" },
  { icon: CalendarDays,    label: "Aulas",      path: "/schedule" },
  { icon: Dumbbell,        label: "Treinos",    path: "/workouts" },
  { icon: TrendingUp,      label: "Progresso",  path: "/progress" },
  { icon: MessageSquare,   label: "Chat",       path: "/messages" },
];

/* ── Avatar ──────────────────────────────────────────────── */
export const Avatar = ({
  src, name, size = 9, clickable = false, onUpload,
}: {
  src?: string | null; name?: string; size?: number;
  clickable?: boolean; onUpload?: (url: string) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = (name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const s = `w-${size} h-${size}`;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    const ext  = file.name.split(".").pop();
    const path = `avatars/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar foto"); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    onUpload(data.publicUrl);
  };

  return (
    <div className={`${s} relative shrink-0`} onClick={() => clickable && fileRef.current?.click()}>
      {src ? (
        <img src={src} alt={name}
          className={`${s} rounded-full object-cover ring-2 ring-white/10 ${clickable ? "cursor-pointer" : ""}`} />
      ) : (
        <div className={`${s} rounded-full bg-primary/25 flex items-center justify-center font-black text-primary text-sm ${clickable ? "cursor-pointer" : ""}`}>
          {initials}
        </div>
      )}
      {clickable && (
        <>
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <Camera className="h-3.5 w-3.5 text-white" />
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
};

/* ── AppLayout ───────────────────────────────────────────── */
const NAV_H = 64; // bottom nav height in px (keep in sync with JSX)

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const { profile, role, user, signOut } = useAuth();
  const { theme, toggleTheme }           = useTheme();
  const { data: notifications }          = useNotifications();

  const isStudent  = role === "student";
  const sidebarNav = isStudent ? STUDENT_SIDEBAR : TRAINER_SIDEBAR;
  const bottomNav  = isStudent ? STUDENT_BOTTOM  : TRAINER_BOTTOM;
  const unread     = notifications?.filter(n => !n.is_read).length ?? 0;
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Foto atualizada!");
  };

  /* ── Sidebar bg & border colours (explicit, no CSS risk) */
  const sidebarBg  = theme === "dark" ? "#06040e" : "#1a0d3d";
  const sidebarBdr = theme === "dark" ? "#15102a" : "#2d1a5c";

  return (
    <div
      className="bg-background flex overflow-hidden"
      style={{ height: "100dvh", maxHeight: "-webkit-fill-available" }}
    >
      <OfflineBanner />

      {/* ═══ DESKTOP SIDEBAR ════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col w-[230px] fixed inset-y-0 left-0 z-40"
        style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBdr}` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <AppIcon size="sm" />
          </Link>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {sidebarNav.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            const badge  = path === "/notifications" && unread > 0;
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative ${
                  active
                    ? "bg-primary text-white font-semibold"
                    : "text-white/50 hover:bg-white/6 hover:text-white/80"
                }`}>
                <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={active ? 2.2 : 1.7} />
                <span>{label}</span>
                {badge && (
                  <span className="ml-auto min-w-[20px] h-5 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center px-1">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 space-y-1" style={{ borderTop: `1px solid ${sidebarBdr}` }}>
          <button onClick={toggleTheme} aria-label="Alternar tema de cores"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-white/50 hover:bg-white/6 hover:text-white/80 transition-all text-sm min-h-[44px]">
            {theme === "dark"
              ? <Sun  className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              : <Moon className="h-4 w-4 shrink-0" strokeWidth={1.7} />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar src={profile?.avatar_url} name={profile?.full_name} size={8} clickable onUpload={handleAvatarUpload} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white/80 truncate">{profile?.full_name ?? "—"}</p>
              <p className="text-[10px] text-white/35 capitalize">{role}</p>
            </div>
            <button onClick={handleSignOut} aria-label="Sair da conta" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/6 rounded-xl transition-all">
              <LogOut className="h-4 w-4 text-white/40" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══ MOBILE HEADER ══════════════════════════════════ */}
      <header
        className="lg:hidden fixed top-0 inset-x-0 z-40 border-b glass-header"
        style={{
          borderColor: "hsl(var(--border))",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left — avatar + name */}
          <div className="flex items-center gap-2.5">
            <Avatar src={profile?.avatar_url} name={profile?.full_name} size={8} clickable onUpload={handleAvatarUpload} />
            <div>
              {profile?.full_name ? (
                <>
                  <p className="font-bold text-[13px] leading-none">{profile.full_name.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{role}</p>
                </>
              ) : (
                <AppIcon size="sm" />
              )}
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-1.5">
            <Link to="/notifications"
              className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center press-scale">
              <Bell className="h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
              {unread > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Link>
            <button onClick={toggleTheme} aria-label="Alternar tema de cores"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center press-scale">
              {theme === "dark"
                ? <Sun  className="h-5 w-5 text-muted-foreground" />
                : <Moon className="h-5 w-5 text-muted-foreground" />}
            </button>
            <button onClick={handleSignOut} aria-label="Sair da conta"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center press-scale">
              <LogOut className="h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MOBILE BOTTOM TAB BAR ══════════════════════════ */}
      {/* NOTA: background inline para garantir visibilidade em qualquer tema */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-[100] border-t"
        style={{
          background: theme === "dark"
            ? "rgba(8, 5, 18, 0.97)"
            : "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderColor: "hsl(var(--border))",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div
          className="flex items-center justify-around"
          style={{ height: `${NAV_H}px` }}
        >
          {bottomNav.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            const badge  = path === "/notifications" && unread > 0;
            return (
              <Link
                key={path}
                to={path}
                className="nav-item press-scale"
                style={{ color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
              >
                <div className="relative">
                  <Icon
                    className="transition-transform duration-200"
                    style={{
                      width: 22, height: 22,
                      strokeWidth: active ? 2.3 : 1.7,
                      transform: active ? "scale(1.08)" : "scale(1)",
                    }}
                  />
                  {badge && (
                    <span
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2"
                      style={{ background: "hsl(var(--primary))", borderColor: theme === "dark" ? "#080512" : "#fff" }}
                    />
                  )}
                </div>
                <span style={{ fontWeight: active ? 700 : 500 }}>{label}</span>
                {active && (
                  <span
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ═══ MAIN CONTENT — scrolls independently ═══════════════ */}
      <main
        className="flex-1 lg:ml-[230px] overflow-y-auto overflow-x-hidden scroll-smooth"
        style={{
          height: "100dvh",
          WebkitOverflowScrolling: "touch",
          paddingTop: "calc(56px + env(safe-area-inset-top))",
          paddingBottom: `calc(${NAV_H}px + env(safe-area-inset-bottom) + 2rem)`,
        }}>
        <div className="px-4 py-6 md:px-8 lg:p-10 max-w-7xl mx-auto lg:pt-10 lg:pb-12 min-h-full flex flex-col">
          <StudentPaymentBanner />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
