-- =====================================================
-- อัปเกรดระบบสมาชิกและเครดิต
-- =====================================================

-- 0. สร้างตาราง profiles ถ้ายังไม่มี (สำหรับ Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. สร้างหรืออัปเดตตาราง profiles
-- เพิ่มคอลัมน์ใหม่ถ้ายังไม่มีอยู่

DO $$ 
BEGIN
    -- เพิ่ม full_name ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;

    -- เพิ่ม phone ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone TEXT;
    END IF;

    -- เพิ่ม line_id ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'line_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN line_id TEXT;
    END IF;

    -- เพิ่ม avatar_url ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
    END IF;

    -- เพิ่ม credits ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'credits'
    ) THEN
        ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 25 NOT NULL;
    END IF;
END $$;

-- 2. สร้างตาราง credit_logs สำหรับเก็บประวัติการใช้เครดิต
CREATE TABLE IF NOT EXISTS credit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    action_type TEXT NOT NULL, -- เช่น 'earned', 'spent', 'bonus', 'refund'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- สร้าง index สำหรับเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_credit_logs_user_id ON credit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_logs_created_at ON credit_logs(created_at DESC);

-- 3. ตั้งค่า Row Level Security (RLS) สำหรับ profiles
-- เปิดใช้ RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy: ทุกคนอ่านโปรไฟล์ได้ (Public Read)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles
    FOR SELECT
    USING (true);

-- สร้าง Policy: เฉพาะเจ้าของบัญชีเท่านั้นที่อัปเดตโปรไฟล์ตัวเองได้
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- สร้าง Policy: ผู้ใช้สามารถสร้างโปรไฟล์ตัวเองได้เมื่อสมัครสมาชิก
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 4. ตั้งค่า Row Level Security (RLS) สำหรับ credit_logs
ALTER TABLE credit_logs ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy: ผู้ใช้สามารถอ่านประวัติเครดิตของตัวเองได้เท่านั้น
DROP POLICY IF EXISTS "Users can view own credit logs" ON credit_logs;
CREATE POLICY "Users can view own credit logs"
    ON credit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- สร้าง Policy: ผู้ใช้สามารถเพิ่ม credit_log ของตัวเองได้
-- หมายเหตุ: สำหรับการอัปเดตเครดิตจากระบบ (backend) อาจต้องใช้ service role key
DROP POLICY IF EXISTS "Users can insert own credit logs" ON credit_logs;
CREATE POLICY "Users can insert own credit logs"
    ON credit_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. สร้าง Function สำหรับอัปเดตเครดิตอัตโนมัติ (Optional)
CREATE OR REPLACE FUNCTION update_profile_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- อัปเดตเครดิตในตาราง profiles เมื่อมีการบันทึก credit_log
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET credits = credits + NEW.amount
        WHERE id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง Trigger สำหรับอัปเดตเครดิตอัตโนมัติ (Optional - แนะนำให้ใช้ถ้าต้องการ)
-- DROP TRIGGER IF EXISTS trigger_update_profile_credits ON credit_logs;
-- CREATE TRIGGER trigger_update_profile_credits
--     AFTER INSERT ON credit_logs
--     FOR EACH ROW
--     EXECUTE FUNCTION update_profile_credits();

-- 6. สร้าง Function และ Trigger สำหรับสร้างโปรไฟล์อัตโนมัติเมื่อผู้ใช้สมัครสมาชิก
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, credits)
    VALUES (NEW.id, 25); -- ให้เครดิตเริ่มต้น 25 เมื่อสมัครสมาชิก
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง Trigger (ถ้ายังไม่มี)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- เสร็จสิ้นการอัปเกรด
-- =====================================================
-- หมายเหตุ: 
-- 1. SQL นี้จะสร้างตาราง profiles และ credit_logs พร้อม RLS policies
-- 2. ผู้ใช้ที่สมัครใหม่จะได้เครดิตเริ่มต้น 25 อัตโนมัติ
-- 3. Trigger สำหรับอัปเดตเครดิตอัตโนมัติ (trigger_update_profile_credits) ถูก comment ไว้ 
--    หากต้องการให้อัปเดตเครดิตอัตโนมัติเมื่อมีการบันทึก credit_log ให้ uncomment ส่วนนั้น
-- 4. ตรวจสอบว่า service role key ถูกใช้สำหรับการอัปเดตเครดิตจากระบบ
