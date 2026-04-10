import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import { DemoModeProvider, useDemoMode } from "@/contexts/DemoModeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import SchedulePage from "./pages/SchedulePage";
import StudentClassesPage from "./pages/StudentClassesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import StudentsPage from "./pages/StudentsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import WorkoutsPage from "./pages/WorkoutsPage";
import MyWorkoutsPage from "./pages/MyWorkoutsPage";
import ProgressPage from "./pages/ProgressPage";
import PaymentsPage from "./pages/PaymentsPage";
import InvitePage from "./pages/InvitePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 min
      retry: 1,
    },
  },
});

// ── Page transition wrapper ────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } },
};

const PageWrap = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ willChange: "opacity, transform" }}
  >
    {children}
  </motion.div>
);

// ── Demo banner ───────────────────────────────────────────────
const DemoBanner = () => {
  const { isDemo, enable, disable } = useDemoMode();
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1.8, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      // Sits ABOVE the 64px bottom nav + safe-area
      style={{
        position: "fixed",
        bottom: "calc(64px + env(safe-area-inset-bottom) + 12px)",
        right: 16,
        zIndex: 90,
      }}
      className="lg:bottom-6 lg:right-6"
    >
      {isDemo ? (
        <button
          onClick={disable}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold press-scale">
          <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
          Demo ativo — desativar
        </button>
      ) : (
        <button
          onClick={enable}
          className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold press-scale">
          Ver dados de exemplo
        </button>
      )}
    </motion.div>
  );
};

// ── Role-based routers ─────────────────────────────────────────
const ScheduleRouter = () => {
  const { role } = useAuth();
  return role === "student" ? <StudentClassesPage /> : <SchedulePage />;
};

const WorkoutsRouter = () => {
  const { role } = useAuth();
  return role === "student" ? <MyWorkoutsPage /> : <WorkoutsPage />;
};

// ── Animated routes with location key ─────────────────────────
const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/"            element={<PageWrap><LandingPage /></PageWrap>} />
        <Route path="/login"       element={<PageWrap><LoginPage /></PageWrap>} />
        <Route path="/signup"      element={<PageWrap><SignupPage /></PageWrap>} />
        <Route path="/invite/:code" element={<PageWrap><InvitePage /></PageWrap>} />

        {/* Protected */}
        <Route path="/dashboard"    element={<ProtectedRoute><PageWrap><DashboardPage /></PageWrap></ProtectedRoute>} />
        <Route path="/schedule"     element={<ProtectedRoute><PageWrap><ScheduleRouter /></PageWrap></ProtectedRoute>} />
        <Route path="/leaderboard"  element={<ProtectedRoute><PageWrap><LeaderboardPage /></PageWrap></ProtectedRoute>} />
        <Route path="/students"     element={<ProtectedRoute><PageWrap><StudentsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/notifications"element={<ProtectedRoute><PageWrap><NotificationsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/analytics"    element={<ProtectedRoute><PageWrap><AnalyticsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/messages"     element={<ProtectedRoute><PageWrap><MessagesPage /></PageWrap></ProtectedRoute>} />
        <Route path="/settings"     element={<ProtectedRoute><PageWrap><SettingsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/workouts"     element={<ProtectedRoute><PageWrap><WorkoutsRouter /></PageWrap></ProtectedRoute>} />
        <Route path="/progress"     element={<ProtectedRoute><PageWrap><ProgressPage /></PageWrap></ProtectedRoute>} />
        <Route path="/payments"     element={<ProtectedRoute><PageWrap><PaymentsPage /></PageWrap></ProtectedRoute>} />
        <Route path="*"             element={<PageWrap><NotFound /></PageWrap>} />
      </Routes>
    </AnimatePresence>
  );
};

// ── App root ───────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DemoModeProvider>
              <AppRoutes />
              <DemoBanner />
            </DemoModeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
