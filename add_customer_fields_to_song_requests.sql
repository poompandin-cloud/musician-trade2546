-- Add customer name and table number fields to song_requests table
-- This allows customers to provide their name and table number for song requests

-- Add customer_name field
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);

-- Add table_number field  
ALTER TABLE song_requests 
ADD COLUMN IF NOT EXISTS table_number INTEGER CHECK (table_number >= 1 AND table_number <= 20);

-- Update RLS policies to include the new fields in the insert policy
DROP POLICY IF EXISTS "Users can insert song requests" ON song_requests;

CREATE POLICY "Users can insert song requests" ON song_requests
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id OR
        (customer_name IS NOT NULL AND table_number IS NOT NULL)
    );

-- Grant permissions for the new fields
GRANT ALL ON song_requests TO anon;
GRANT ALL ON song_requests TO authenticated;

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'song_requests' 
    AND column_name IN ('customer_name', 'table_number')
ORDER BY column_name;
