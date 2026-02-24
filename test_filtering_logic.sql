-- Test Script: ทดสอบการกรองข้อมูล is_calendar_entry
-- Description: ทดสอบว่าระบบกรองข้อมูลถูกต้องหรือไม่

-- 1. ตรวจสอบว่ามีคอลัมน์ is_calendar_entry หรือไม่
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'is_calendar_entry';

-- 2. ทดสอบการ Query สำหรับ Calendar (fetchCalendarJobs)
-- ควรจะได้เฉพาะข้อมูลจากปฏิทิน
SELECT 
    id,
    user_id,
    instrument,
    start_time,
    end_time,
    date,
    is_calendar_entry,
    'Calendar Entry' as data_type
FROM jobs 
WHERE user_id = 'YOUR_USER_ID_HERE'
AND is_calendar_entry = true
ORDER BY date ASC
LIMIT 5;

-- 3. ทดสอบการ Query สำหรับ My Jobs (fetchMyJobs)
-- ควรจะได้เฉพาะข้อมูลจากการประกาศงาน
SELECT 
    id,
    user_id,
    instrument,
    start_time,
    end_time,
    date,
    is_calendar_entry,
    'Job Posting' as data_type
FROM jobs 
WHERE user_id = 'YOUR_USER_ID_HERE'
AND is_calendar_entry = false
ORDER BY created_at DESC
LIMIT 5;

-- 4. ทดสอบการ Query สำหรับ Nearby Gigs (App.tsx activeJobs)
-- ควรจะได้เฉพาะข้อมูลจากการประกาศงาน + time filter
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

-- 5. ทดสอบการ Insert ข้อมูล Calendar Entry
-- ควรจะมี is_calendar_entry = true
INSERT INTO jobs (user_id, instrument, start_time, end_time, date, is_calendar_entry)
VALUES (
    'YOUR_USER_ID_HERE',
    'Test Calendar Entry',
    '09:00:00',
    '10:00:00',
    '2026-02-24',
    TRUE
) ON CONFLICT DO NOTHING;

-- 6. ทดสอบการ Insert ข้อมูล Job Posting
-- ควรจะมี is_calendar_entry = false
INSERT INTO jobs (user_id, instrument, start_time, end_time, date, is_calendar_entry)
VALUES (
    'YOUR_USER_ID_HERE',
    'Test Job Posting',
    '19:00:00',
    '22:00:00',
    '2026-02-24',
    FALSE
) ON CONFLICT DO NOTHING;

-- 7. ตรวจสอบผลลัพธ์การ Insert
SELECT 
    id,
    instrument,
    is_calendar_entry,
    CASE 
        WHEN is_calendar_entry = true THEN 'Calendar Entry'
        ELSE 'Job Posting'
    END as data_type
FROM jobs 
WHERE instrument IN ('Test Calendar Entry', 'Test Job Posting')
ORDER BY created_at DESC;

-- 8. ลบข้อมูลทดสอบ
DELETE FROM jobs 
WHERE instrument IN ('Test Calendar Entry', 'Test Job Posting');

-- 9. สรุปผลการทดสอบ
SELECT 
    'Filtering logic test completed' as status,
    'Check results above for verification' as next_step,
    'Replace YOUR_USER_ID_HERE with actual user ID' as note;
