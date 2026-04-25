-- SQL  script  to debug approval issue
--  Run this step by step to identify the problem

-- Step 1: Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity,
    forcerlspolicy
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 2: Check current policies
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

-- Step 3: Check admin users
SELECT 
    id,
    full_name,
    email,
    role,
    is_verified,
    verification_status
FROM profiles 
WHERE role = 'admin';

-- Step 4: Check pending verification requests
SELECT 
    id,
    full_name,
    email,
    role,
    is_verified,
    verification_status,
    created_at
FROM profiles 
WHERE verification_status = 'pending'
ORDER BY created_at DESC;

-- Step 5: Check unverified venues
SELECT 
    id,
    full_name,
    email,
    role,
    is_verified,
    verification_status,
    created_at
FROM profiles 
WHERE role = 'venue' AND is_verified = false
ORDER BY created_at DESC;

-- Step 6: Test if admin can read profiles (should work)
-- Replace 'YOUR_ADMIN_ID' with actual admin ID
-- SELECT * FROM profiles WHERE id = 'YOUR_ADMIN_ID';

-- Step 7: Test if admin can read other profiles (should work with policy)
-- Replace 'YOUR_ADMIN_ID' and 'TARGET_PROFILE_ID'
-- SELECT * FROM profiles WHERE id = 'TARGET_PROFILE_ID';

-- Step 8: Test manual update (this will show the real error)
-- Replace 'YOUR_ADMIN_ID' and 'TARGET_PROFILE_ID'
-- UPDATE profiles 
-- SET is_verified = true, verification_status = 'approved' 
-- WHERE id = 'TARGET_PROFILE_ID'
-- RETURNING *;

-- Step 9: Check if there are any constraints or triggers
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
    AND tc.table_schema = cc.constraint_schema
WHERE tc.table_name = 'profiles'
    AND tc.table_schema = 'public';

-- Step 10: Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND table_schema = 'public'
ORDER BY ordinal_position;
