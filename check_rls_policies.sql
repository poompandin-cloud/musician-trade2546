-- ตรวจสอบ RLS Policies ที่อาจมีการตรวจสอบ pattern ในตาราง profile_comments
-- สคริปต์นี้ใช้สำหรับหา policy ที่ทำให้เกิด error "The string did not match the expected pattern"

-- 1. ดู RLS policies ทั้งหมดในตาราง profile_comments
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

-- 2. ตรวจสอบว่ามี policy ที่มีการตรวจสอบ pattern หรือไม่
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
WHERE tablename = 'profile_comments'
AND (
    qual LIKE '%regex%' 
    OR qual LIKE '%pattern%'
    OR qual LIKE '%match%'
    OR qual LIKE '%~%'
    OR with_check LIKE '%regex%'
    OR with_check LIKE '%pattern%'
    OR with_check LIKE '%match%'
    OR with_check LIKE '%~%'
);

-- 3. ลบ RLS policies ที่เกี่ยวกับการตรวจสอบ pattern (ถ้ามี)
-- ตัวอย่างชื่อ policy ที่อาจเจอ:
-- "Authenticated users can insert comments with content validation"
-- "Comments content validation"
-- หรือชื่ออื่นๆ

-- คำสั่งลบ policy (เปลี่ยนชื่อตามที่เจอจากข้างบน)
-- DROP POLICY IF EXISTS "policy_name" ON public.profile_comments;

-- 4. สร้าง RLS policy ใหม่ที่ไม่มีการตรวจสอบ pattern
-- Policy สำหรับการเพิ่มคอมเมนต์ (ไม่มี validation)
CREATE POLICY "Users can insert comments without validation" ON public.profile_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 5. ทดสอบการเพิ่มคอมเมนต์ภาษาไทยหลังแก้ไข policy
-- INSERT INTO public.profile_comments (profile_id, author_id, content) 
-- VALUES ('test-profile-id', 'test-author-id', 'ทดสอบภาษาไทย สวัสดีครับ');

-- 6. ถ้ายังไม่ได้ ให้ลองปิด RLS ชั่วคราวเพื่อทดสอบ
-- ALTER TABLE public.profile_comments DISABLE ROW LEVEL SECURITY;

-- 7. หลังทดสอบเสร็จให้เปิด RLS ใหม่
-- ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;
