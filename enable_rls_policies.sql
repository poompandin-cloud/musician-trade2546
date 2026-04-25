-- Enable RLS (Row Level Security) for profiles and song_requests tables
-- This allows public read access but only owners can update their own data

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on song_requests table  
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can read song_requests" ON song_requests;
DROP POLICY IF EXISTS "Users can update own song_requests" ON song_requests;

-- Profiles table policies
-- 1. Public read access - anyone can read profile data
CREATE POLICY "Public can read profiles" ON profiles
    FOR SELECT USING (true);

-- 2. Users can update their own profile - only if auth.uid() matches the profile id
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. Users can insert their own profile - only if auth.uid() matches the profile id
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Song requests table policies
-- 1. Public read access - anyone can read song requests
CREATE POLICY "Public can read song_requests" ON song_requests
    FOR SELECT USING (true);

-- 2. Users can update their own song requests - only if auth.uid() matches the musician_id
CREATE POLICY "Users can update own song_requests" ON song_requests
    FOR UPDATE USING (auth.uid() = musician_id)
    WITH CHECK (auth.uid() = musician_id);

-- 3. Users can insert song requests - allow anyone to create song requests (for customer portal)
CREATE POLICY "Users can insert song_requests" ON song_requests
    FOR INSERT WITH CHECK (true);

-- 4. Users can delete their own song requests - only if auth.uid() matches the musician_id
CREATE POLICY "Users can delete own song_requests" ON song_requests
    FOR DELETE USING (auth.uid() = musician_id);

-- Additional policy for customers to manage their own requests
-- 5. Customers can update/delete their own song requests - if auth.uid() matches customer_id
CREATE POLICY "Customers can manage own song_requests" ON song_requests
    FOR UPDATE USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own song_requests" ON song_requests
    FOR DELETE USING (auth.uid() = customer_id);

-- Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON song_requests TO authenticated;
GRANT ALL ON song_requests TO anon;

-- Verify policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'song_requests')
ORDER BY tablename, policyname;
