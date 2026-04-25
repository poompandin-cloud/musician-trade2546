-- SQL  script  to fix admin approval issue
--  This will create a simple policy that allows admins to update any profile

-- Step 1: Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update verification status" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Step 2: Create new comprehensive policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can create their own profile
CREATE POLICY "Users can create own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile (except verification fields)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND 
                (is_verified IS NULL OR verification_status IS NULL));

-- Admins can update any profile (for verification)
CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Step 3: Test the policy
-- Check current admin users
SELECT id, full_name, role, email 
FROM profiles 
WHERE role = 'admin';

-- Step 4: Verify policies are created
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
WHERE tablename = 'profiles';

-- Step 5: Test manual update (uncomment to test)
-- UPDATE profiles 
-- SET is_verified = true, verification_status = 'approved' 
-- WHERE id = 'YOUR_PROFILE_ID_HERE';
