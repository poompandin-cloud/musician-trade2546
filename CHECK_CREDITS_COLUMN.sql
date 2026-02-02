-- ตรวจสอบโครงสร้างตาราง profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- ตรวจสอบว่ามีคอลัมน์ credits หรือไม่
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'credits';

-- ถ้าไม่มีคอลัมน์ credits ให้เพิ่ม
-- ALTER TABLE profiles ADD COLUMN credits INTEGER DEFAULT 20;

-- ถ้ามีคอลัมน์ credit_balance แต่ต้องการเปลี่ยนเป็น credits
-- ALTER TABLE profiles RENAME COLUMN credit_balance TO credits;

-- ตรวจสอบข้อมูลปัจจุบันในตาราง profiles
SELECT id, full_name, credits, credit_balance 
FROM profiles 
LIMIT 5;

-- อัปเดตค่าเริ่มต้นถ้าจำเป็น
-- UPDATE profiles SET credits = 20 WHERE credits IS NULL;
-- UPDATE profiles SET credits = 20 WHERE credits = 0;
