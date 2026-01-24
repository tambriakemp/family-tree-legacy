-- Remove the SECURITY DEFINER trigger that may cause context issues
DROP TRIGGER IF EXISTS set_family_tree_owner_trigger ON public.family_trees;
DROP FUNCTION IF EXISTS public.set_family_tree_owner();

-- Drop all existing policies on family_trees
DROP POLICY IF EXISTS "Users can create their own trees" ON public.family_trees;
DROP POLICY IF EXISTS "Users can view trees they own or collaborate on" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can update their trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can delete their trees" ON public.family_trees;

-- Recreate policies with explicit TO authenticated and simpler logic

-- INSERT: User must provide their own user_id as owner
CREATE POLICY "Users can create their own trees"
ON public.family_trees
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (owner_user_id = auth.uid());

-- SELECT: Users can view trees they own or collaborate on
CREATE POLICY "Users can view trees they own or collaborate on"
ON public.family_trees
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (has_tree_access(auth.uid(), id));

-- UPDATE: Only owners can update
CREATE POLICY "Owners can update their trees"
ON public.family_trees
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (owner_user_id = auth.uid());

-- DELETE: Only owners can delete
CREATE POLICY "Owners can delete their trees"
ON public.family_trees
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (owner_user_id = auth.uid());