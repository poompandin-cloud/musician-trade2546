-- =====================================================
-- Add Prestige Points System
-- =====================================================
-- หมายเหตุ: รัน SQL นี้ใน Supabase SQL Editor

-- เพิ่มคอลัมน์ prestige_points ในตาราง profiles
DO $$ 
BEGIN
    -- เพิ่ม prestige_points ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'prestige_points'
    ) THEN
        ALTER TABLE profiles ADD COLUMN prestige_points INTEGER DEFAULT 100 NOT NULL;
    END IF;
END $$;

-- สร้างตาราง prestige_logs สำหรับเก็บประวัติการเปลี่ยนแปลง prestige points
CREATE TABLE IF NOT EXISTS prestige_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL, -- +10 หรือ -10
    action_type TEXT NOT NULL, -- 'gig_completed', 'gig_cancelled', 'bonus', 'penalty'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- สร้าง index สำหรับเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS idx_prestige_logs_user_id ON prestige_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prestige_logs_created_at ON prestige_logs(created_at DESC);

-- ตั้งค่า Row Level Security (RLS) สำหรับ prestige_logs
ALTER TABLE prestige_logs ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy: ผู้ใช้สามารถอ่านประวัติ prestige ของตัวเองได้เท่านั้น
DROP POLICY IF EXISTS "Users can view own prestige logs" ON prestige_logs;
CREATE POLICY "Users can view own prestige logs"
    ON prestige_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- สร้าง Policy: ผู้ใช้สามารถเพิ่ม prestige_log ของตัวเองได้
DROP POLICY IF EXISTS "Users can insert own prestige logs" ON prestige_logs;
CREATE POLICY "Users can insert own prestige logs"
    ON prestige_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- สร้าง Function สำหรับอัปเดต prestige points
CREATE OR REPLACE FUNCTION update_prestige_points(
    user_uuid UUID,
    points_change INTEGER,
    action_type TEXT DEFAULT 'manual',
    description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_points INTEGER;
    new_points INTEGER;
BEGIN
    -- ดึงคะแนนปัจจุบัน
    SELECT prestige_points INTO current_points 
    FROM profiles 
    WHERE id = user_uuid;
    
    IF current_points IS NULL THEN
        -- ถ้าไม่มีข้อมูล ให้เริ่มที่ 100 คะแนน
        current_points := 100;
    END IF;
    
    -- คำนวณคะแนนใหม่ (ไม่ให้ต่ำกว่า 0 หรือเกิน 1000)
    new_points := GREATEST(0, LEAST(1000, current_points + points_change));
    
    -- อัปเดตคะแนน
    UPDATE profiles 
    SET prestige_points = new_points,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- บันทึกประวัติ
    INSERT INTO prestige_logs (user_id, points_change, action_type, description)
    VALUES (user_uuid, points_change, action_type, description);
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating prestige points: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- เสร็จสิ้นการสร้าง Prestige Points System
-- =====================================================
-- หมายเหตุ: 
-- 1. ผู้ใช้ใหม่จะเริ่มที่ 100 prestige points
-- 2. คะแนนจะถูกจำกัดระหว่าง 0-1000 คะแนน
-- 3. Milestones: 100(เริ่มต้น), 300(กลางๆ), 600(ยอดเยี่ยม), 900(คุณภาพ)
-- 4. สามารถเรียกใช้ฟังก์ชัน update_prestige_points() เพื่อเปลี่ยนแปลงคะแนน
