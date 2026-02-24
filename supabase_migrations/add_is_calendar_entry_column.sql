-- Migration: Add is_calendar_entry column to jobs table
-- Description: เพิ่มคอลัมน์เพื่อแยกระหว่างงานจากปฏิทินและงานประกาศ

-- 1. เพิ่มคอลัมน์ is_calendar_entry
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS is_calendar_entry BOOLEAN DEFAULT FALSE;

-- 2. สร้าง Index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_jobs_is_calendar_entry ON jobs(is_calendar_entry);

-- 3. อัปเดตข้อมูลเก่าที่อาจเป็น calendar entries
-- (ถ้าต้องการ mark ข้อมูลเก่าบางส่วนเป็น calendar entries)
-- UPDATE jobs 
-- SET is_calendar_entry = TRUE 
-- WHERE created_at < '2026-02-24' AND instrument LIKE '%ซ้อม%';

-- 4. ตรวจสอบผลลัพธ์
\d+ jobs

-- 5. ทดสอบการ insert ข้อมูล calendar entry
INSERT INTO jobs (user_id, instrument, start_time, end_time, date, is_calendar_entry)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- test user ID
    'Test Calendar Entry',
    '09:00:00',
    '10:00:00',
    '2026-02-24',
    TRUE
) ON CONFLICT DO NOTHING;

-- 6. ทดสอบการ insert ข้อมูล job posting
INSERT INTO jobs (user_id, instrument, start_time, end_time, date, is_calendar_entry)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- test user ID
    'Test Job Posting',
    '19:00:00',
    '22:00:00',
    '2026-02-24',
    FALSE
) ON CONFLICT DO NOTHING;

-- 7. ทดสอบการ select แยกตามประเภท
-- ดึงเฉพาะ calendar entries
SELECT * FROM jobs WHERE is_calendar_entry = TRUE ORDER BY created_at DESC LIMIT 1;

-- ดึงเฉพาะ job postings
SELECT * FROM jobs WHERE is_calendar_entry = FALSE ORDER BY created_at DESC LIMIT 1;

-- 8. ลบข้อมูลทดสอบ
DELETE FROM jobs WHERE instrument IN ('Test Calendar Entry', 'Test Job Posting');

-- 9. แสดงผลลัพธ์สุดท้าย
SELECT 'is_calendar_entry column added successfully to jobs table' as status;
