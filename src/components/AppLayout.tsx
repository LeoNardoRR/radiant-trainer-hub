import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Bell,
  BarChart3,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: Users, label: "Alunos", path: "/students" },
  { icon: Bell, label: "Notificações", path: "/notifications" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: MessageSquare, label: "Mensagens", path: "/messages" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-background fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="text-editorial-sm tracking-[0.2em]">
            FITFLOW
          </Link>
        </div>
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-colors duration-300 group ${
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                <span className="text-sm font-body font-light">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-xs font-display">PT</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body truncate">Personal Trainer</p>
              <p className="text-xs text-muted-foreground font-body truncate">trainer@fitflow.com</p>
            </div>
            <Link to="/">
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="text-editorial-sm tracking-[0.2em]">
            FITFLOW
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          >
            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r border-border py-20 px-3"
              onClick={(e) => e.stopPropagation()}
            >
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-sm transition-colors ${
                      active ? "bg-accent text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    <span className="text-sm font-body font-light">{item.label}</span>
                  </Link>
                );
              })}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
