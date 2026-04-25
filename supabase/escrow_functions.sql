-- Database Functions for Escrow & Live Tipping System

-- Function to add wallet balance
CREATE OR REPLACE FUNCTION add_wallet_balance(
    user_id_param UUID,
    amount_param DECIMAL,
    description_param TEXT DEFAULT 'Wallet deposit'
)
RETURNS VOID AS $$
DECLARE
    current_balance DECIMAL;
    new_balance DECIMAL;
BEGIN
    -- Get current balance
    SELECT COALESCE(wallet_balance, 0) INTO current_balance
    FROM profiles
    WHERE id = user_id_param;
    
    -- Calculate new balance
    new_balance := current_balance + amount_param;
    
    -- Update wallet balance
    UPDATE profiles
    SET wallet_balance = new_balance,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        created_at
    ) VALUES (
        user_id_param,
        'deposit',
        amount_param,
        current_balance,
        new_balance,
        description_param,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to subtract wallet balance
CREATE OR REPLACE FUNCTION subtract_wallet_balance(
    user_id_param UUID,
    amount_param DECIMAL,
    description_param TEXT DEFAULT 'Wallet withdrawal'
)
RETURNS VOID AS $$
DECLARE
    current_balance DECIMAL;
    new_balance DECIMAL;
BEGIN
    -- Get current balance
    SELECT COALESCE(wallet_balance, 0) INTO current_balance
    FROM profiles
    WHERE id = user_id_param;
    
    -- Check sufficient balance
    IF current_balance < amount_param THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Calculate new balance
    new_balance := current_balance - amount_param;
    
    -- Update wallet balance
    UPDATE profiles
    SET wallet_balance = new_balance,
        updated_at = NOW()
    WHERE id = user_id_param;
    
    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        created_at
    ) VALUES (
        user_id_param,
        'withdrawal',
        amount_param,
        current_balance,
        new_balance,
        description_param,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to increment gig tips
CREATE OR REPLACE FUNCTION increment_gig_tips(
    gig_id_param UUID,
    tip_amount_param DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE gigs
    SET 
        total_tips = COALESCE(total_tips, 0) + tip_amount_param,
        updated_at = NOW()
    WHERE id = gig_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to process song request and tip
CREATE OR REPLACE FUNCTION process_song_request(
    gig_id_param UUID,
    musician_id_param UUID,
    customer_id_param UUID,
    song_name_param TEXT,
    tip_amount_param DECIMAL
)
RETURNS UUID AS $$
DECLARE
    song_request_id UUID;
    platform_fee DECIMAL;
    musician_tip DECIMAL;
    current_balance DECIMAL;
BEGIN
    -- Calculate platform fee (10%)
    platform_fee := tip_amount_param * 0.10;
    musician_tip := tip_amount_param - platform_fee;
    
    -- Create song request
    INSERT INTO song_requests (
        gig_id,
        musician_id,
        customer_id,
        song_name,
        tip_amount,
        payment_status
    ) VALUES (
        gig_id_param,
        musician_id_param,
        customer_id_param,
        song_name_param,
        tip_amount_param,
        'paid'
    ) RETURNING id INTO song_request_id;
    
    -- Update musician wallet balance
    SELECT COALESCE(wallet_balance, 0) INTO current_balance
    FROM profiles
    WHERE id = musician_id_param;
    
    UPDATE profiles
    SET wallet_balance = current_balance + musician_tip,
        updated_at = NOW()
    WHERE id = musician_id_param;
    
    -- Create transaction for musician
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        reference_id,
        reference_type,
        description,
        created_at
    ) VALUES (
        musician_id_param,
        'tip_received',
        musician_tip,
        current_balance,
        current_balance + musician_tip,
        song_request_id,
        'song_request',
        'Tip for song: ' || song_name_param,
        NOW()
    );
    
    -- Update gig total tips
    UPDATE gigs
    SET 
        total_tips = COALESCE(total_tips, 0) + tip_amount_param,
        updated_at = NOW()
    WHERE id = gig_id_param;
    
    -- Record platform fee
    INSERT INTO platform_fees (
        gig_id,
        song_request_id,
        fee_amount,
        fee_type,
        percentage_rate,
        created_at
    ) VALUES (
        gig_id_param,
        song_request_id,
        platform_fee,
        'tip',
        10.00,
        NOW()
    );
    
    RETURN song_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process booking payment
CREATE OR REPLACE FUNCTION process_booking_payment(
    gig_id_param UUID,
    customer_id_param UUID,
    amount_param DECIMAL
)
RETURNS UUID AS $$
DECLARE
    booking_id UUID;
    current_balance DECIMAL;
BEGIN
    -- Create booking
    INSERT INTO bookings (
        gig_id,
        customer_id,
        amount_paid,
        status
    ) VALUES (
        gig_id_param,
        customer_id_param,
        amount_param,
        'confirmed'
    ) RETURNING id INTO booking_id;
    
    -- Get customer current balance
    SELECT COALESCE(wallet_balance, 0) INTO current_balance
    FROM profiles
    WHERE id = customer_id_param;
    
    -- Check sufficient balance
    IF current_balance < amount_param THEN
        RAISE EXCEPTION 'Insufficient balance for booking';
    END IF;
    
    -- Deduct from customer wallet
    UPDATE profiles
    SET wallet_balance = current_balance - amount_param,
        updated_at = NOW()
    WHERE id = customer_id_param;
    
    -- Create transaction for customer
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        reference_id,
        reference_type,
        description,
        created_at
    ) VALUES (
        customer_id_param,
        'deposit',
        amount_param,
        current_balance,
        current_balance - amount_param,
        booking_id,
        'booking',
        'Table booking payment',
        NOW()
    );
    
    -- Update gig escrow amount
    UPDATE gigs
    SET 
        escrow_amount = COALESCE(escrow_amount, 0) + amount_param,
        total_bookings = COALESCE(total_bookings, 0) + amount_param,
        booking_status = 'active',
        updated_at = NOW()
    WHERE id = gig_id_param;
    
    RETURN booking_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user earnings summary
