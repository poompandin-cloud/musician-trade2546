-- Add tip_qr_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tip_qr_url TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_tip_qr_url ON profiles(tip_qr_url);

-- Update RLS policy to allow users to update their own tip_qr_url
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
