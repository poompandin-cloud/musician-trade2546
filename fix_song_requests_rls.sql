-- Drop existing policies
DROP POLICY IF EXISTS "Users can view song requests for their gigs" ON song_requests;
DROP POLICY IF EXISTS "Users can insert song requests" ON song_requests;

-- Create new policies that allow guest users
CREATE POLICY "Users can view song requests for their gigs" ON song_requests
    FOR SELECT USING (
        auth.uid() = musician_id OR 
        auth.uid() = customer_id OR
        customer_id IS NULL OR
        EXISTS (SELECT 1 FROM gigs WHERE id = song_requests.gig_id AND musician_id = auth.uid())
    );

CREATE POLICY "Users can insert song requests" ON song_requests
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id OR 
        customer_id IS NULL
    );

CREATE POLICY "Users can update song requests" ON song_requests
    FOR UPDATE USING (auth.uid() = musician_id);

CREATE POLICY "Users can delete song requests" ON song_requests
    FOR DELETE USING (auth.uid() = musician_id OR auth.uid() = customer_id);
