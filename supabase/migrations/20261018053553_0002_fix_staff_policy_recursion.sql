/*
# Fix staff policy recursion and harden membership checks

## Purpose
The first schema version used policies that checked membership by selecting from `staff` inside
policies on `staff` itself. PostgreSQL correctly rejected that as infinite recursion, which made
newly signed-in users unable to load their clinic profile.

## Changes
1. New function
- `is_clinic_staff()` is a SECURITY DEFINER membership helper with a fixed search path.
- It checks whether the current authenticated user has a row in `public.staff`.
- It is executable only by authenticated users, not anonymous users.

2. Policy changes
- Replace every repeated `EXISTS (SELECT ... FROM staff ...)` predicate with
  `is_clinic_staff()` on shared clinic tables and private media storage objects.
- Keep staff self-insert and self-update scoped directly to `auth.uid()`.
- No data is deleted or altered.

3. Security
- `staff` SELECT no longer recursively evaluates itself.
- All clinical records remain available only to authenticated clinic staff.
- The membership helper cannot be called by anonymous users.
*/

CREATE OR REPLACE FUNCTION public.is_clinic_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff
    WHERE public.staff.id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_clinic_staff() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_clinic_staff() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_clinic_staff() TO authenticated;

DROP POLICY IF EXISTS "staff_read_all" ON public.staff;
CREATE POLICY "staff_read_all" ON public.staff FOR SELECT
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "patients_select_staff" ON public.patients;
CREATE POLICY "patients_select_staff" ON public.patients FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "patients_insert_staff" ON public.patients;
CREATE POLICY "patients_insert_staff" ON public.patients FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "patients_update_staff" ON public.patients;
CREATE POLICY "patients_update_staff" ON public.patients FOR UPDATE
  TO authenticated USING (public.is_clinic_staff()) WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "patients_delete_staff" ON public.patients;
CREATE POLICY "patients_delete_staff" ON public.patients FOR DELETE
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "visits_select_staff" ON public.visits;
CREATE POLICY "visits_select_staff" ON public.visits FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "visits_insert_staff" ON public.visits;
CREATE POLICY "visits_insert_staff" ON public.visits FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "visits_update_staff" ON public.visits;
CREATE POLICY "visits_update_staff" ON public.visits FOR UPDATE
  TO authenticated USING (public.is_clinic_staff()) WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "visits_delete_staff" ON public.visits;
CREATE POLICY "visits_delete_staff" ON public.visits FOR DELETE
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "diagnoses_select_staff" ON public.diagnoses;
CREATE POLICY "diagnoses_select_staff" ON public.diagnoses FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "diagnoses_insert_staff" ON public.diagnoses;
CREATE POLICY "diagnoses_insert_staff" ON public.diagnoses FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "diagnoses_update_staff" ON public.diagnoses;
CREATE POLICY "diagnoses_update_staff" ON public.diagnoses FOR UPDATE
  TO authenticated USING (public.is_clinic_staff()) WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "diagnoses_delete_staff" ON public.diagnoses;
CREATE POLICY "diagnoses_delete_staff" ON public.diagnoses FOR DELETE
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "tooth_conditions_select_staff" ON public.tooth_conditions;
CREATE POLICY "tooth_conditions_select_staff" ON public.tooth_conditions FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "tooth_conditions_insert_staff" ON public.tooth_conditions;
CREATE POLICY "tooth_conditions_insert_staff" ON public.tooth_conditions FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "tooth_conditions_update_staff" ON public.tooth_conditions;
CREATE POLICY "tooth_conditions_update_staff" ON public.tooth_conditions FOR UPDATE
  TO authenticated USING (public.is_clinic_staff()) WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "tooth_conditions_delete_staff" ON public.tooth_conditions;
CREATE POLICY "tooth_conditions_delete_staff" ON public.tooth_conditions FOR DELETE
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "clinical_notes_select_staff" ON public.clinical_notes;
CREATE POLICY "clinical_notes_select_staff" ON public.clinical_notes FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "clinical_notes_insert_staff" ON public.clinical_notes;
CREATE POLICY "clinical_notes_insert_staff" ON public.clinical_notes FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "clinical_notes_update_staff" ON public.clinical_notes;
CREATE POLICY "clinical_notes_update_staff" ON public.clinical_notes FOR UPDATE
  TO authenticated USING (public.is_clinic_staff()) WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "clinical_notes_delete_staff" ON public.clinical_notes;
CREATE POLICY "clinical_notes_delete_staff" ON public.clinical_notes FOR DELETE
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "condition_definitions_select_staff" ON public.condition_definitions;
CREATE POLICY "condition_definitions_select_staff" ON public.condition_definitions FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "condition_definitions_insert_staff" ON public.condition_definitions;
CREATE POLICY "condition_definitions_insert_staff" ON public.condition_definitions FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "condition_definitions_update_staff" ON public.condition_definitions;
CREATE POLICY "condition_definitions_update_staff" ON public.condition_definitions FOR UPDATE
  TO authenticated USING (public.is_clinic_staff()) WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "condition_definitions_delete_staff" ON public.condition_definitions;
CREATE POLICY "condition_definitions_delete_staff" ON public.condition_definitions FOR DELETE
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "media_select_staff" ON public.media;
CREATE POLICY "media_select_staff" ON public.media FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "media_insert_staff" ON public.media;
CREATE POLICY "media_insert_staff" ON public.media FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "media_update_staff" ON public.media;
CREATE POLICY "media_update_staff" ON public.media FOR UPDATE
  TO authenticated USING (public.is_clinic_staff()) WITH CHECK (public.is_clinic_staff());
DROP POLICY IF EXISTS "media_delete_staff" ON public.media;
CREATE POLICY "media_delete_staff" ON public.media FOR DELETE
  TO authenticated USING (public.is_clinic_staff());

DROP POLICY IF EXISTS "audit_select_staff" ON public.audit_logs;
CREATE POLICY "audit_select_staff" ON public.audit_logs FOR SELECT
  TO authenticated USING (public.is_clinic_staff());
DROP POLICY IF EXISTS "audit_insert_staff" ON public.audit_logs;
CREATE POLICY "audit_insert_staff" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (public.is_clinic_staff());

DROP POLICY IF EXISTS "clinical_media_select_staff" ON storage.objects;
CREATE POLICY "clinical_media_select_staff" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'clinical-media' AND public.is_clinic_staff());
DROP POLICY IF EXISTS "clinical_media_insert_staff" ON storage.objects;
CREATE POLICY "clinical_media_insert_staff" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clinical-media' AND public.is_clinic_staff());
DROP POLICY IF EXISTS "clinical_media_update_staff" ON storage.objects;
CREATE POLICY "clinical_media_update_staff" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'clinical-media' AND public.is_clinic_staff())
  WITH CHECK (bucket_id = 'clinical-media' AND public.is_clinic_staff());
DROP POLICY IF EXISTS "clinical_media_delete_staff" ON storage.objects;
CREATE POLICY "clinical_media_delete_staff" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'clinical-media' AND public.is_clinic_staff());
