-- Complete migration for Escrow & Live Tipping System

-- 1. Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'musician' CHECK (account_type IN ('musician', 'venue', 'customer'));

-- 2. Create bookings table
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

-- 3. Create song_requests table
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

-- 4. Create platform_fees table
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

-- 5. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'tip_received', 'booking_release', 'platform_fee')),
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Update gigs table
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS escrow_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_bookings DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total_tips DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'active', 'completed'));

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_balance ON profiles(wallet_balance);
CREATE INDEX IF NOT EXISTS idx_bookings_gig_id ON bookings(gig_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_song_requests_gig_id ON song_requests(gig_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_musician_id ON song_requests(musician_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_customer_id ON song_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_song_requests_payment_status ON song_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_platform_fees_gig_id ON platform_fees(gig_id);
CREATE INDEX IF NOT EXISTS idx_platform_fees_fee_type ON platform_fees(fee_type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_gigs_booking_status ON gigs(booking_status);
CREATE INDEX IF NOT EXISTS idx_gigs_escrow_amount ON gigs(escrow_amount);

-- 8. Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 9. RLS policies
CREATE POLICY IF NOT EXISTS "Users can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY IF NOT EXISTS "Users can view song requests for their gigs" ON song_requests
    FOR SELECT USING (
        auth.uid() = musician_id OR 
        auth.uid() = customer_id OR
        EXISTS (SELECT 1 FROM gigs WHERE id = song_requests.gig_id AND shop_id = auth.uid())
    );

CREATE POLICY IF NOT EXISTS "Users can insert song requests" ON song_requests
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY IF NOT EXISTS "Admin can view all platform fees" ON platform_fees
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND account_type = 'venue')
    );

CREATE POLICY IF NOT EXISTS "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);
