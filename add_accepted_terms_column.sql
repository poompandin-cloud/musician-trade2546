-- เพิ่มคอลัมน์ accepted_terms ในตาราง jobs
-- สำหรับเก็บสถานะการยอมรับเงื่อนไขการใช้งาน

-- 1. ตรวจสอบว่ามีคอลัมน์ accepted_terms อยู่แล้วหรือไม่
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'accepted_terms';

-- 2. เพิ่มคอลัมน์ accepted_terms (ถ้ายังไม่มี)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN DEFAULT FALSE;

-- 3. ตั้งค่า default ให้เป็น FALSE สำหรับข้อมูลเก่า
UPDATE public.jobs 
SET accepted_terms = FALSE 
WHERE accepted_terms IS NULL;

-- 4. ตรวจสอบผลลัพธ์
\d+ public.jobs

-- 5. ทดสอบการเพิ่มข้อมูล
INSERT INTO public.jobs (title, accepted_terms) 
VALUES ('ทดสอบ', TRUE);

-- 6. ลบข้อมูลทดสอบ
DELETE FROM public.jobs 
WHERE title = 'ทดสอบ';
