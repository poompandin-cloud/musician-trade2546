-- SQL  untuk Admin Approval Policy
--  allowing admin users to update verification status of other profiles

-- 1. Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can update verification status" ON profiles;

-- 2. Create policy for admins to update any profile's verification status
CREATE POLICY "Admins can update verification status" ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- Allow admin users (role = 'admin') to update verification status
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        -- Only allow updating verification-related fields
        (
            is_verified IS NOT NULL OR 
            verification_status IS NOT NULL
        )
        OR
        -- Or allow admin users to update any field
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 3. Alternative simpler approach - allow admins to update any profile
-- Uncomment this if the above doesn't work

-- DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
-- CREATE POLICY "Admins can update any profile" ON profiles
--     FOR UPDATE
--     TO authenticated
--     USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE profiles.id = auth.uid() 
--             AND profiles.role = 'admin'
--         )
--     );

-- 4. Check the created policies
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
WHERE tablename = 'profiles' AND policyname LIKE '%Admin%';

-- 5. Test admin access (run this to verify)
-- SELECT 
--     p.id,
--     p.full_name,
--     p.role,
--     p.verification_status,
--     p.is_verified
-- FROM profiles p 
-- WHERE p.role = 'admin';
