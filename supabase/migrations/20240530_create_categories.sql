-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20),
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint to chores table
ALTER TABLE chores 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id),
DROP COLUMN IF EXISTS category;

-- Add index for category_id
CREATE INDEX IF NOT EXISTS idx_chore_category_id ON chores(category_id);

-- Add trigger for updating timestamps
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add initial categories
INSERT INTO categories (name, color, icon)
VALUES 
    ('Kitchen', '#4CAF50', 'fas fa-utensils'),
    ('Bathroom', '#2196F3', 'fas fa-shower'),
    ('Bedroom', '#9C27B0', 'fas fa-bed'),
    ('Outdoor', '#FF9800', 'fas fa-tree'),
    ('Pet Care', '#E91E63', 'fas fa-paw');
