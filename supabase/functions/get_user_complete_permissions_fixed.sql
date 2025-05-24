CREATE OR REPLACE FUNCTION public.get_user_complete_permissions(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  is_admin_user boolean := false;
  user_groups_data json;
  user_permissions_data json;
BEGIN
  -- Check if user is admin
  SELECT EXISTS(
    SELECT 1 FROM public.user_groups ug
    JOIN public.groups g ON ug.group_id = g.id
    WHERE ug.user_id = $1 AND g.name = 'admin'
  ) INTO is_admin_user;

  -- Get user groups (only select columns that exist)
  SELECT COALESCE(json_agg(json_build_object(
    'id', g.id,
    'name', g.name,
    'description', COALESCE(g.description, '')
  )), '[]'::json)
  INTO user_groups_data
  FROM public.user_groups ug
  JOIN public.groups g ON ug.group_id = g.id
  WHERE ug.user_id = $1;

  -- Get user permissions (deduplicated)
  SELECT COALESCE(json_agg(DISTINCT json_build_object(
    'id', p.id,
    'name', p.name,
    'resource', p.resource,
    'action', p.action
  )), '[]'::json)
  INTO user_permissions_data
  FROM public.user_groups ug
  JOIN public.group_permissions gp ON ug.group_id = gp.group_id
  JOIN public.permissions p ON gp.permission_id = p.id
  WHERE ug.user_id = $1;

  -- Build final result
  SELECT json_build_object(
    'is_admin', is_admin_user,
    'groups', user_groups_data,
    'permissions', user_permissions_data
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_complete_permissions(uuid) TO authenticated;
