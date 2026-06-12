-- 1) Restrict applications SELECT to admins only
DROP POLICY IF EXISTS "Public can read applications" ON public.applications;

-- 2) Tighten INSERT policy with basic validation
DROP POLICY IF EXISTS "Anyone can submit application" ON public.applications;
CREATE POLICY "Anyone can submit application"
  ON public.applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(prefix)) BETWEEN 1 AND 20
    AND length(btrim(full_name)) BETWEEN 2 AND 200
    AND phone ~ '^[0-9+\-\s]{6,20}$'
    AND coalesce(length(student_id), 0) <= 30
    AND coalesce(length(note), 0) <= 1000
    AND coalesce(length(admin_note), 0) = 0
    AND coalesce(status, 'pending') = 'pending'
    AND member_no IS NULL
    AND approved_by IS NULL
    AND approved_at IS NULL
    AND coalesce(payment_amount, 0) BETWEEN 0 AND 100000
  );

-- 3) Tighten payment-slips upload: file extension whitelist + filename length
DROP POLICY IF EXISTS "Anyone can upload payment slip" ON storage.objects;
CREATE POLICY "Anyone can upload payment slip"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'payment-slips'
    AND lower(storage.extension(name)) = ANY (ARRAY['jpg','jpeg','png','webp','pdf'])
    AND length(name) BETWEEN 5 AND 200
    AND owner IS NULL
  );