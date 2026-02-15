-- แก้ไข CHECK Constraint สำหรับคอลัมน์ additional_notes ในตาราง jobs
-- ขยายขนาดจาก 50 เป็น 1000 ตัวอักษร

-- 1. ตรวจสอบ constraint ปัจจุบัน
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.jobs'::regclass 
AND contype = 'c'
AND conname LIKE '%additional_notes%';

-- 2. ลบ constraint เก่า (ถ้ามี)
ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_additional_notes_check;

-- 3. สร้าง constraint ใหม่ที่รองรับ 1000 ตัวอักษร
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_additional_notes_check 
CHECK (length(additional_notes) <= 1000);

-- 4. ตรวจสอบผลลัพธ์
\d+ public.jobs

-- 5. ทดสอบ constraint ใหม่
-- คำสั่งนี้ควรทำงาน (ไม่ควรมี error):
INSERT INTO public.jobs (additional_notes) VALUES ('ทดสอบข้อความยาวๆ ที่มีความยาวไม่เกิน 1000 ตัวอักษร...');

-- คำสั่งนี้ควรมี error (เกิน 1000 ตัวอักษร):
-- INSERT INTO public.jobs (additional_notes) VALUES (repeat('a', 1001));

-- 6. ถ้าต้องการลบ constraint ออกทั้งหมด (ไม่จำกัดความยาว)
-- ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_additional_notes_check;
