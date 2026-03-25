
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('trainer', 'student');

-- Enum for session status
CREATE TYPE public.session_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'completed', 'missed');

-- Enum for student status  
CREATE TYPE public.student_status AS ENUM ('active', 'inactive', 'at_risk');

-- User roles table (security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  specialty TEXT,
  avatar_url TEXT,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status student_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trainer availability (recurring weekly slots)
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Sessions (the core booking table)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status session_status NOT NULL DEFAULT 'pending',
  session_type TEXT,
  notes TEXT,
  trainer_notes TEXT,
  suggested_date DATE,
  suggested_start_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Trainer settings
CREATE TABLE public.trainer_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  session_duration INT NOT NULL DEFAULT 60,
  break_between INT NOT NULL DEFAULT 15,
  cancel_limit_hours INT NOT NULL DEFAULT 2,
  max_sessions_per_day INT NOT NULL DEFAULT 8,
  retention_alert_days_light INT NOT NULL DEFAULT 3,
  retention_alert_days_moderate INT NOT NULL DEFAULT 5,
  retention_alert_days_critical INT NOT NULL DEFAULT 7,
  reminder_hours_before INT NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trainer_settings ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trainer_settings_updated_at BEFORE UPDATE ON public.trainer_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  -- If trainer, create default settings
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'trainer' THEN
    INSERT INTO public.trainer_settings (trainer_id) VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- profiles: trainers see their students, students see their trainer, everyone sees own
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Trainers can read their students" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid()
);
CREATE POLICY "Students can read their trainer" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'student') AND user_id IN (
    SELECT p.trainer_id FROM public.profiles p WHERE p.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Trainers can update student status" ON public.profiles FOR UPDATE USING (
  public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid()
);

-- availability: trainers manage own, students can read their trainer's
CREATE POLICY "Trainers manage own availability" ON public.availability FOR ALL USING (auth.uid() = trainer_id);
CREATE POLICY "Students can read trainer availability" ON public.availability FOR SELECT USING (
  trainer_id IN (SELECT p.trainer_id FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- sessions: both parties can read, students can create, trainers can update status
CREATE POLICY "Users can read own sessions" ON public.sessions FOR SELECT USING (
  auth.uid() = trainer_id OR auth.uid() = student_id
);
CREATE POLICY "Students can create sessions" ON public.sessions FOR INSERT WITH CHECK (
  auth.uid() = student_id
);
CREATE POLICY "Trainers can update sessions" ON public.sessions FOR UPDATE USING (
  auth.uid() = trainer_id
);
CREATE POLICY "Students can cancel own sessions" ON public.sessions FOR UPDATE USING (
  auth.uid() = student_id AND status = 'pending'
);

-- notifications: own only
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- messages: sender or receiver
CREATE POLICY "Users read own messages" ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users update read status" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- trainer_settings: own only
CREATE POLICY "Trainers manage own settings" ON public.trainer_settings FOR ALL USING (auth.uid() = trainer_id);

-- Indexes for performance
CREATE INDEX idx_sessions_trainer ON public.sessions(trainer_id, date);
CREATE INDEX idx_sessions_student ON public.sessions(student_id, date);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_messages_conversation ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_profiles_trainer ON public.profiles(trainer_id);
CREATE INDEX idx_availability_trainer ON public.availability(trainer_id, day_of_week);
