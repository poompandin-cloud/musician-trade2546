-- =====================================================
-- Add Instruments and Province to Profiles Table
-- =====================================================

-- 1. เพิ่มคอลัมน์ instruments (JSONB) สำหรับเก็บเครื่องดนตรีที่เล่นได้
DO $$ 
BEGIN
    -- เพิ่ม instruments ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'instruments'
    ) THEN
        ALTER TABLE profiles ADD COLUMN instruments JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. เพิ่มคอลัมน์ province สำหรับเก็บจังหวัดที่อยู่
DO $$ 
BEGIN
    -- เพิ่ม province ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'province'
    ) THEN
        ALTER TABLE profiles ADD COLUMN province TEXT;
    END IF;
END $$;

-- 3. สร้าง Index สำหรับการค้นหาที่เร็วขึ้น (Optional)
CREATE INDEX IF NOT EXISTS idx_profiles_instruments ON profiles USING GIN (instruments);
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles (province);

-- =====================================================
-- เสร็จสิ้นการเพิ่มคอลัมน์ใหม่
-- =====================================================
-- หมายเหตุ: 
-- 1. instruments: เก็บ array ของเครื่องดนตรี (เช่น ['guitar', 'drums'])
-- 2. province: เก็บชื่อจังหวัด (เช่น 'กรุงเทพมหานคร')
-- 3. Index ช่วยให้การค้นหาเร็วขึ้นสำหรับฟีเจอร์ "งานใกล้คุณ"
-- 4. สามารถใช้ GIN index สำหรับ array ใน PostgreSQL
