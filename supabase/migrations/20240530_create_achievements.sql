-- Create achievements table with detailed error checking
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'achievements') THEN
        BEGIN
            -- Create table
            CREATE TABLE achievements (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                period VARCHAR(50) NOT NULL,
                target_value INTEGER NOT NULL,
                current_value INTEGER DEFAULT 0,
                achieved BOOLEAN DEFAULT false,
                user_id UUID REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Verify table creation
            IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'achievements') THEN
                -- Verify columns
                IF EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'achievements' AND column_name = 'period') THEN
                    RAISE NOTICE 'Achievements table and period column created successfully';
                ELSE
                    RAISE EXCEPTION 'Period column not created successfully';
                END IF;
            ELSE
                RAISE EXCEPTION 'Achievements table not created successfully';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE EXCEPTION 'Error creating achievements table: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Achievements table already exists';
        -- Add missing columns if needed
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'achievements' AND column_name = 'period') THEN
            ALTER TABLE achievements ADD COLUMN period VARCHAR(50) NOT NULL DEFAULT 'daily';
            RAISE NOTICE 'Added missing period column to achievements table';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'achievements' AND column_name = 'target_value') THEN
            ALTER TABLE achievements ADD COLUMN target_value INTEGER NOT NULL DEFAULT 0;
            RAISE NOTICE 'Added missing target_value column to achievements table';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'achievements' AND column_name = 'current_value') THEN
            ALTER TABLE achievements ADD COLUMN current_value INTEGER DEFAULT 0;
            RAISE NOTICE 'Added missing current_value column to achievements table';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'achievements' AND column_name = 'achieved') THEN
            ALTER TABLE achievements ADD COLUMN achieved BOOLEAN DEFAULT false;
            RAISE NOTICE 'Added missing achieved column to achievements table';
        END IF;
    END IF;
END $$;

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for updating timestamps
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'achievements') THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
        -- Create new trigger
        CREATE TRIGGER update_achievements_updated_at
            BEFORE UPDATE ON achievements
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger created';
    END IF;
END $$;

-- Create indexes for better performance
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'achievements') THEN
        CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
        CREATE INDEX IF NOT EXISTS idx_achievements_period ON achievements(period);
        CREATE INDEX IF NOT EXISTS idx_achievements_achieved ON achievements(achieved);
        RAISE NOTICE 'Indexes created';
    END IF;
END $$;
