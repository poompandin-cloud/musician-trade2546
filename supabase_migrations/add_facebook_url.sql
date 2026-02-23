-- Migration: Add facebook_url column to profiles table
-- Description: Add Facebook profile URL field to profiles table with proper security

-- Add facebook_url column
ALTER TABLE profiles 
ADD COLUMN facebook_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook profile URL with full https://www.facebook.com/ format';

-- Update Row Level Security (RLS) policy to include facebook_url
-- This ensures only profile owners can update their facebook_url

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new comprehensive policy
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Ensure the policy covers all profile fields including facebook_url
-- The auth.uid() = id check ensures users can only update their own profile

-- Optional: Add index for better performance if searching by facebook_url
-- CREATE INDEX idx_profiles_facebook_url ON profiles(facebook_url) WHERE facebook_url IS NOT NULL;
