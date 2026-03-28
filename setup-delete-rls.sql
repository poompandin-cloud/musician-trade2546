-- SQL สำหรับตั้งค่า RLS Policy ให้ผู้ใช้สามารถลบข้อความของตัวเองได้
-- แก้ไขปัญหาที่ข้อความไม่ยอมหายไปจากฐานข้อมูล

-- 1. ตรวจสอบว่ามี RLS เปิดอยู่หรือไม่
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'public_chats';

-- 2. ตรวจสอบ RLS policies ปัจจุบัน
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
WHERE tablename = 'public_chats';

-- 3. สร้าง RLS Policy สำหรับการลบข้อความของตัวเอง
DROP POLICY IF EXISTS "Users can delete their own messages" ON public_chats;

CREATE POLICY "Users can delete their own messages" ON public_chats
FOR DELETE
USING (auth.uid() = user_id);

-- 4. ตรวจสอบว่ามี policy สำหรับการอ่านและเพิ่มข้อความหรือไม่
-- ถ้ายังไม่มีให้สร้าง policy เหล่านี้ด้วย

-- Policy สำหรับการอ่านข้อความ (ทุกคนอ่านได้)
DROP POLICY IF EXISTS "Anyone can view messages" ON public_chats;

CREATE POLICY "Anyone can view messages" ON public_chats
FOR SELECT
USING (true);

-- Policy สำหรับการเพิ่มข้อความ (ต้อง login)
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public_chats;

CREATE POLICY "Authenticated users can insert messages" ON public_chats
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 5. ตรวจสอบว่ามี policy ทั้งหมดแล้ว
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
WHERE tablename = 'public_chats'
ORDER BY cmd, policyname;

-- 6. ทดสอบการลบข้อความ (run หลังจาก login)
-- คัดลอก user_id และ message_id จากข้อความที่ต้องการทดสอบ
-- แล้วรันคำสั่งนี้ใน SQL Editor

-- -- ทดสอบการลบ (แทนที่ 'your-user-id' และ 'message-id-to-delete')
-- DELETE FROM public_chats 
-- WHERE id = 'message-id-to-delete'::uuid 
--     AND user_id = 'your-user-id'::uuid;

-- 7. ตรวจสอบผลลัพธ์
SELECT COUNT(*) as total_messages FROM public_chats;
SELECT id, user_id, content, created_at FROM public_chats ORDER BY created_at DESC LIMIT 5;

-- 8. ถ้ายังมีปัญหา ให้ตรวจสอบว่า user_id ในตารางเป็น UUID หรือไม่
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'public_chats' 
    AND table_schema = 'public'
    AND column_name = 'user_id';

-- 9. ตรวจสอบว่ามีข้อมูล user_id ที่เป็น null หรือไม่
SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_ids,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as valid_user_ids
FROM public_chats;

-- 10. ถ้ามี user_id เป็น null ให้ลบข้อมูลเหล่านั้นก่อน
-- DELETE FROM public_chats WHERE user_id IS NULL;
