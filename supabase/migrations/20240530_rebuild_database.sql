-- Drop existing tables in reverse dependency order
DO $$
BEGIN
    -- Drop foreign key constraints first
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_chore_category') THEN
        ALTER TABLE chores DROP CONSTRAINT fk_chore_category;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_chore_assignee') THEN
        ALTER TABLE chores DROP CONSTRAINT fk_chore_assignee;
    END IF;

    -- Drop tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
        DROP TABLE achievements;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        DROP TABLE categories;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chores') THEN
        DROP TABLE chores;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TABLE users;
    END IF;

    RAISE NOTICE 'Existing tables dropped successfully';
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    avatar_url TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chores table
CREATE TABLE IF NOT EXISTS chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    assignee_id UUID REFERENCES users(id),
    frequency VARCHAR(50) NOT NULL DEFAULT 'daily',
    difficulty INTEGER NOT NULL DEFAULT 1,
    priority VARCHAR(50) NOT NULL DEFAULT 'normal',
    time_of_day VARCHAR(50) NOT NULL DEFAULT 'any',
    seasonal_schedule VARCHAR(50) NOT NULL DEFAULT 'none',
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    points INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER NOT NULL,
    icon VARCHAR(50),
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chores_assignee ON chores(assignee_id);
CREATE INDEX IF NOT EXISTS idx_chores_category ON chores(category_id);
CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status);
CREATE INDEX IF NOT EXISTS idx_chores_due_date ON chores(due_date);
CREATE INDEX IF NOT EXISTS idx_chores_completed_at ON chores(completed_at);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

-- Add Row Level Security policies
DO $$
BEGIN
    -- Enable RLS on all tables
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    ALTER TABLE chores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

    -- Users policies
    CREATE POLICY view_users ON users
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id OR auth.role() = 'admin');

    CREATE POLICY update_own_user ON users
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

    CREATE POLICY admin_update_users ON users
        FOR UPDATE
        TO authenticated
        USING (auth.role() = 'admin');

    -- Categories policies
    CREATE POLICY view_categories ON categories
        FOR SELECT
        TO authenticated
        USING (true);

    CREATE POLICY admin_manage_categories ON categories
        FOR ALL
        TO authenticated
        USING (auth.role() = 'admin');

    -- Chores policies
    CREATE POLICY view_own_chores ON chores
        FOR SELECT
        TO authenticated
        USING (auth.uid() = assignee_id);

    CREATE POLICY manage_own_chores ON chores
        FOR ALL
        TO authenticated
        USING (auth.uid() = assignee_id)
        WITH CHECK (auth.uid() = assignee_id);

    CREATE POLICY admin_manage_chores ON chores
        FOR ALL
        TO authenticated
        USING (auth.role() = 'admin');

    -- Achievements policies
    CREATE POLICY view_own_achievements ON achievements
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

    CREATE POLICY admin_view_achievements ON achievements
        FOR SELECT
        TO authenticated
        USING (auth.role() = 'admin');

    CREATE POLICY admin_manage_achievements ON achievements
        FOR ALL
        TO authenticated
        USING (auth.role() = 'admin');

    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Create initial categories
DO $$
BEGIN
    INSERT INTO categories (name, color, icon)
    VALUES 
        ('Kitchen', '#4CAF50', 'fas fa-utensils'),
        ('Bathroom', '#2196F3', 'fas fa-shower'),
        ('Bedroom', '#9C27B0', 'fas fa-bed'),
        ('Outdoor', '#FF9800', 'fas fa-tree'),
        ('Pet Care', '#E91E63', 'fas fa-paw')
    ON CONFLICT (name) DO NOTHING;

    RAISE NOTICE 'Initial categories created successfully';
END $$;

-- Create trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at
    BEFORE UPDATE ON chores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE 'Database schema created successfully';
