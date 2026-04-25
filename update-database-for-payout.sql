-- SQL Script สำหรับอัปเดตฐานข้อมูล Supabase สำหรับ 'โปรเจค ออกเงินให้ก่อนแล้วหัก 5%'
-- รันใน Supabase Dashboard → SQL Editor

-- =====================================================
-- 1. อัปเดตตาราง profiles เพิ่มคอลัมน์ role
-- =====================================================

-- สร้าง ENUM type สำหรับ role (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('MUSICIAN', 'SHOP', 'ADMIN');
    END IF;
END $$;

-- เพิ่มคอลัมน์ role ในตาราง profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'MUSICIAN';

-- อัปเดตค่าเริ่มต้นสำหรับผู้ใช้ที่มีอยู่แล้ว
UPDATE profiles 
SET role = 'MUSICIAN' 
WHERE role IS NULL;

-- เพิ่ม comment สำหรับคอลัมน์ role
COMMENT ON COLUMN profiles.role IS 'ประเภทผู้ใช้งาน: MUSICIAN (นักดนตรี), SHOP (ร้าน), ADMIN (ผู้ดูแลระบบ)';

-- =====================================================
-- 2. อัปเดตตาราง gigs เพิ่มคอลัมน์เก็บข้อมูลเงิน
-- =====================================================

-- เพิ่มคอลัมน์ financial data ในตาราง gigs
ALTER TABLE gigs 
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS musician_payout DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- สร้าง ENUM type สำหรับ payment_status (ถ้ายังไม่มี)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'advanced_by_admin', 'repaid');
    END IF;
END $$;

-- แปลงคอลัมน์ payment_status เป็น ENUM type
ALTER TABLE gigs 
ALTER COLUMN payment_status TYPE payment_status USING payment_status::payment_status;

-- เพิ่ม comment สำหรับคอลัมน์การเงิน
COMMENT ON COLUMN gigs.total_amount IS 'ราคาเต็มของงาน (ก่อนหักค่าธรรมเนียม)';
COMMENT ON COLUMN gigs.fee_amount IS 'ค่าธรรมเนียม 5% ที่ร้านจ่ายให้ระบบ';
COMMENT ON COLUMN gigs.musician_payout IS 'ยอดเงินที่นักดนตรีได้รับ (95% ของราคาเต็ม)';
COMMENT ON COLUMN gigs.payment_status IS 'สถานะการจ่ายเงิน: pending (รอจ่าย), advanced_by_admin (ออกเงินก่อน), repaid (ร้านจ่ายคืนแล้ว)';

-- =====================================================
-- 3. สร้างตาราง gig_logs สำหรับเก็บหลักฐาน
-- =====================================================