CREATE OR REPLACE FUNCTION get_user_earnings_summary(
    user_id_param UUID,
    account_type_param TEXT
)
RETURNS TABLE(
    total_earnings DECIMAL,
    total_bookings DECIMAL,
    total_tips DECIMAL,
    platform_fees DECIMAL,
    net_earnings DECIMAL,
    completed_gigs BIGINT,
    pending_gigs BIGINT
) AS $$
BEGIN
    IF account_type_param = 'musician' THEN
        RETURN QUERY
        SELECT 
            COALESCE(SUM(g.total_bookings + g.total_tips), 0) as total_earnings,
            COALESCE(SUM(g.total_bookings), 0) as total_bookings,
            COALESCE(SUM(g.total_tips), 0) as total_tips,
            COALESCE(SUM((g.total_bookings + g.total_tips) * 0.10), 0) as platform_fees,
            COALESCE(SUM((g.total_bookings + g.total_tips) * 0.90), 0) as net_earnings,
            COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_gigs,
            COUNT(CASE WHEN g.status IN ('pending', 'in_progress', 'awaiting_approval') THEN 1 END) as pending_gigs
        FROM gigs g
        WHERE g.musician_id = user_id_param;
        
    ELSIF account_type_param = 'venue' THEN
        RETURN QUERY
        SELECT 
            COALESCE(SUM(g.total_bookings + g.total_tips), 0) as total_earnings,
            COALESCE(SUM(g.total_bookings), 0) as total_bookings,
            COALESCE(SUM(g.total_tips), 0) as total_tips,
            COALESCE(SUM((g.total_bookings + g.total_tips) * 0.10), 0) as platform_fees,
            COALESCE(SUM((g.total_bookings + g.total_tips) * 0.90), 0) as net_earnings,
            COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_gigs,
            COUNT(CASE WHEN g.status IN ('pending', 'in_progress', 'awaiting_approval') THEN 1 END) as pending_gigs
        FROM gigs g
        WHERE g.shop_id = user_id_param;
        
    ELSE -- customer
        RETURN QUERY
        SELECT 
            COALESCE(SUM(b.amount_paid), 0) as total_earnings,
            COALESCE(SUM(b.amount_paid), 0) as total_bookings,
            COALESCE(SUM(sr.tip_amount), 0) as total_tips,
            0 as platform_fees,
            COALESCE(SUM(b.amount_paid + sr.tip_amount), 0) as net_earnings,
            0 as completed_gigs,
            0 as pending_gigs
        FROM profiles p
        LEFT JOIN bookings b ON p.id = b.customer_id
        LEFT JOIN song_requests sr ON p.id = sr.customer_id
        WHERE p.id = user_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get gig earnings details
CREATE OR REPLACE FUNCTION get_gig_earnings_details(
    gig_id_param UUID
)
RETURNS TABLE(
    gig_id UUID,
    gig_title TEXT,
    musician_id UUID,
    venue_id UUID,
    total_bookings DECIMAL,
    total_tips DECIMAL,
    platform_fees DECIMAL,
    musician_payout DECIMAL,
    venue_payout DECIMAL,
    booking_count BIGINT,
    tip_count BIGINT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.title,
        g.musician_id,
        g.shop_id,
        COALESCE(g.total_bookings, 0) as total_bookings,
        COALESCE(g.total_tips, 0) as total_tips,
        COALESCE((g.total_bookings + g.total_tips) * 0.10, 0) as platform_fees,
        COALESCE((g.total_bookings + g.total_tips) * 0.90, 0) as musician_payout,
        0 as venue_payout, -- Venue doesn't get direct payout in this model
        COUNT(b.id) as booking_count,
        COUNT(sr.id) as tip_count,
        g.status
    FROM gigs g
    LEFT JOIN bookings b ON g.id = b.gig_id AND b.status = 'confirmed'
    LEFT JOIN song_requests sr ON g.id = sr.gig_id AND sr.payment_status = 'paid'
    WHERE g.id = gig_id_param
    GROUP BY g.id, g.title, g.musician_id, g.shop_id, g.total_bookings, g.total_tips, g.status;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_wallet_balance TO authenticated;
GRANT EXECUTE ON FUNCTION subtract_wallet_balance TO authenticated;
GRANT EXECUTE ON FUNCTION increment_gig_tips TO authenticated;
GRANT EXECUTE ON FUNCTION process_song_request TO authenticated;
GRANT EXECUTE ON FUNCTION process_booking_payment TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_earnings_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_gig_earnings_details TO authenticated;
