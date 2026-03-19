-- Debug script สำหรับหาสาเหตุ "The string did not match the expected pattern"
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบ constraints ทั้งหมดในตาราง profile_comments
SELECT 
    conname,
    consrc,
    contype
FROM pg_constraint 
WHERE conrelid = 'public.profile_comments'::regclass 
ORDER BY conname;

-- 2. ตรวจสอบ column definitions
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profile_comments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ตรวจสอบ RLS policies ทั้งหมด
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
ORDER BY policyname;

-- 4. ตรวจสอาว่ามี trigger หรือไม่
SELECT 
    trigger_name,
    event_manipulation,
    action_condition,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'profile_comments'
AND trigger_schema = 'public';

-- 5. ตรวจสอบว่ามี function ที่เกี่ยวข้องหรือไม่
SELECT 
    proname,
    prosrc,
    prolang
FROM pg_proc
WHERE proname LIKE '%profile_comment%'
OR proname LIKE '%comment%'
ORDER BY proname;

-- 6. ทดสอบการ insert แบบง่ายๆ (แบบไม่มี validation)
-- ลอง insert ข้อมูลทดสอบ
INSERT INTO public.profile_comments (
    profile_id, 
    author_id, 
    content
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- test profile_id
    '00000000-0000-0000-0000-000000000000', -- test author_id
    'ทดสอบภาษาไทย'
) ON CONFLICT DO NOTHING;

-- 7. ถ้า insert ข้างบนได้ ลอง insert แบบมี IP
INSERT INTO public.profile_comments (
    profile_id, 
    author_id, 
    content,
    author_ip
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'ทดสอบภาษาไทย',
    '127.0.0.1'
) ON CONFLICT DO NOTHING;

-- 8. ถ้ายังไม่ได้ ให้ปิด RLS ชั่วคราว
ALTER TABLE public.profile_comments DISABLE ROW LEVEL SECURITY;

-- 9. ทดสอบ insert อีกครั้ง
INSERT INTO public.profile_comments (
    profile_id, 
    author_id, 
    content
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'ทดสอบภาษาไทย'
) ON CONFLICT DO NOTHING;

-- 10. ถ้าได้แล้ว ให้เปิด RLS ใหม่
ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

-- 11. ตรวจสอบว่ามี extension พิเศษหรือไม่
SELECT 
    extname,
    extversion,
    extrelocatable
FROM pg_extension
WHERE extname IN (
    'pgcrypto', 
    'pg_trgm', 
    'btree_gin', 
    'btree_gist',
    'uuid-ossp',
    'pg_cron'
)
ORDER BY extname;

-- 12. ตรวจสอบว่ามี domain ที่กำหนด custom type หรือไม่
SELECT 
    t.typname,
    t.typcategory,
    t.typinput,
    t.typoutput
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
AND t.typcategory = 'D' -- Domain types
ORDER BY t.typname;

-- 13. ตรวจสอบว่ามี custom type ที่เกี่ยวข้องกับ string หรือไม่
SELECT 
    t.typname,
    t.typcategory,
    t.typinput,
    t.typoutput
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
AND (
    t.typname LIKE '%string%'
    OR t.typname LIKE '%text%'
    OR t.typname LIKE '%comment%'
    OR t.typname LIKE '%content%'
)
ORDER BY t.typname;

-- 14. ลบ constraints ที่อาจทำให้เกิดปัญหา
-- ลบ constraint ทั้งหมดที่อาจมี
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.profile_comments'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE public.profile_comments DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- 15. สร้าง constraint ใหม่แบบไม่มี pattern validation
-- ถ้าต้องการ constraint แค่ length
ALTER TABLE public.profile_comments 
ADD CONSTRAINT IF NOT EXISTS profile_comments_content_length_check 
CHECK (length(content) <= 1000);

-- 16. ทดสอบ insert ครั้งสุดท้าย
INSERT INTO public.profile_comments (
    profile_id, 
    author_id, 
    content
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'ทดสอบภาษาไทย สวัสดีครับ'
) ON CONFLICT DO NOTHING;

-- 17. ตรวจสอบผลลัพธ์
SELECT * FROM public.profile_comments 
WHERE content LIKE 'ทดสอบภาษาไทย%'
ORDER BY created_at DESC
LIMIT 5;
