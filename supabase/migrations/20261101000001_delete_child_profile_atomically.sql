-- Ventra P2: permanently purge a child's learning events, but retain a
-- non-identifying tombstone row until all authorised devices observe deletion.
-- Apply once in the Supabase SQL Editor before enabling the parent delete UI.
CREATE OR REPLACE FUNCTION public.delete_child_profile(p_profile_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  parent_id uuid;
  deleted_profile uuid;
BEGIN
  parent_id := auth.uid();
  IF parent_id IS NULL THEN
    RAISE EXCEPTION 'Oturum bulunamadı.';
  END IF;

  UPDATE public.player_profiles
  SET deleted_at = now()
  WHERE id = p_profile_id
    AND user_id = parent_id
    AND deleted_at IS NULL
  RETURNING id INTO deleted_profile;

  IF deleted_profile IS NULL THEN
    RAISE EXCEPTION 'Silinecek profil bulunamadı veya bu hesaba ait değil.';
  END IF;

  DELETE FROM public.progress_events
  WHERE profile_id = p_profile_id
    AND user_id = parent_id;

  RETURN deleted_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_child_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_child_profile(uuid) TO authenticated;
