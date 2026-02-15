-- แก้ไข Constraint ของคอลัมน์ additional_notes เพื่อรองรับข้อความยาวขึ้น
-- สคริปต์นี้ใช้สำหรับลบ CHECK constraint ที่จำกัด 50 ตัวอักษร

-- 1. ดู constraint ทั้งหมดในตาราง jobs
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'public.jobs'::regclass 
AND contype = 'c';

-- 2. ลบ constraint เก่า (ถ้ามี)
-- ชื่อ constraint อาจเป็นอย่างอื่น ให้ตรวจสอบจากคำสั่งข้างบนก่อน
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_additional_notes_check;

-- 3. เพิ่ม constraint ใหม่ที่จำกัด 1000 ตัวอักษร (ถ้าต้องการ)
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_additional_notes_check 
CHECK (length(additional_notes) <= 1000);

-- หรือถ้าไม่ต้องการจำกัดความยาวเลย สามารถข้ามขั้นตอนที่ 3 ได้

-- 4. ตรวจสอบผลลัพธ์
\d+ public.jobs
