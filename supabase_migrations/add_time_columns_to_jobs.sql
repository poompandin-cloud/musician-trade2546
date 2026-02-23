-- Migration: Add start_time and end_time columns to jobs table
-- Description: Add time range columns to replace single time column

-- 1. ตรวจสอบว่ามีคอลัมน์ start_time และ end_time หรือไม่
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND table_schema = 'public' 
AND column_name IN ('start_time', 'end_time');

-- 2. เพิ่มคอลัมน์ start_time ถ้ายังไม่มี
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS start_time TIME;

-- 3. เพิ่มคอลัมน์ end_time ถ้ายังไม่มี  
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS end_time TIME;

-- 4. ย้ายข้อมูลจากคอลัมน์ time ไป start_time (ถ้ามีข้อมูล)
UPDATE jobs 
SET start_time = time::TIME 
WHERE time IS NOT NULL 
AND start_time IS NULL;

-- 5. ตั้งค่า end_time เริ่มต้น (start_time + 1 ชั่วโมง)
UPDATE jobs 
SET end_time = (start_time + INTERVAL '1 hour')::TIME 
WHERE start_time IS NOT NULL 
AND end_time IS NULL;

-- 6. ตรวจสอบผลลัพธ์
SELECT 
    id, 
    instrument, 
    time, 
    start_time, 
    end_time, 
    date,
    user_id
FROM jobs 
ORDER BY id 
LIMIT 5;

-- 7. อัปเดต RLS Policies (ถ้าจำเป็น)
-- ตรวจสอบ policies ปัจจุบัน
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
WHERE tablename = 'jobs';

-- 8. สร้าง index สำหรับประสิทธิภาพ (ถ้าจำเป็น)
CREATE INDEX IF NOT EXISTS idx_jobs_start_time ON jobs(start_time) WHERE start_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_end_time ON jobs(end_time) WHERE end_time IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_user_date ON jobs(user_id, date) WHERE user_id IS NOT NULL;

-- 9. ตรวจสอบ constraint และ indexes ทั้งหมด
\d+ jobs

-- 10. ทดสอบการ insert ข้อมูลใหม่
INSERT INTO jobs (instrument, start_time, end_time, date, user_id) 
VALUES ('Test Job', '09:00:00', '10:00:00', '15/02/2026', 'test-user-id')
ON CONFLICT DO NOTHING;

-- 11. ลบข้อมูลทดสอบ
DELETE FROM jobs WHERE instrument = 'Test Job' AND user_id = 'test-user-id';

-- 12. ตรวจสอบสุดท้าย
SELECT 'Migration completed successfully' as status;
