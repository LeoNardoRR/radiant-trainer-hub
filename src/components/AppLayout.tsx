import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Bell, BarChart3, MessageSquare, Settings, LogOut, Moon, Sun,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import OnboardingTour from "@/components/OnboardingTour";

const trainerNav = [
  { icon: LayoutDashboard, label: "Início", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: Users, label: "Alunos", path: "/students" },
  { icon: Bell, label: "Alertas", path: "/notifications" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: MessageSquare, label: "Chat", path: "/messages" },
  { icon: Settings, label: "Ajustes", path: "/settings" },
];

const studentNav = [
  { icon: LayoutDashboard, label: "Início", path: "/dashboard" },
  { icon: Calendar, label: "Agendar", path: "/schedule" },
  { icon: MessageSquare, label: "Chat", path: "/messages" },
  { icon: Bell, label: "Alertas", path: "/notifications" },
  { icon: Settings, label: "Ajustes", path: "/settings" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: notifications } = useNotifications();

  const navItems = role === "trainer" ? trainerNav : studentNav;
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
  const isStudent = role === "student";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className={`min-h-screen min-h-[100dvh] bg-background flex ${isStudent ? "theme-student" : ""}`}>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-xl focus:font-medium">
        Pular para o conteudo
      </a>
      <OnboardingTour />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] border-r border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40">
        <div className="p-5 pb-4">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm ${isStudent ? "bg-[hsl(var(--student-primary))]" : "bg-primary"}`}>
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <div>
              <span className="text-[13px] font-display font-semibold text-sidebar-foreground tracking-tight">FitApp</span>
              {isStudent && (
                <span className="ml-2 text-[9px] font-display bg-primary/12 text-primary px-1.5 py-0.5 rounded-full font-semibold">Aluno</span>
              )}
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const showBadge = item.path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-sidebar-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={active ? 2 : 1.5} />
                <span className="text-[13px]">{item.label}</span>
                {showBadge && (
                  <span className="absolute right-3 min-w-[20px] h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-semibold px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-sidebar-foreground hover:bg-secondary transition-colors min-h-[44px]">
            {theme === "dark" ? <Sun className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.5} /> : <Moon className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.5} />}
            <span className="text-[13px]">{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
          </button>
          <div className="flex items-center gap-3 px-2 py-2.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isStudent ? "bg-[hsl(var(--student-primary)/0.12)]" : "bg-primary/10"}`}>
              <span className="text-[13px] font-semibold text-primary">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate text-sidebar-foreground">{profile?.full_name || "Usuário"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
            </div>
            <button onClick={handleSignOut} title="Sair" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-secondary rounded-xl transition-colors">
              <LogOut className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-12" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isStudent ? "bg-[hsl(var(--student-primary))]" : "bg-primary"}`}>
              <span className="text-primary-foreground font-display text-xs font-bold">F</span>
            </div>
            <span className="text-[13px] font-display font-semibold text-foreground tracking-tight">FitApp</span>
          </div>
          <div className="flex items-center gap-0">
            <button onClick={toggleTheme} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground">
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <button onClick={handleSignOut} aria-label="Sair da conta" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground">
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
        <div className="flex items-center justify-around" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.path;
            const showBadge = item.path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 pt-2 pb-1 px-3 relative transition-colors min-h-[50px] min-w-[50px] justify-center active:scale-95 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-[22px] w-[22px]" strokeWidth={active ? 2 : 1.5} />
                <span className={`text-[10px] leading-none ${active ? "font-semibold text-primary" : "font-medium"}`}>{item.label}</span>
                {showBadge && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-semibold px-0.5 ring-2 ring-background">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="flex-1 lg:ml-[260px] pb-24 lg:pb-0 pt-12 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
