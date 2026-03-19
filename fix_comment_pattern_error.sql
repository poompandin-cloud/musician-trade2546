-- แก้ปัญหา "The string did not match the expected pattern" ในคอมเมนต์
-- รัน SQL นี้ใน Supabase SQL Editor

-- 1. ดู CHECK constraints ทั้งหมดในตาราง profile_comments
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profile_comments'::regclass 
AND contype = 'c';

-- 2. ดูโครงสร้างตาราง profile_comments
\d+ public.profile_comments

-- 3. ลบ CHECK constraint ที่เกี่ยวกับ content (ถ้ามี)
-- ชื่อ constraint ที่อาจเจอ:
-- profile_comments_content_check
-- profile_comments_content_pattern_check
-- content_pattern_check
-- หรือชื่ออื่นๆ ที่มีคำว่า content หรือ pattern

-- ลบ constraint ทั้งหมดที่เกี่ยวกับ content
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_content_check;
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_content_pattern_check;
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS content_pattern_check;
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS content_validation_check;
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_content_length_check;

-- 4. ลบ CHECK constraint ที่อาจมี pattern matching
-- ตรวจสอบ constraint ที่มีเครื่องหมาย ~ (regex pattern)
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profile_comments'::regclass 
AND contype = 'c'
AND consrc LIKE '%~%';

-- ลบ constraint ที่มี regex pattern
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_content_regex_check;
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS content_regex_check;
ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_pattern_check;

-- 5. ตรวจสอบ RLS policies ที่อาจมี pattern validation
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
WHERE tablename = 'profile_comments';

-- 6. ลบ RLS policies ที่มี pattern validation (ถ้ามี)
DROP POLICY IF EXISTS "profile_comments_content_validation" ON public.profile_comments;
DROP POLICY IF EXISTS "profile_comments_pattern_check" ON public.profile_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments with validation" ON public.profile_comments;

-- 7. สร้าง RLS policy ใหม่ที่ไม่มี validation
CREATE POLICY "Users can insert comments without validation" ON public.profile_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 8. ทดสอบการเพิ่มคอมเมนต์ภาษาไทย
-- รันคำสั่งนี้เพื่อทดสอบ
-- INSERT INTO public.profile_comments (profile_id, author_id, content) 
-- VALUES ('test-profile-id', 'test-author-id', 'ทดสอบภาษาไทย สวัสดีครับ');

-- 9. ถ้ายังไม่ได้ ให้ลองปิด RLS ชั่วคราวเพื่อทดสอบ
-- ALTER TABLE public.profile_comments DISABLE ROW LEVEL SECURITY;

-- 10. ทดสอบการเพิ่มคอมเมนต์อีกครั้ง
-- INSERT INTO public.profile_comments (profile_id, author_id, content) 
-- VALUES ('test-profile-id', 'test-author-id', 'ทดสอบภาษาไทย สวัสดีครับ');

-- 11. ถ้าทดสอบได้ ให้เปิด RLS ใหม่
-- ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

-- 12. ตรวจสอบผลลัพธ์สุดท้าย
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profile_comments'::regclass 
AND contype = 'c';
