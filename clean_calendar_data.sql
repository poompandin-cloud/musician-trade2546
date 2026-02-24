-- Clean Data Script: ลบข้อมูลปฏิทินที่รั่วไปหน้าประกาศงาน
-- Description: ลบข้อมูล calendar entries ที่อาจถูกสร้างก่อนมี is_calendar_entry column

-- 1. ตรวจสอบข้อมูลที่อาจเป็น calendar entries (ก่อนการ clean)
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
        WHEN instrument LIKE '%ซ้อม%' OR 
             instrument LIKE '%ฝึก%' OR 
             instrument LIKE '%ปฏิทิน%' OR
             instrument LIKE '%ส่วนตัว%' OR
             instrument LIKE '%rehearsal%' OR
             instrument LIKE '%practice%' THEN 'Likely Calendar Entry'
        ELSE 'Likely Job Posting'
    END as data_type
FROM jobs 
WHERE is_calendar_entry IS NULL OR is_calendar_entry = false
ORDER BY created_at DESC
LIMIT 20;

-- 2. อัปเดตข้อมูลที่น่าจะเป็น calendar entries
UPDATE jobs 
SET is_calendar_entry = true 
WHERE is_calendar_entry IS NULL OR is_calendar_entry = false
AND (
    instrument LIKE '%ซ้อม%' OR 
    instrument LIKE '%ฝึก%' OR 
    instrument LIKE '%ปฏิทิน%' OR
    instrument LIKE '%ส่วนตัว%' OR
    instrument LIKE '%rehearsal%' OR
    instrument LIKE '%practice%'
);

-- 3. ตรวจสอบผลลัพธ์หลังการอัปเดต
SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN is_calendar_entry = true THEN 1 END) as calendar_entries,
    COUNT(CASE WHEN is_calendar_entry = false THEN 1 END) as job_postings,
    COUNT(CASE WHEN is_calendar_entry IS NULL THEN 1 END) as null_entries
FROM jobs;

-- 4. แสดงตัวอย่าง calendar entries หลังการ clean
SELECT 
    id,
    user_id,
    instrument,
    start_time,
    end_time,
    date,
    is_calendar_entry
FROM jobs 
WHERE is_calendar_entry = true
ORDER BY created_at DESC
LIMIT 5;

-- 5. แสดงตัวอย่าง job postings หลังการ clean
SELECT 
    id,
    user_id,
    instrument,
    start_time,
    end_time,
    date,
    is_calendar_entry
FROM jobs 
WHERE is_calendar_entry = false
ORDER BY created_at DESC
LIMIT 5;

-- 6. สรุปผลการทำงาน
SELECT 
    'Data cleaning completed' as status,
    'Calendar entries marked with is_calendar_entry = true' as action,
    'Job postings marked with is_calendar_entry = false' as result;
