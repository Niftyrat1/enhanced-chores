-- Enable RLS on chores table if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'chores') THEN
        ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on chores table';
    END IF;
END $$;

-- Create policies for chores table
DO $$
BEGIN
    -- Policy for authenticated users to view their own chores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_own_chores') THEN
        CREATE POLICY view_own_chores ON chores
            FOR SELECT
            USING (auth.uid() = assignee_id);
        RAISE NOTICE 'Created view_own_chores policy';
    END IF;

    -- Policy for authenticated users to insert their own chores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_own_chores') THEN
        CREATE POLICY insert_own_chores ON chores
            FOR INSERT
            WITH CHECK (auth.uid() = assignee_id);
        RAISE NOTICE 'Created insert_own_chores policy';
    END IF;

    -- Policy for authenticated users to update their own chores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update_own_chores') THEN
        CREATE POLICY update_own_chores ON chores
            FOR UPDATE
            USING (auth.uid() = assignee_id);
        RAISE NOTICE 'Created update_own_chores policy';
    END IF;

    -- Policy for authenticated users to delete their own chores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_own_chores') THEN
        CREATE POLICY delete_own_chores ON chores
            FOR DELETE
            USING (auth.uid() = assignee_id);
        RAISE NOTICE 'Created delete_own_chores policy';
    END IF;

    RAISE NOTICE 'RLS policies for chores table created successfully';
END $$;
