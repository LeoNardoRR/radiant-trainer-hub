import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Bell, BarChart3, MessageSquare, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const trainerNav = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: Users, label: "Alunos", path: "/students" },
  { icon: Bell, label: "Notificações", path: "/notifications" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: MessageSquare, label: "Mensagens", path: "/messages" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const studentNav = [
  { icon: LayoutDashboard, label: "Meu Painel", path: "/dashboard" },
  { icon: Calendar, label: "Agendar", path: "/schedule" },
  { icon: Bell, label: "Notificações", path: "/notifications" },
  { icon: MessageSquare, label: "Mensagens", path: "/messages" },
  { icon: Settings, label: "Config", path: "/settings" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const { data: notifications } = useNotifications();

  const navItems = role === "trainer" ? trainerNav : studentNav;
  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm font-bold">F</span>
            </div>
            <span className="text-editorial-sm tracking-[0.15em] text-sidebar-foreground">APPFIT</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const showBadge = item.path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  active
                    ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-primary"
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] ${active ? "text-sidebar-primary" : ""}`} strokeWidth={active ? 2 : 1.5} />
                <span className="text-sm font-body">{item.label}</span>
                {showBadge && (
                  <span className="absolute right-3 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-display font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-2 ring-primary/20">
              <span className="text-sm font-display font-bold text-primary">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium truncate text-sidebar-foreground">{profile?.full_name || "Usuário"}</p>
              <p className="text-[10px] text-muted-foreground font-body truncate">{profile?.email}</p>
            </div>
            <button onClick={handleSignOut} title="Sair" className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-sidebar-accent rounded-lg transition-colors">
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-risk transition-colors" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border shadow-lg shadow-foreground/5">
        <div className="flex items-center justify-around py-1" style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}>
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.path;
            const showBadge = item.path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2 relative transition-colors min-h-[48px] min-w-[48px] justify-center rounded-lg ${
                  active ? "text-primary" : "text-muted-foreground active:text-primary"
                }`}
              >
                <item.icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.5} />
                <span className={`text-[9px] font-body ${active ? "font-semibold" : ""}`}>{item.label}</span>
                {showBadge && (
                  <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-display font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 lg:ml-60 pb-24 lg:pb-0">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
