-- Create song_requests table for live tipping
CREATE TABLE IF NOT EXISTS song_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    musician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    song_name VARCHAR(255) NOT NULL,
    tip_amount DECIMAL(10,2) NOT NULL CHECK (tip_amount >= 0),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for song_requests
CREATE INDEX IF NOT EXISTS idx_song_requests_gig_id ON song_requests(gig_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_musician_id ON song_requests(musician_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_customer_id ON song_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_payment_status ON song_requests(payment_status);

-- Enable RLS
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY IF NOT EXISTS "Users can view song requests for their gigs" ON song_requests
    FOR SELECT USING (
        auth.uid() = musician_id OR 
        auth.uid() = customer_id OR
        EXISTS (SELECT 1 FROM gigs WHERE id = song_requests.gig_id AND shop_id = auth.uid())
    );

CREATE POLICY IF NOT EXISTS "Users can insert song requests" ON song_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);
