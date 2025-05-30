-- Drop existing policies for all tables
DROP POLICY IF EXISTS "Allow anonymous users to insert chores" ON chores;
DROP POLICY IF EXISTS "Allow anonymous users to view chores" ON chores;
DROP POLICY IF EXISTS "Allow anonymous users to update chores" ON chores;
DROP POLICY IF EXISTS "Allow anonymous users to delete chores" ON chores;

DROP POLICY IF EXISTS "Allow anonymous users to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow anonymous users to view categories" ON categories;
DROP POLICY IF EXISTS "Allow anonymous users to update categories" ON categories;
DROP POLICY IF EXISTS "Allow anonymous users to delete categories" ON categories;

DROP POLICY IF EXISTS "Allow anonymous users to insert users" ON users;
DROP POLICY IF EXISTS "Allow anonymous users to view users" ON users;
DROP POLICY IF EXISTS "Allow anonymous users to update users" ON users;
DROP POLICY IF EXISTS "Allow anonymous users to delete users" ON users;

DROP POLICY IF EXISTS "Allow anonymous users to insert achievements" ON achievements;
DROP POLICY IF EXISTS "Allow anonymous users to view achievements" ON achievements;
DROP POLICY IF EXISTS "Allow anonymous users to update achievements" ON achievements;
DROP POLICY IF EXISTS "Allow anonymous users to delete achievements" ON achievements;

-- Create new policies for the anon role for chores table
CREATE POLICY "Allow anonymous users to insert chores"
ON chores
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to view chores"
ON chores
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to update chores"
ON chores
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to delete chores"
ON chores
FOR DELETE
TO anon
USING (true);

-- Create new policies for the anon role for categories table
CREATE POLICY "Allow anonymous users to insert categories"
ON categories
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to view categories"
ON categories
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to update categories"
ON categories
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to delete categories"
ON categories
FOR DELETE
TO anon
USING (true);

-- Create new policies for the anon role for users table
CREATE POLICY "Allow anonymous users to insert users"
ON users
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to view users"
ON users
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to update users"
ON users
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to delete users"
ON users
FOR DELETE
TO anon
USING (true);

-- Create new policies for the anon role for achievements table
CREATE POLICY "Allow anonymous users to insert achievements"
ON achievements
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous users to view achievements"
ON achievements
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to update achievements"
ON achievements
FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous users to delete achievements"
ON achievements
FOR DELETE
TO anon
USING (true);

-- Grant all privileges on all tables to anon role
GRANT ALL PRIVILEGES ON TABLE chores TO anon;
GRANT ALL PRIVILEGES ON TABLE categories TO anon;
GRANT ALL PRIVILEGES ON TABLE users TO anon;
GRANT ALL PRIVILEGES ON TABLE achievements TO anon;

-- Grant all privileges on all sequences in schema to anon role
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
