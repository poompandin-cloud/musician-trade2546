-- Test Script: ตรวจสอบการกรองข้อมูล is_calendar_entry
-- Description: ทดสอบว่าระบบกรองข้อมูลถูกต้องหรือไม่

-- 1. ตรวจสอบว่ามีคอลัมน์ is_calendar_entry หรือไม่
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'is_calendar_entry';

-- 2. ตรวจสอบข้อมูลทั้งหมดในตาราง jobs
SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN is_calendar_entry = true THEN 1 END) as calendar_entries,
    COUNT(CASE WHEN is_calendar_entry = false THEN 1 END) as job_postings,
    COUNT(CASE WHEN is_calendar_entry IS NULL THEN 1 END) as null_entries
FROM jobs;

-- 3. ทดสอบ Query สำหรับ Calendar (fetchCalendarJobs)
-- จำลองการ query ที่ ProfilePage ใช้
SELECT 
    id,
    user_id,
    instrument,
    start_time,
    end_time,
    date,
    is_calendar_entry
FROM jobs 
WHERE user_id = 'YOUR_USER_ID_HERE'
AND is_calendar_entry = true
ORDER BY date ASC
LIMIT 5;

-- 4. ทดสอบ Query สำหรับ My Jobs (fetchMyJobs)
-- จำลองการ query ที่ ProfilePage ใช้
SELECT 
    id,
    user_id,
    instrument,
    start_time,
    end_time,
    date,
    is_calendar_entry
FROM jobs 
WHERE user_id = 'YOUR_USER_ID_HERE'
AND is_calendar_entry = false
ORDER BY created_at DESC
LIMIT 5;

-- 5. ทดสอบ Query สำหรับ Nearby Gigs (App.tsx activeJobs)
-- จำลองการ query ที่ App.tsx ใช้
SELECT 
    id,
    user_id,
    instrument,
    start_time,
    end_time,
    date,
    created_at,
    is_calendar_entry,
    CASE 
        WHEN (DATE_PART('epoch', NOW()) - DATE_PART('epoch', created_at)) < (3 * 24 * 60 * 60) 
        AND is_calendar_entry = false THEN 'Active Job'
        ELSE 'Not Active'
    END as status
FROM jobs 
WHERE is_calendar_entry = false
ORDER BY created_at DESC
LIMIT 10;

-- 6. ตรวจสอบว่ามีข้อมูลปนกันหรือไม่
-- ดูว่ามีข้อมูลที่อาจจะถูกจัดประเภทผิดหรือไม่
SELECT 
    instrument,
    COUNT(*) as count,
    is_calendar_entry,
    CASE 
        WHEN instrument LIKE '%ซ้อม%' OR 
             instrument LIKE '%ฝึก%' OR 
             instrument LIKE '%ปฏิทิน%' OR
             instrument LIKE '%ส่วนตัว%' OR
             instrument LIKE '%rehearsal%' OR
             instrument LIKE '%practice%' THEN 'Likely Calendar Entry'
        ELSE 'Likely Job Posting'
    END as suggested_type
FROM jobs 
GROUP BY instrument, is_calendar_entry
ORDER BY count DESC
LIMIT 20;

-- 7. สรุปผลการทดสอบ
SELECT 
    'Test completed' as status,
    'Check results above for filtering verification' as next_step,
    'Replace YOUR_USER_ID_HERE with actual user ID for testing' as note;
