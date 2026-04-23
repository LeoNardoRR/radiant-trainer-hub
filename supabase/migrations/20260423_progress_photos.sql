-- Create progress_photos table
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    type TEXT CHECK (type IN ('front', 'side', 'back', 'other')) DEFAULT 'other',
    captured_at DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

-- Policies
-- Trainers can see and manage photos of their students
CREATE POLICY "Trainers can manage student photos" 
ON public.progress_photos
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = progress_photos.student_id 
        AND p.trainer_id = auth.uid()
    )
);

-- Students can see their own photos
CREATE POLICY "Students can see own photos" 
ON public.progress_photos
FOR SELECT 
TO authenticated
USING (auth.uid() = student_id);

-- Students can upload their own photos (optional, depending on business logic)
CREATE POLICY "Students can upload own photos" 
ON public.progress_photos
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = student_id);

-- Create storage bucket for progress photos
-- Note: This part usually needs to be done via Supabase Dashboard or API, 
-- but we can add the storage policy here.

-- Allow public access to photos (or restricted)
-- For simplicity, let's assume the bucket 'progress-photos' exists.
