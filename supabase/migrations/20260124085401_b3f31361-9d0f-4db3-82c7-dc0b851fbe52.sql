-- Create a debug function to inspect request context
CREATE OR REPLACE FUNCTION public.debug_request_context()
RETURNS TABLE (
  auth_uid uuid,
  jwt_sub text,
  jwt_role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    auth.uid() as auth_uid,
    current_setting('request.jwt.claim.sub', true) as jwt_sub,
    current_setting('request.jwt.claim.role', true) as jwt_role;
$$;

-- Restrict access to authenticated users only
REVOKE EXECUTE ON FUNCTION public.debug_request_context() FROM public;
REVOKE EXECUTE ON FUNCTION public.debug_request_context() FROM anon;
GRANT EXECUTE ON FUNCTION public.debug_request_context() TO authenticated;