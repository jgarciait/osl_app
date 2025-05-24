-- Fixed version of get_user_groups function
CREATE OR REPLACE FUNCTION get_user_groups(user_id UUID)
RETURNS TABLE(group_id UUID, group_name TEXT, department TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE LOG 'Getting groups for user: %', user_id;
  
  RETURN QUERY
  SELECT 
    g.id as group_id,
    g.name as group_name,
    g.department
  FROM user_groups ug
  JOIN groups g ON ug.group_id = g.id
  WHERE ug.user_id = get_user_groups.user_id;
  
  -- Log the result count
  GET DIAGNOSTICS var_count = ROW_COUNT;
  RAISE LOG 'Found % groups for user %', var_count, user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_groups(UUID) TO authenticated;
