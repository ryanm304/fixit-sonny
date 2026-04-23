-- Create a secure function for admins to get user emails
CREATE OR REPLACE FUNCTION public.get_user_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id as user_id, email::text
  FROM auth.users;
$$;

-- Only admins can execute this function
REVOKE EXECUTE ON FUNCTION public.get_user_emails() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_emails() TO authenticated;
