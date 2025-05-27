-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create chores table
CREATE TABLE IF NOT EXISTS chores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    assignee_id UUID REFERENCES users(id),
    frequency VARCHAR(50) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    time_of_day VARCHAR(50),
    seasonal_schedule VARCHAR(50),
    required_tools TEXT,
    notes TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    points INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chore_status ON chores(status);
CREATE INDEX IF NOT EXISTS idx_chore_due_date ON chores(due_date);
CREATE INDEX IF NOT EXISTS idx_chore_category ON chores(category);
CREATE INDEX IF NOT EXISTS idx_chore_assignee ON chores(assignee_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chores_updated_at
    BEFORE UPDATE ON chores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
