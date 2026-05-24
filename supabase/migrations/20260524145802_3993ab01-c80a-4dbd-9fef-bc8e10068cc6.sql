
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefix TEXT NOT NULL,
  full_name TEXT NOT NULL,
  birth_date DATE,
  -- current address
  current_house_no TEXT,
  current_moo TEXT,
  current_soi TEXT,
  current_road TEXT,
  current_subdistrict TEXT,
  current_district TEXT,
  current_province TEXT,
  current_postal_code TEXT,
  phone TEXT NOT NULL,
  -- workplace
  work_house_no TEXT,
  work_moo TEXT,
  work_soi TEXT,
  work_road TEXT,
  work_subdistrict TEXT,
  work_district TEXT,
  work_province TEXT,
  work_postal_code TEXT,
  work_phone TEXT,
  -- education
  education_level TEXT,
  student_id TEXT,
  enrollment_year TEXT,
  major TEXT,
  study_period TEXT,
  friend_1 TEXT,
  friend_2 TEXT,
  -- payment
  payment_amount NUMERIC NOT NULL DEFAULT 200,
  payment_date DATE,
  payment_slip_url TEXT,
  note TEXT,
  -- admin
  status TEXT NOT NULL DEFAULT 'pending',
  member_no TEXT,
  admin_note TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a new application
CREATE POLICY "Anyone can submit application" ON public.applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Public read for status search (intentional)
CREATE POLICY "Public can read applications" ON public.applications
  FOR SELECT TO anon, authenticated
  USING (true);

-- Admins can update / delete
CREATE POLICY "Admins update applications" ON public.applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete applications" ON public.applications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX idx_applications_phone ON public.applications(phone);

-- Storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-slips', 'payment-slips', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload payment slip" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'payment-slips');

CREATE POLICY "Public read payment slip" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'payment-slips');

CREATE POLICY "Admins manage payment slips" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'payment-slips' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'payment-slips' AND public.has_role(auth.uid(), 'admin'));
