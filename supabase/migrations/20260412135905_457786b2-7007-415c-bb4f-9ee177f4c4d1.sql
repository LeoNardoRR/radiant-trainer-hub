
-- Payment Plans (trainer creates plans like "Mensal 3x/semana")
CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  sessions_per_month INTEGER,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers manage own plans" ON public.payment_plans
  FOR ALL TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Students view plans from their trainer" ON public.payment_plans
  FOR SELECT TO authenticated
  USING (trainer_id = (SELECT trainer_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

-- Payments (individual charges)
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  student_id UUID NOT NULL,
  plan_id UUID REFERENCES public.payment_plans(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  reference_month TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Students view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Student Plan Assignments (which plan each student is on)
CREATE TABLE public.student_plan_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID NOT NULL,
  student_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, plan_id)
);

ALTER TABLE public.student_plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers manage student assignments" ON public.student_plan_assignments
  FOR ALL TO authenticated
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Students view own assignment" ON public.student_plan_assignments
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_payment_plans_updated_at
  BEFORE UPDATE ON public.payment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_plan_assignments_updated_at
  BEFORE UPDATE ON public.student_plan_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
