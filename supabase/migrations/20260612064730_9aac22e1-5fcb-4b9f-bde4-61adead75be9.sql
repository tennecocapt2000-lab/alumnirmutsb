GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT SELECT ON public.payment_settings TO anon;
GRANT ALL ON public.payment_settings TO service_role;