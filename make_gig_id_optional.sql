-- Make gig_id optional in song_requests table for fallback
-- This allows song requests to be created without a gig if gig creation fails

ALTER TABLE song_requests 
ALTER COLUMN gig_id DROP NOT NULL;

-- Add a default value for existing records
ALTER TABLE song_requests 
ALTER COLUMN gig_id SET DEFAULT NULL;

-- Update RLS policy to allow inserts without gig_id
DROP POLICY IF EXISTS "Users can insert song requests" ON song_requests;

CREATE POLICY "Users can insert song requests" ON song_requests
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id OR 
        customer_id IS NULL
    );
