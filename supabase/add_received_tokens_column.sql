-- =====================================================
-- เพิ่มคอลัมน์ received_tokens (แต้มบารมี) สำหรับนักดนตรี
-- =====================================================
-- หมายเหตุ: รัน SQL นี้ใน Supabase SQL Editor

-- เพิ่มคอลัมน์ received_tokens ในตาราง profiles
DO $$ 
BEGIN
    -- เพิ่ม received_tokens ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'received_tokens'
    ) THEN
        ALTER TABLE profiles ADD COLUMN received_tokens INTEGER DEFAULT 0 NOT NULL;
        
        -- สร้าง index เพื่อเพิ่มประสิทธิภาพการเรียงลำดับ
        CREATE INDEX IF NOT EXISTS idx_profiles_received_tokens ON profiles(received_tokens DESC);
    END IF;
END $$;

-- =====================================================
-- เสร็จสิ้นการเพิ่มคอลัมน์ received_tokens
-- =====================================================
-- หมายเหตุ:
-- 1. received_tokens คือแต้มบารมีของนักดนตรี (ยิ่งมากยิ่งดี)
-- 2. ค่าเริ่มต้นคือ 0
-- 3. มี index เพื่อเรียงลำดับได้เร็วขึ้น
