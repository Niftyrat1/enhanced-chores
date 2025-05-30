-- Add missing columns to chores table
DO $$
BEGIN
    -- Add frequency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chores' AND column_name = 'frequency') THEN
        ALTER TABLE chores ADD COLUMN frequency VARCHAR(50) NOT NULL DEFAULT 'daily';
        RAISE NOTICE 'Added frequency column to chores table';
    END IF;

    -- Add difficulty column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chores' AND column_name = 'difficulty') THEN
        ALTER TABLE chores ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added difficulty column to chores table';
    END IF;

    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chores' AND column_name = 'priority') THEN
        ALTER TABLE chores ADD COLUMN priority VARCHAR(50) NOT NULL DEFAULT 'normal';
        RAISE NOTICE 'Added priority column to chores table';
    END IF;

    -- Add time_of_day column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chores' AND column_name = 'time_of_day') THEN
        ALTER TABLE chores ADD COLUMN time_of_day VARCHAR(50) NOT NULL DEFAULT 'any';
        RAISE NOTICE 'Added time_of_day column to chores table';
    END IF;

    -- Add seasonal_schedule column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chores' AND column_name = 'seasonal_schedule') THEN
        ALTER TABLE chores ADD COLUMN seasonal_schedule VARCHAR(50) NOT NULL DEFAULT 'none';
        RAISE NOTICE 'Added seasonal_schedule column to chores table';
    END IF;

    -- Add points column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'chores' AND column_name = 'points') THEN
        ALTER TABLE chores ADD COLUMN points INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added points column to chores table';
    END IF;

    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_chores_frequency ON chores(frequency);
    CREATE INDEX IF NOT EXISTS idx_chores_difficulty ON chores(difficulty);
    CREATE INDEX IF NOT EXISTS idx_chores_priority ON chores(priority);
    CREATE INDEX IF NOT EXISTS idx_chores_time_of_day ON chores(time_of_day);
    CREATE INDEX IF NOT EXISTS idx_chores_seasonal_schedule ON chores(seasonal_schedule);
    CREATE INDEX IF NOT EXISTS idx_chores_points ON chores(points);

    RAISE NOTICE 'Chores schema updated successfully';
END $$;
