-- Migration: Add facebook_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN facebook_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook profile URL';
