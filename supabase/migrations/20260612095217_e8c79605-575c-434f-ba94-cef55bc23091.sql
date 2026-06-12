
-- Grants for Data API access (were missing, causing silent failures)
GRANT SELECT ON public.payment_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Storage policies for payment-qr bucket so admins can upload directly from the browser
DROP POLICY IF EXISTS "Public can read payment-qr" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload payment-qr" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payment-qr" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payment-qr" ON storage.objects;

CREATE POLICY "Public can read payment-qr"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-qr');

CREATE POLICY "Admins can upload payment-qr"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-qr' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment-qr"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-qr' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payment-qr"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-qr' AND public.has_role(auth.uid(), 'admin'));
