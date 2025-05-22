CREATE OR REPLACE FUNCTION user_belongs_to_department(p_user_id UUID, p_department_id INT)
RETURNS BOOLEAN AS $$
DECLARE
  belongs BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_groups ug
    JOIN departments_group dg ON ug.group_id = dg.group_id
    WHERE ug.user_id = p_user_id
    AND dg.department_id = p_department_id
  ) INTO belongs;
  
  RETURN belongs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
