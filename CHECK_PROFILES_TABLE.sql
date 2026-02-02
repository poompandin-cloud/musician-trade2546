-- SQL เพื่อตรวจสอบโครงสร้างตาราง profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- SQL เพื่อเพิ่มคอลัมน์ credits หากยังไม่มี
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 20;

-- SQL เพื่ออัปเดตค่าเริ่มต้นสำหรับผู้ใช้ที่มีอยู่แล้ว
UPDATE profiles 
SET credits = 20 
WHERE credits IS NULL;

-- SQL เพื่อตรวจสอบ RLS Policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';
