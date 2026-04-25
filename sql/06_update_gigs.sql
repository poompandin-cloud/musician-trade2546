-- Update gigs table to support escrow system
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_bookings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_tips DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'active', 'completed'));

-- Add indexes for new gig fields
CREATE INDEX IF NOT EXISTS idx_gigs_booking_status ON gigs(booking_status);
CREATE INDEX IF NOT EXISTS idx_gigs_escrow_amount ON gigs(escrow_amount);
