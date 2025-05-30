-- Create initial user records
INSERT INTO users (id, name, email)
VALUES 
    ('4e5f8b9c-1a2b-3c4d-5e6f-7a8b9c0d1e2f', 'Mom', 'mom@example.com'),
    ('8a9b0c1d-2e3f-4b5c-6d7e-8a9b0c1d2e3f', 'Dad', 'dad@example.com'),
    ('c1d2e3f4-5a6b-7c8d-9e0f-a1b2c3d4e5f6', 'Thomas', 'thomas@example.com'),
    ('f4e3d2c1-b0a9-8765-4321-f0e9d8c7b6a5', 'Any', 'any@example.com');

-- Add unique constraint to name column
ALTER TABLE users ADD CONSTRAINT users_name_key UNIQUE (name);
