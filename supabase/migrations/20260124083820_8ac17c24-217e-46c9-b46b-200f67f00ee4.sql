-- Drop existing policies on family_trees
DROP POLICY IF EXISTS "Users can create their own trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can delete their trees" ON public.family_trees;
DROP POLICY IF EXISTS "Owners can update their trees" ON public.family_trees;
DROP POLICY IF EXISTS "Users can view trees they own or collaborate on" ON public.family_trees;

-- Create trigger function to auto-set owner_user_id
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

-- Create trigger
DROP TRIGGER IF EXISTS set_family_tree_owner_trigger ON public.family_trees;
CREATE TRIGGER set_family_tree_owner_trigger
  BEFORE INSERT ON public.family_trees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_family_tree_owner();

-- Recreate policies (without TO authenticated, letting auth.uid() handle security)
CREATE POLICY "Users can create their own trees"
ON public.family_trees
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (owner_user_id IS NULL OR owner_user_id = auth.uid()));

CREATE POLICY "Owners can delete their trees"
ON public.family_trees
FOR DELETE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update their trees"
ON public.family_trees
FOR UPDATE
USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can view trees they own or collaborate on"
ON public.family_trees
FOR SELECT
USING (has_tree_access(auth.uid(), id));