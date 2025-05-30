-- Check chores table structure and foreign keys
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    a.attname as column_name,
    confrelid::regclass as referenced_table,
    af.attname as referenced_column
FROM 
    pg_constraint c
JOIN 
    pg_attribute a ON a.attnum = c.confkey[1]
JOIN 
    pg_attribute af ON af.attnum = c.confkey[1]
WHERE 
    conrelid::regclass = 'chores'::regclass
    AND contype = 'f';

-- Check all foreign keys in the database
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    a.attname as column_name,
    confrelid::regclass as referenced_table,
    af.attname as referenced_column
FROM 
    pg_constraint c
JOIN 
    pg_attribute a ON a.attnum = c.confkey[1]
JOIN 
    pg_attribute af ON af.attnum = c.confkey[1]
WHERE 
    contype = 'f';

-- Check data in chores table
SELECT 
    id,
    title,
    category_id,
    assignee_id,
    categories.name as category_name,
    users.name as assignee_name
FROM 
    chores
LEFT JOIN 
    categories ON chores.category_id = categories.id
LEFT JOIN 
    users ON chores.assignee_id = users.id
ORDER BY 
    id DESC
LIMIT 10;
