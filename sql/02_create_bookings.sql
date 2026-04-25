-- Create bookings table for customer table deposits
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount_paid DECIMAL(10,2) NOT NULL CHECK (amount_paid > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_gig_id ON bookings(gig_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);
