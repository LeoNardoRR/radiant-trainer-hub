import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Bell, BarChart3, MessageSquare, Settings, Menu, X, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-background fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-border">
          <Link to="/dashboard" className="text-editorial-sm tracking-[0.2em]">FITFLOW</Link>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const showBadge = item.path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors duration-300 group relative ${
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-sm font-body font-light">{item.label}</span>
                {showBadge && (
                  <span className="absolute right-3 w-5 h-5 rounded-full bg-foreground text-primary-foreground text-[10px] flex items-center justify-center font-display">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-xs font-display">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body truncate">{profile?.full_name || "Usuário"}</p>
              <p className="text-[10px] text-muted-foreground font-body truncate">{profile?.email}</p>
            </div>
            <button onClick={handleSignOut} title="Sair">
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          {navItems.slice(0, 5).map((item) => {
            const active = location.pathname === item.path;
            const showBadge = item.path === "/notifications" && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 relative transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[9px] font-body">{item.label}</span>
                {showBadge && (
                  <span className="absolute -top-0.5 right-0 w-4 h-4 rounded-full bg-foreground text-primary-foreground text-[8px] flex items-center justify-center font-display">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-0.5 py-1 px-2 text-muted-foreground"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[9px] font-body">Sair</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 lg:ml-60 pb-20 lg:pb-0">
        <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
