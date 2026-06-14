-- C3: CHECK constraint on status
ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending','paid','confirmed','rejected'));

-- C4: unique member_no when present
CREATE UNIQUE INDEX applications_member_no_unique
  ON public.applications(member_no)
  WHERE member_no IS NOT NULL;