-- SQL สำหรับสร้าง RLS Policies ให้ตาราง profiles

-- 1. เปิดใช้งาน RLS สำหรับตาราง profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. สร้าง Policy ให้ผู้ใช้สามารถอ่านข้อมูลตัวเองได้
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 3. สร้าง Policy ให้ผู้ใช้สามารถสร้างโปรไฟล์ตัวเองได้
CREATE POLICY "Users can create own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. สร้าง Policy ให้ผู้ใช้สามารถอัปเดตข้อมูลตัวเองได้ (รวมถึงการหักเครดิต)
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 5. สร้าง Policy ให้ผู้ใช้สามารถลบข้อมูลตัวเองได้
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 6. (Optional) Policy สำหรับให้ทุกคนอ่านข้อมูลโปรไฟล์ได้ (สำหรับการค้นหานักดนตรี)
-- CREATE POLICY "Profiles are viewable by everyone" ON profiles
--     FOR SELECT USING (true);

-- 7. ตรวจสอบ Policies ที่มีอยู่แล้ว
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
