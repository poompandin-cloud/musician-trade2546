-- Business Pivot: Escrow & Live Tipping System
-- Migration to support customer payments, escrow, and live tipping

-- 1. Update profiles table to support wallet system
ALTER TABLE profiles 
ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN account_type VARCHAR(20) DEFAULT 'musician' CHECK (account_type IN ('musician', 'venue', 'customer'));

-- Add indexes for performance
CREATE INDEX idx_profiles_account_type ON profiles(account_type);
CREATE INDEX idx_profiles_wallet_balance ON profiles(wallet_balance);

-- 2. Create bookings table for customer table deposits
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
CREATE INDEX idx_bookings_gig_id ON bookings(gig_id);
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- 3. Create song_requests table for live tipping
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
CREATE INDEX idx_song_requests_gig_id ON song_requests(gig_id);
CREATE INDEX idx_song_requests_musician_id ON song_requests(musician_id);
CREATE INDEX idx_song_requests_customer_id ON song_requests(customer_id);
CREATE INDEX idx_song_requests_payment_status ON song_requests(payment_status);

-- 4. Create platform_fees table to track earnings
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
CREATE INDEX idx_platform_fees_gig_id ON platform_fees(gig_id);
CREATE INDEX idx_platform_fees_fee_type ON platform_fees(fee_type);

-- 5. Update gigs table to support escrow system
ALTER TABLE gigs 
ADD COLUMN escrow_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN total_bookings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN total_tips DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'active', 'completed'));

-- Add indexes for new gig fields
CREATE INDEX idx_gigs_booking_status ON gigs(booking_status);
CREATE INDEX idx_gigs_escrow_amount ON gigs(escrow_amount);

-- 6. Create transactions table for wallet tracking
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'tip_received', 'booking_release', 'platform_fee')),
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    reference_id UUID, -- Can reference bookings, song_requests, etc.
    reference_type VARCHAR(20), -- 'booking', 'song_request', etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- 7. Create function to automatically release escrow when gig is completed
CREATE OR REPLACE FUNCTION release_escrow_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- When gig status changes to completed, release escrow to musician
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Calculate total amount to release (bookings + tips - platform fees)
        DECLARE
            total_amount DECIMAL(10,2);
            platform_fee DECIMAL(10,2);
            musician_amount DECIMAL(10,2);
        BEGIN
            -- Get total bookings and tips for this gig
            SELECT 
                COALESCE(SUM(amount_paid), 0) + COALESCE(SUM(tip_amount), 0)
            INTO total_amount
            FROM (
                SELECT amount_paid, 0 as tip_amount FROM bookings WHERE gig_id = NEW.id AND status = 'confirmed'
                UNION ALL
                SELECT 0 as amount_paid, tip_amount FROM song_requests WHERE gig_id = NEW.id AND payment_status = 'paid'
            ) combined;
            
            -- Calculate platform fee (10%)
            platform_fee := total_amount * 0.10;
            musician_amount := total_amount - platform_fee;
            
            -- Update musician's wallet balance
            UPDATE profiles 
            SET wallet_balance = wallet_balance + musician_amount
            WHERE id = NEW.musician_id;
            
            -- Record platform fee
            INSERT INTO platform_fees (gig_id, fee_amount, fee_type, percentage_rate)
            VALUES (NEW.id, platform_fee, 'booking', 10.00);
            
            -- Update gig totals
            UPDATE gigs 
            SET 
                escrow_amount = 0,
                total_bookings = (SELECT COALESCE(SUM(amount_paid), 0) FROM bookings WHERE gig_id = NEW.id AND status = 'confirmed'),
                total_tips = (SELECT COALESCE(SUM(tip_amount), 0) FROM song_requests WHERE gig_id = NEW.id AND payment_status = 'paid'),
                booking_status = 'completed'
            WHERE id = NEW.id;
            
            -- Record transaction for musician
            INSERT INTO transactions (user_id, transaction_type, amount, balance_before, balance_after, reference_id, reference_type, description)
            SELECT 
                NEW.musician_id,
                'booking_release',
                musician_amount,
                wallet_balance,
                wallet_balance + musician_amount,
                NEW.id,
                'gig',
                'Escrow release for gig completion'
            FROM profiles 
            WHERE id = NEW.musician_id;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for automatic escrow release
CREATE TRIGGER trigger_release_escrow_payment
    AFTER UPDATE ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION release_escrow_payment();

-- 9. Set up RLS policies for new tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- RLS policies for song_requests
CREATE POLICY "Users can view song requests for their gigs" ON song_requests
    FOR SELECT USING (
        auth.uid() = musician_id OR 
        auth.uid() = customer_id OR
        EXISTS (SELECT 1 FROM gigs WHERE id = song_requests.gig_id AND shop_id = auth.uid())
    );

CREATE POLICY "Users can insert song requests" ON song_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for platform_fees (admin only)
CREATE POLICY "Admin can view all platform fees" ON platform_fees
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'venue')
    );

-- 10. Create view for gig earnings summary
CREATE OR REPLACE VIEW gig_earnings_summary AS
SELECT 
    g.id,
    g.title,
    g.instrument,
    g.musician_id,
    COALESCE(SUM(b.amount_paid), 0) as total_bookings,
    COALESCE(SUM(sr.tip_amount), 0) as total_tips,
    COALESCE(SUM(b.amount_paid), 0) + COALESCE(SUM(sr.tip_amount), 0) as total_earnings,
    COALESCE(SUM(b.amount_paid), 0) * 0.10 + COALESCE(SUM(sr.tip_amount), 0) * 0.10 as platform_fees,
    (COALESCE(SUM(b.amount_paid), 0) + COALESCE(SUM(sr.tip_amount), 0)) * 0.90 as musician_payout,
    g.status,
    g.booking_status
FROM gigs g
LEFT JOIN bookings b ON g.id = b.gig_id AND b.status = 'confirmed'
LEFT JOIN song_requests sr ON g.id = sr.gig_id AND sr.payment_status = 'paid'
GROUP BY g.id, g.title, g.instrument, g.musician_id, g.status, g.booking_status;
