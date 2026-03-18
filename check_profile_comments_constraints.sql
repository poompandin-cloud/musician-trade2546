-- ตรวจสอบ CHECK constraint ในตาราง profile_comments
-- สคริปต์นี้ใช้สำหรับหา constraint ที่ทำให้เกิด error "The string did not match the expected pattern"

-- 1. ดู constraint ทั้งหมดในตาราง profile_comments
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profile_comments'::regclass 
AND contype = 'c';

-- 2. ดูโครงสร้างตาราง profile_comments ทั้งหมด
\d+ public.profile_comments

-- 3. ตรวจสอบว่ามี CHECK constraint ที่เกี่ยวกับ content หรือไม่
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.profile_comments'::regclass 
AND contype = 'c'
AND consrc LIKE '%content%';

-- 4. ลบ CHECK constraint ที่เกี่ยวกับ content (ถ้ามี)
-- ชื่อ constraint อาจเป็นอย่างอื่น ให้ตรวจสอบจากคำสั่งข้างบนก่อน
-- ตัวอย่างชื่อที่อาจเจอ:
-- profile_comments_content_check
-- profile_comments_content_length_check
-- content_length_check
-- หรือชื่ออื่นๆ

-- คำสั่งลบ constraint (เปลี่ยนชื่อตามที่เจอจากข้างบน)
-- ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS profile_comments_content_check;

-- 5. ทดสอบการเพิ่มคอมเมนต์ภาษาไทยหลังลบ constraint
-- INSERT INTO public.profile_comments (profile_id, author_id, content) 
-- VALUES ('test-profile-id', 'test-author-id', 'ทดสอบภาษาไทย สวัสดีครับ');

-- 6. ถ้ายังไม่ได้ ให้ลองตรวจสอบ RLS policies ที่อาจมีการตรวจสอบ pattern
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
