-- Enable RLS on categories table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories') THEN
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on categories table';
    END IF;
END $$;

-- Create policies for categories table
DO $$
BEGIN
    -- Policy for authenticated users to view all categories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_categories') THEN
        CREATE POLICY view_categories ON categories
            FOR SELECT
            TO authenticated
            USING (true);
        RAISE NOTICE 'Created view_categories policy';
    END IF;

    -- Policy for admin users to insert categories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_categories') THEN
        CREATE POLICY insert_categories ON categories
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.role() = 'admin');
        RAISE NOTICE 'Created insert_categories policy';
    END IF;

    -- Policy for admin users to update categories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update_categories') THEN
        CREATE POLICY update_categories ON categories
            FOR UPDATE
            TO authenticated
            USING (auth.role() = 'admin');
        RAISE NOTICE 'Created update_categories policy';
    END IF;

    -- Policy for admin users to delete categories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_categories') THEN
        CREATE POLICY delete_categories ON categories
            FOR DELETE
            TO authenticated
            USING (auth.role() = 'admin');
        RAISE NOTICE 'Created delete_categories policy';
    END IF;

    RAISE NOTICE 'RLS policies for categories table created successfully';
END $$;
