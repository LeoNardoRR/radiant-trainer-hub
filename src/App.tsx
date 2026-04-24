import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AnimatePresence, motion } from "framer-motion";
import { DemoModeProvider, useDemoMode } from "@/contexts/DemoModeContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import OnboardingTour from "@/components/OnboardingTour";
import ScrollToTop from "@/components/ScrollToTop";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { lazy, Suspense } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import InvitePage from "./pages/InvitePage";
import NotFound from "./pages/NotFound";

// Lazy loaded protected routes (Code Splitting)
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const StudentClassesPage = lazy(() => import("./pages/StudentClassesPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const WorkoutsPage = lazy(() => import("./pages/WorkoutsPage"));
const MyWorkoutsPage = lazy(() => import("./pages/MyWorkoutsPage"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  1000 * 60 * 3,  // 3 min
      gcTime:     1000 * 60 * 5,  // 5 min
      retry: (failureCount, error: any) => {
        // Don't retry on auth/permission errors
        const status = error?.status ?? error?.code;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      onError: (error: any) => {
        console.error("[Mutation error]", error);
      },
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
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  </motion.div>
);

// ── Demo banner ───────────────────────────────────────────────
const DemoBanner = () => {
  return null; // Disabled indefinitely

  const { isDemo, enable, disable } = useDemoMode();
  const { user } = useAuth();

  // Só mostra o banner quando o usuário está logado
  if (!user) return null;

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
          className="flex items-center gap-1.5 bg-foreground/80 text-background px-3 py-2 rounded-xl shadow-xl text-[11px] font-bold press-scale opacity-60 hover:opacity-100 transition-opacity">
          Ver demo
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
        <Route path="/"                   element={<PageWrap><LandingPage /></PageWrap>} />
        <Route path="/login"              element={<PageWrap><LoginPage /></PageWrap>} />
        <Route path="/signup"             element={<PageWrap><SignupPage /></PageWrap>} />
        <Route path="/forgot-password"    element={<PageWrap><ForgotPasswordPage /></PageWrap>} />
        <Route path="/invite/:code"       element={<PageWrap><InvitePage /></PageWrap>} />

        {/* Protected */}
        <Route path="/dashboard"    element={<ProtectedRoute><PageWrap><DashboardPage /></PageWrap></ProtectedRoute>} />
        <Route path="/schedule"     element={<ProtectedRoute><PageWrap><ScheduleRouter /></PageWrap></ProtectedRoute>} />
        <Route path="/leaderboard"  element={<ProtectedRoute><PageWrap><LeaderboardPage /></PageWrap></ProtectedRoute>} />
        
        {/* Trainer Only Routes */}
        <Route path="/students"     element={<ProtectedRoute allowedRoles={["trainer", "admin"]}><PageWrap><StudentsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/analytics"    element={<ProtectedRoute allowedRoles={["trainer", "admin"]}><PageWrap><AnalyticsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/payments"     element={<ProtectedRoute allowedRoles={["trainer", "admin"]}><PageWrap><PaymentsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/admin"        element={<ProtectedRoute allowedRoles={["admin"]}><PageWrap><AdminPage /></PageWrap></ProtectedRoute>} />
        
        {/* Shared/Student Routes */}
        <Route path="/notifications"element={<ProtectedRoute><PageWrap><NotificationsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/messages"     element={<ProtectedRoute><PageWrap><MessagesPage /></PageWrap></ProtectedRoute>} />
        <Route path="/settings"     element={<ProtectedRoute><PageWrap><SettingsPage /></PageWrap></ProtectedRoute>} />
        <Route path="/workouts"     element={<ProtectedRoute><PageWrap><WorkoutsRouter /></PageWrap></ProtectedRoute>} />
        <Route path="/progress"     element={<ProtectedRoute><PageWrap><ProgressPage /></PageWrap></ProtectedRoute>} />
        <Route path="*"             element={<PageWrap><NotFound /></PageWrap>} />
      </Routes>
    </AnimatePresence>
  );
};

// ── App root ───────────────────────────────────────────────────
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <DemoModeProvider>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
                <OnboardingTour />
                <DemoBanner />
                <PWAInstallPrompt />
              </DemoModeProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
