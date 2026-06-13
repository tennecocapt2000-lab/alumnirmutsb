
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_badge text NOT NULL DEFAULT 'สมาคมศิษย์เก่า มทร.สุวรรณภูมิ',
  hero_title_line1 text NOT NULL DEFAULT 'ลงทะเบียนสมาชิก',
  hero_title_line2 text NOT NULL DEFAULT 'ออนไลน์ ง่าย รวดเร็ว',
  is_singleton boolean NOT NULL DEFAULT true UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.site_settings (hero_badge, hero_title_line1, hero_title_line2)
VALUES ('สมาคมศิษย์เก่า มทร.สุวรรณภูมิ', 'ลงทะเบียนสมาชิก', 'ออนไลน์ ง่าย รวดเร็ว');
