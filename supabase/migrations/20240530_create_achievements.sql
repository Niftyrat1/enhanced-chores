-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_period ON achievements(period);
CREATE INDEX IF NOT EXISTS idx_achievements_achieved ON achievements(achieved);

-- Add trigger for updating timestamps
CREATE TRIGGER update_achievements_updated_at
    BEFORE UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
