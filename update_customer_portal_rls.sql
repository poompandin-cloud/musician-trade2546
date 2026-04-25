-- Update RLS Policies to allow Customer Portal public access
-- This allows anonymous users to insert song requests without authentication

-- Drop existing policies for song_requests
DROP POLICY IF EXISTS "Public can read song_requests" ON song_requests;
DROP POLICY IF EXISTS "Users can update own song_requests" ON song_requests;
DROP POLICY IF EXISTS "Users can insert song_requests" ON song_requests;
DROP POLICY IF EXISTS "Users can delete own song_requests" ON song_requests;
DROP POLICY IF EXISTS "Customers can manage own song_requests" ON song_requests;

-- Create new policies for public access
-- 1. Public read access - anyone can read song requests
CREATE POLICY "Public can read song_requests" ON song_requests
    FOR SELECT USING (true);

-- 2. Public insert access - anyone can insert song requests (for customer portal)
CREATE POLICY "Public can insert song_requests" ON song_requests
    FOR INSERT WITH CHECK (true);

-- 3. Users can update their own song requests - only if auth.uid() matches musician_id
CREATE POLICY "Users can update own song_requests" ON song_requests
    FOR UPDATE USING (auth.uid() = musician_id)
    WITH CHECK (auth.uid() = musician_id);

-- 4. Users can delete their own song requests - only if auth.uid() matches musician_id
CREATE POLICY "Users can delete own song_requests" ON song_requests
    FOR DELETE USING (auth.uid() = musician_id);

-- Grant necessary permissions
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
WHERE tablename IN ('song_requests')
ORDER BY tablename, policyname;