-- สร้างตาราง gig_logs
CREATE TABLE IF NOT EXISTS gig_logs (
    id BIGSERIAL PRIMARY KEY,
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    evidence_photo_url TEXT,
    check_in_location TEXT, -- GPS coordinates or location description
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่ม comment สำหรับตาราง gig_logs
COMMENT ON TABLE gig_logs IS 'ตารางเก็บหลักฐานการทำงานของนักดนตรี';
COMMENT ON COLUMN gig_logs.gig_id IS 'ID ของงานที่เชื่อมโยง';
COMMENT ON COLUMN gig_logs.evidence_photo_url IS 'รูปถ่ายหลักฐานเมื่อจบงาน';
COMMENT ON COLUMN gig_logs.check_in_location IS 'พิกัด GPS หรือสถานที่เช็คอิน';
COMMENT ON COLUMN gig_logs.confirmed_at IS 'เวลาที่ร้านกดยืนยันการจบงาน';

-- =====================================================
-- 4. สร้าง Indexes สำหรับประสิทธิภาพการค้นหา
-- =====================================================

-- Index สำหรับตาราง profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index สำหรับตาราง gigs
CREATE INDEX IF NOT EXISTS idx_gigs_payment_status ON gigs(payment_status);
CREATE INDEX IF NOT EXISTS idx_gigs_musician_payout ON gigs(musician_payout);
CREATE INDEX IF NOT EXISTS idx_gigs_total_amount ON gigs(total_amount);

-- Index สำหรับตาราง gig_logs
CREATE INDEX IF NOT EXISTS idx_gig_logs_gig_id ON gig_logs(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_logs_confirmed_at ON gig_logs(confirmed_at);

-- =====================================================
-- 5. สร้าง Functions สำหรับการคำนวณเงิน
-- =====================================================

-- Function สำหรับคำนวณค่าธรรมเนียมและยอดจ่าย
CREATE OR REPLACE FUNCTION calculate_gig_payment(amount DECIMAL(10,2))
RETURNS TABLE(fee_amount DECIMAL(10,2), musician_payout DECIMAL(10,2))
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        amount * 0.05 as fee_amount,      -- 5% ค่าธรรมเนียม
        amount * 0.95 as musician_payout; -- 95% ยอดจ่ายให้นักดนตรี
END;
$$;

-- Function สำหรับอัปเดตข้อมูลการเงินใน gigs
CREATE OR REPLACE FUNCTION update_gig_financial_data(gig_id_param UUID, total_amount_param DECIMAL(10,2))
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE gigs 
    SET 
        total_amount = total_amount_param,
        fee_amount = total_amount_param * 0.05,
        musician_payout = total_amount_param * 0.95,
        updated_at = NOW()
    WHERE id = gig_id_param;
END;
$$;

-- =====================================================
-- 6. สร้าง Triggers สำหรับอัปเดตข้อมูลอัตโนมัติ
-- =====================================================

-- Trigger สำหรับอัปเดต financial data เมื่อมีการเปลี่ยนแปลง total_amount
CREATE OR REPLACE FUNCTION update_financial_on_total_amount_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- ถ้ามีการเปลี่ยนแปลง total_amount ให้คำนวณ fee และ payout ใหม่
    IF NEW.total_amount IS DISTINCT FROM OLD.total_amount THEN
        NEW.fee_amount = NEW.total_amount * 0.05;
        NEW.musician_payout = NEW.total_amount * 0.95;
    END IF;
    
    RETURN NEW;
END;
$$;

-- สร้าง trigger
DROP TRIGGER IF EXISTS trigger_update_financial_data ON gigs;
CREATE TRIGGER trigger_update_financial_data
    BEFORE UPDATE ON gigs
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_on_total_amount_change();

-- =====================================================
-- 7. สร้าง RLS Policies (Row Level Security)
-- =====================================================

-- เปิด RLS สำหรับตาราง gig_logs
ALTER TABLE gig_logs ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ gig_logs: ผู้ใช้สามารถเห็น logs ของ gigs ที่ตัวเองเกี่ยวข้อง
CREATE POLICY "Users can view gig logs for their gigs" ON gig_logs
    FOR SELECT USING (
        gig_id IN (
            SELECT id FROM gigs 
            WHERE musician_id = auth.uid() 
            OR shop_id = auth.uid()
        )
    );

-- Policy สำหรับ gig_logs: ผู้ใช้สามารถสร้าง logs สำหรับ gigs ที่ตัวเองเกี่ยวข้อง
CREATE POLICY "Users can create gig logs for their gigs" ON gig_logs
    FOR INSERT WITH CHECK (
        gig_id IN (
            SELECT id FROM gigs 
            WHERE musician_id = auth.uid() 
            OR shop_id = auth.uid()
        )
    );

-- =====================================================
-- 8. สร้าง Views สำหรับการดูข้อมูล
-- =====================================================

-- View สำหรับดูข้อมูลการเงินของ gigs
CREATE OR REPLACE VIEW gig_financial_summary AS
SELECT 
    g.id,
    g.title,
    g.total_amount,
    g.fee_amount,
    g.musician_payout,
    g.payment_status,
    g.musician_id,
    g.shop_id,
    m.full_name as musician_name,
    s.full_name as shop_name,
    g.created_at,
    g.updated_at
FROM gigs g
LEFT JOIN profiles m ON g.musician_id = m.id
LEFT JOIN profiles s ON g.shop_id = s.id;

COMMENT ON VIEW gig_financial_summary IS 'สรุปข้อมูลการเงินของงานทั้งหมด';

-- View สำหรับดูข้อมูล gig logs พร้อมข้อมูลเพิ่มเติม
CREATE OR REPLACE VIEW gig_logs_detail AS
SELECT 
    gl.id,
    gl.gig_id,
    gl.evidence_photo_url,
    gl.check_in_location,
    gl.confirmed_at,
    gl.created_at,
    gl.updated_at,
    g.title as gig_title,
    g.total_amount,
    g.musician_payout,
    g.payment_status,
    m.full_name as musician_name,
    s.full_name as shop_name
FROM gig_logs gl
LEFT JOIN gigs g ON gl.gig_id = g.id
LEFT JOIN profiles m ON g.musician_id = m.id
LEFT JOIN profiles s ON g.shop_id = s.id;

COMMENT ON VIEW gig_logs_detail IS 'รายละเอียดหลักฐานการทำงานพร้อมข้อมูลเพิ่มเติม';

-- =====================================================
-- 9. ตรวจสอบผลลัพธ์
-- =====================================================

-- ตรวจสอบโครงสร้างตาราง profiles
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- ตรวจสอบโครงสร้างตาราง gigs
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'gigs' 
AND column_name IN ('total_amount', 'fee_amount', 'musician_payout', 'payment_status');

-- ตรวจสอบโครงสร้างตาราง gig_logs
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'gig_logs';

-- ตรวจสอบ ENUM types
SELECT typname, typtype 
FROM pg_type 
WHERE typname IN ('user_role', 'payment_status');

-- ตรวจสอบ indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('profiles', 'gigs', 'gig_logs')
AND indexname LIKE 'idx_%';

-- =====================================================
-- 10. ข้อมูลตัวอย่างสำหรับทดสอบ (Optional)
-- =====================================================

-- สร้างข้อมูลตัวอย่าง (ถ้าต้องการทดสอบ)
-- INSERT INTO gig_logs (gig_id, evidence_photo_url, check_in_location)
-- VALUES 
--     ('gig-id-1', 'https://example.com/evidence1.jpg', '13.7563,100.5018'),
--     ('gig-id-2', 'https://example.com/evidence2.jpg', '13.7468,100.5350');

-- ทดสอบ function
-- SELECT * FROM calculate_gig_payment(1000.00);

-- ทดสอบ view
-- SELECT * FROM gig_financial_summary LIMIT 5;
-- SELECT * FROM gig_logs_detail LIMIT 5;

-- =====================================================
-- 11. คำสั่ง Cleanup (ถ้าต้องการ rollback)
-- =====================================================

/*
-- คำสั่งสำหรับ rollback (ใช้เมื่อต้องการยกเลิกการเปลี่ยนแปลง)
DROP TRIGGER IF EXISTS trigger_update_financial_data ON gigs;
DROP FUNCTION IF EXISTS update_financial_on_total_amount_change();
DROP FUNCTION IF EXISTS update_gig_financial_data(UUID, DECIMAL);
DROP FUNCTION IF EXISTS calculate_gig_payment(DECIMAL);
DROP VIEW IF EXISTS gig_logs_detail;
DROP VIEW IF EXISTS gig_financial_summary;
DROP POLICY IF EXISTS "Users can create gig logs for their gigs" ON gig_logs;
DROP POLICY IF EXISTS "Users can view gig logs for their gigs" ON gig_logs;
ALTER TABLE gig_logs DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS gig_logs;
ALTER TABLE gigs DROP COLUMN IF EXISTS payment_status;
ALTER TABLE gigs DROP COLUMN IF EXISTS musician_payout;
ALTER TABLE gigs DROP COLUMN IF EXISTS fee_amount;
ALTER TABLE gigs DROP COLUMN IF EXISTS total_amount;
ALTER TABLE profiles DROP COLUMN IF EXISTS role;
DROP TYPE IF EXISTS payment_status;
DROP TYPE IF EXISTS user_role;
*/

-- =====================================================
-- 12. สรุปการอัปเดต
-- =====================================================

/*
✅ การอัปเดตที่ดำเนินการ:

1. ตาราง profiles:
   - เพิ่มคอลัมน์ role (ENUM: MUSICIAN, SHOP, ADMIN)
   - ค่าเริ่มต้น: MUSICIAN
   - มี index สำหรับการค้นหา

2. ตาราง gigs:
   - เพิ่มคอลัมน์ total_amount (ราคาเต็ม)
   - เพิ่มคอลัมน์ fee_amount (5% ค่าธรรมเนียม)
   - เพิ่มคอลัมน์ musician_payout (95% ยอดจ่าย)
   - เพิ่มคอลัมน์ payment_status (ENUM: pending, advanced_by_admin, repaid)
   - มี trigger คำนวณอัตโนมัติ
   - มี indexes สำหรับประสิทธิภาพ

3. ตาราง gig_logs (ใหม่):
   - gig_id (FK ไป gigs)
   - evidence_photo_url (รูปถ่ายหลักฐาน)
   - check_in_location (GPS)
   - confirmed_at (เวลายืนยัน)
   - มี RLS policies
   - มี indexes

4. Functions & Triggers:
   - calculate_gig_payment() คำนวณค่าธรรมเนียม
   - update_gig_financial_data() อัปเดตข้อมูลการเงิน
   - trigger อัปเดตอัตโนมัติเมื่อเปลี่ยน total_amount

5. Views:
   - gig_financial_summary สรุปข้อมูลการเงิน
   - gig_logs_detail รายละเอียดหลักฐานพร้อมข้อมูลเพิ่มเติม

6. Security:
   - RLS policies สำหรับ gig_logs
   - เฉพาะผู้ที่เกี่ยวข้องเท่านั้นที่เห็น/สร้าง logs

7. Performance:
   - Indexes สำหรับการค้นหาที่สำคัญ
   - Views สำหรับการ query ที่ซับซ้อน

🎯 พร้อมใช้งานสำหรับระบบ 'ออกเงินให้ก่อนแล้วหัก 5%'!
*/
