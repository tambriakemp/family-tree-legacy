-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own trees" ON public.family_trees;

-- Recreate as PERMISSIVE policy (default)
CREATE POLICY "Users can create their own trees" 
ON public.family_trees 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

-- Also fix other policies to be permissive
DROP POLICY IF EXISTS "Owners can delete their trees" ON public.family_trees;
CREATE POLICY "Owners can delete their trees" 
ON public.family_trees 
FOR DELETE 
TO authenticated
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owners can update their trees" ON public.family_trees;
CREATE POLICY "Owners can update their trees" 
ON public.family_trees 
FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can view trees they own or collaborate on" ON public.family_trees;
CREATE POLICY "Users can view trees they own or collaborate on" 
ON public.family_trees 
FOR SELECT 
TO authenticated
USING (has_tree_access(auth.uid(), id));