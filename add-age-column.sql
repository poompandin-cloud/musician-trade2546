-- เพิ่มคอลัมน์อายุในตาราง profiles
-- Run this SQL in Supabase Dashboard → SQL Editor

-- 1. เพิ่มคอลัมน์ age (ถ้ายังไม่มี)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age INTEGER;

-- 2. เพิ่ม constraint ให้ค่าอายุอยู่ในช่วง 15-65 ปี (ถ้าต้องการ)
ALTER TABLE profiles 
ADD CONSTRAINT IF NOT EXISTS age_range_check 
CHECK (age >= 15 AND age <= 65);

-- 3. เพิ่ม comment สำหรับคอลัมน์
COMMENT ON COLUMN profiles.age IS 'อายุของผู้ใช้ (15-65 ปี)';

-- 4. ตรวจสอบว่าคอลัมน์ถูกเพิ่มแล้ว
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'age';

-- 5. ตรวจสอบ constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'age_range_check';

-- 6. ทดสอบการ insert ข้อมูล
INSERT INTO profiles (id, full_name, age) 
VALUES ('test-user-id', 'Test User', 25)
ON CONFLICT (id) DO UPDATE SET age = 25;

-- 7. ทดสอบการ query ข้อมูล
SELECT id, full_name, age 
FROM profiles 
WHERE id = 'test-user-id';

-- 8. ลบข้อมูลทดสอบ
DELETE FROM profiles 
WHERE id = 'test-user-id';
