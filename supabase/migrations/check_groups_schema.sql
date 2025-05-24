-- Check the actual structure of the groups table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'groups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any existing groups
SELECT * FROM public.groups LIMIT 5;
