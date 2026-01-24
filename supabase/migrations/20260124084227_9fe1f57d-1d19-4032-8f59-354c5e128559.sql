-- Drop existing policies on family_trees
DROP POLICY IF EXISTS "Users can create their own trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can delete their trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can update their trees" ON public.family_trees;
DROP POLICY IF EXISTS "Users can view trees they own or collaborate on" ON public.family_trees;

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION public.set_family_tree_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS NULL THEN
    NEW.owner_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS set_family_tree_owner_trigger ON public.family_trees;
CREATE TRIGGER set_family_tree_owner_trigger
  BEFORE INSERT ON public.family_trees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_tree_owner();

-- Recreate policies EXPLICITLY as PERMISSIVE (this is the key fix)
CREATE POLICY "Users can create their own trees"
ON public.family_trees
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL AND (owner_user_id IS NULL OR owner_user_id = auth.uid()));

CREATE POLICY "Owners can delete their trees"
ON public.family_trees
AS PERMISSIVE
FOR DELETE
TO public
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their trees"
ON public.family_trees
AS PERMISSIVE
FOR UPDATE
TO public
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view trees they own or collaborate on"
ON public.family_trees
AS PERMISSIVE
FOR SELECT
TO public
USING (has_tree_access(auth.uid(), id));