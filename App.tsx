import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Students } from '@/pages/Students';
import { Schedule } from '@/pages/Schedule';
import { Retention } from '@/pages/Retention';
import { Alerts } from '@/pages/Alerts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="alunos" element={<Students />} />
            <Route path="agenda" element={<Schedule />} />
            <Route path="retencao" element={<Retention />} />
            <Route path="alertas" element={<Alerts />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(222 18% 10%)',
            border: '1px solid hsl(222 16% 18%)',
            color: 'hsl(210 20% 94%)',
          },
        }}
      />
    </QueryClientProvider>
  );
}
