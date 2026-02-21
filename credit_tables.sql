-- สร้างตารางสำหรับบันทึกประวัติการณ์การเครดิต
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- จำนวนเครดิต (บวก/ลบ)
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('monthly_reset', 'job_application', 'job_completion', 'admin_adjustment')),
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    balance_after INTEGER NOT NULL -- ยอดเครดิตหลังจากการทำรายการ
);

-- สร้างตารางสำหรับบันทึกประวัติการณ์การใช้เครดิต
CREATE TABLE IF NOT EXISTS credit_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    credits_used INTEGER NOT NULL, -- จำนวนเครดิตที่ใช้
    job_title TEXT NOT NULL, -- ชื่องานที่สมัคร
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- สร้าง Index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_usage_user_id ON credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_created_at ON credit_usage(created_at DESC);

-- เปิดใช้งาน RLS (Row Level Security)
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับ credit_transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit transactions" ON credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- สร้าง Policy สำหรับ credit_usage
CREATE POLICY "Users can view own credit usage" ON credit_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit usage" ON credit_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- สร้างฟังก์ชันสำหรับบันทึกประวัติการณ์การเครดิตอัตโนมัติ
CREATE OR REPLACE FUNCTION log_credit_transaction(
    p_user_id UUID,
    p_amount INTEGER,
    p_transaction_type TEXT,
    p_description TEXT
) RETURNS VOID AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- ดึงยอดเครดิตปัจจุบัน
    SELECT COALESCE(credits, 0) INTO current_balance
    FROM profiles
    WHERE id = p_user_id;
    
    -- บันทึกประวัติการณ์
    INSERT INTO credit_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        balance_after
    ) VALUES (
        p_user_id,
        p_amount,
        p_transaction_type,
        p_description,
        current_balance + p_amount
    );
    
    -- อัปเดตยอดเครดิต
    UPDATE profiles
    SET credits = current_balance + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- สร้างฟังก์ชันสำหรับบันทึกการใช้เครดิต
CREATE OR REPLACE FUNCTION log_credit_usage(
    p_user_id UUID,
    p_job_id UUID,
    p_credits_used INTEGER,
    p_job_title TEXT
) RETURNS VOID AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- ดึงยอดเครดิตปัจจุบัน
    SELECT COALESCE(credits, 0) INTO current_balance
    FROM profiles
    WHERE id = p_user_id;
    
    -- ตรวจสอบว่ามีเครดิตพอหรือไม่
    IF current_balance < p_credits_used THEN
        RAISE EXCEPTION 'Insufficient credits: required %, available %', p_credits_used, current_balance;
    END IF;
    
    -- บันทึกการใช้เครดิต
    INSERT INTO credit_usage (
        user_id,
        job_id,
        credits_used,
        job_title
    ) VALUES (
        p_user_id,
        p_job_id,
        p_credits_used,
        p_job_title
    );
    
    -- อัปเดตยอดเครดิต
    UPDATE profiles
    SET credits = current_balance - p_credits_used
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
