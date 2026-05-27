
-- payment_settings
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  application_fee numeric NOT NULL DEFAULT 200,
  qr_code_url text,
  payment_instruction text,
  show_qr_code boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active payment settings"
ON public.payment_settings FOR SELECT
TO anon, authenticated
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert payment settings"
ON public.payment_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update payment settings"
ON public.payment_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete payment settings"
ON public.payment_settings FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE UNIQUE INDEX payment_settings_only_one_active
ON public.payment_settings (is_active)
WHERE is_active = true;

CREATE TRIGGER payment_settings_set_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- applications snapshot columns
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS payment_bank_name text,
  ADD COLUMN IF NOT EXISTS payment_account_name text,
  ADD COLUMN IF NOT EXISTS payment_account_number text,
  ADD COLUMN IF NOT EXISTS payment_qr_code_url text;

-- Storage bucket for QR
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr', 'payment-qr', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read payment-qr"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-qr');

CREATE POLICY "Admins upload payment-qr"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-qr' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update payment-qr"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'payment-qr' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete payment-qr"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-qr' AND has_role(auth.uid(), 'admin'::app_role));
