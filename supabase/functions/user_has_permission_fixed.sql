-- Fixed version of user_has_permission function
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, resource TEXT, action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  is_user_admin BOOLEAN := FALSE;
BEGIN
  -- Log the input parameters for debugging
  RAISE LOG 'Checking permission for user: %, resource: %, action: %', user_id, resource, action;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
    RAISE LOG 'User % does not exist', user_id;
    RETURN FALSE;
  END IF;

  -- Check if the user is admin first
  SELECT is_admin(user_id) INTO is_user_admin;
  
  IF is_user_admin THEN
    RAISE LOG 'User % is admin, granting permission', user_id;
    RETURN TRUE;
  END IF;

  -- Check if the user has the permission through their groups
  SELECT EXISTS (
    SELECT 1
    FROM user_groups ug
    JOIN group_permissions gp ON ug.group_id = gp.group_id
    JOIN permissions p ON gp.permission_id = p.id
    WHERE ug.user_id = user_has_permission.user_id
    AND p.resource = user_has_permission.resource
    AND p.action = user_has_permission.action
  ) INTO has_permission;
  
  RAISE LOG 'Permission check result for user %: %', user_id, has_permission;
  
  RETURN has_permission;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT, TEXT) TO authenticated;
