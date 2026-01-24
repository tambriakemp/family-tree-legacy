-- Create a diagnostic function to see exact DB identity
CREATE OR REPLACE FUNCTION public.debug_db_identity()
RETURNS TABLE(
  auth_uid uuid,
  db_current_user text,
  db_session_user text,
  jwt_role text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    auth.uid() as auth_uid,
    current_user::text as db_current_user,
    session_user::text as db_session_user,
    current_setting('request.jwt.claim.role', true) as jwt_role;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own trees" ON public.family_trees;
DROP POLICY IF EXISTS "Users can view trees they own or collaborate on" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can update their trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can delete their trees" ON public.family_trees;

-- Recreate policies with TO public but require auth.uid() IS NOT NULL
-- This ensures policies apply regardless of DB role, but still require authentication

CREATE POLICY "Users can create their own trees"
ON public.family_trees
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL AND owner_user_id = auth.uid());

CREATE POLICY "Users can view trees they own or collaborate on"
ON public.family_trees
AS PERMISSIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL AND has_tree_access(auth.uid(), id));

CREATE POLICY "Owners can update their trees"
ON public.family_trees
AS PERMISSIVE
FOR UPDATE
TO public
USING (auth.uid() IS NOT NULL AND owner_user_id = auth.uid());

CREATE POLICY "Owners can delete their trees"
ON public.family_trees
AS PERMISSIVE
FOR DELETE
TO public
USING (auth.uid() IS NOT NULL AND owner_user_id = auth.uid());