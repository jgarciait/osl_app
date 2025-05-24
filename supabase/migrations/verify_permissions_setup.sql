-- Verify that all required tables and data exist

-- Check if permissions table has data
SELECT 'permissions' as table_name, count(*) as row_count FROM permissions
UNION ALL
SELECT 'groups' as table_name, count(*) as row_count FROM groups
UNION ALL
SELECT 'group_permissions' as table_name, count(*) as row_count FROM group_permissions
UNION ALL
SELECT 'user_groups' as table_name, count(*) as row_count FROM user_groups;

-- Check specific permissions
SELECT p.resource, p.action, p.name, p.description 
FROM permissions p 
ORDER BY p.resource, p.action;

-- Check groups
SELECT g.id, g.name, g.department, g.description 
FROM groups g 
ORDER BY g.name;

-- Check group permissions mapping
SELECT 
  g.name as group_name,
  p.resource,
  p.action,
  p.name as permission_name
FROM group_permissions gp
JOIN groups g ON gp.group_id = g.id
JOIN permissions p ON gp.permission_id = p.id
ORDER BY g.name, p.resource, p.action;

-- Check user group assignments
SELECT 
  ug.user_id,
  g.name as group_name,
  g.department
FROM user_groups ug
JOIN groups g ON ug.group_id = g.id
ORDER BY ug.user_id;
