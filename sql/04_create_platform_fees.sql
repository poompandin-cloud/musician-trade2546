-- Create platform_fees table to track earnings
CREATE TABLE IF NOT EXISTS platform_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    song_request_id UUID REFERENCES song_requests(id) ON DELETE CASCADE,
    fee_amount DECIMAL(10,2) NOT NULL CHECK (fee_amount > 0),
    fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('booking', 'tip')),
    percentage_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for platform_fees
CREATE INDEX IF NOT EXISTS idx_platform_fees_gig_id ON platform_fees(gig_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_fee_type ON platform_fees(fee_type);

-- Enable RLS
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;

-- RLS policies (admin only)
CREATE POLICY IF NOT EXISTS "Admin can view all platform fees" ON platform_fees
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'venue')
    );
