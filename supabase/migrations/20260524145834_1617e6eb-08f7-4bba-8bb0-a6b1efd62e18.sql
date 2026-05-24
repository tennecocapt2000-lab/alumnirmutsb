
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Make payment-slips bucket private; we'll use signed URLs in admin view
UPDATE storage.buckets SET public = false WHERE id = 'payment-slips';

DROP POLICY IF EXISTS "Public read payment slip" ON storage.objects;

CREATE POLICY "Admins read payment slips" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-slips' AND public.has_role(auth.uid(), 'admin'));
