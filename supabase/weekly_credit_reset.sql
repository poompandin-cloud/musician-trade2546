-- =====================================================
-- Weekly Credit Reset System
-- =====================================================
-- หมายเหตุ: รัน SQL นี้ใน Supabase SQL Editor เพื่อสร้าง Cron Job

-- 1. สร้าง Function สำหรับรีเซ็ตเครดิตรายสัปดาห์
CREATE OR REPLACE FUNCTION weekly_credit_reset()
RETURNS void AS $$
BEGIN
    -- อัปเดตเครดิตทุกคนให้เป็น 25 เครดิต
    UPDATE profiles 
    SET credits = 25,
        updated_at = NOW()
    WHERE id IN (
        SELECT id FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    );
    
    -- บันทึกประวัติการรีเซ็ตเครดิต
    INSERT INTO credit_logs (user_id, amount, action_type, description)
    SELECT 
        id as user_id,
        (25 - COALESCE(credits, 0)) as amount,
        'weekly_reset' as action_type,
        'รีเซ็ตเครดิตรายสัปดาห์' as description
    FROM profiles
    WHERE id IN (
        SELECT id FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    )
    ON CONFLICT DO NOTHING;
    
    RAISE LOG 'Weekly credit reset completed at %', NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. สร้าง Cron Job สำหรับรันทุกๆ วันจันทร์ เวลา 00:00 (เที่ยงคืน)
-- หมายเหตุ: Supabase ใช้ timezone UTC ดังนั้น 00:00 UTC คือ 07:00 ของประเทศไทย
-- ถ้าต้องการให้รันตอนเที่ยงคืนประเทศไทย ให้ตั้งเวลาเป็น 17:00 UTC
SELECT cron.schedule(
    'weekly-credit-reset',
    '0 17 * * 1', -- ทุกวันจันทร์ เวลา 17:00 UTC (เท่ากับเที่ยงคืนประเทศไท้ย)
    'SELECT weekly_credit_reset();'
);

-- 3. สร้าง Function สำหรับตรวจสอบสถานะ Cron Job
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE(jobid bigint, schedule text, command text, active boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM cron.job WHERE jobid = (
        SELECT jobid FROM cron.job WHERE schedule = '0 17 * * 1' LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- คำสั่งสำหรับตรวจสอบและจัดการ Cron Job
-- =====================================================

-- ตรวจสอบ Cron Job ทั้งหมด:
-- SELECT * FROM cron.job;

-- ตรวจสอบสถานะ Cron Job ที่สร้าง:
-- SELECT * FROM get_cron_job_status();

-- หยุด Cron Job:
-- SELECT cron.unschedule('weekly-credit-reset');

-- รันการรีเซ็ตเครดิตด้วยตนเอง (ทดสอบ):
-- SELECT weekly_credit_reset();

-- =====================================================
-- เสร็จสิ้นการสร้าง Weekly Credit Reset System
-- =====================================================
-- หมายเหตุ: 
-- 1. Cron Job จะรันทุกวันจันทร์ เวลา 00:00 ตามเวลาประเทศไทย
-- 2. ทุกคนจะได้รับเครดิต 25 เครดิตใหม่
-- 3. มีการบันทึกประวัติการรีเซ็ตในตาราง credit_logs
-- 4. ต้องเปิดใช้งาน pg_cron extension ใน Supabase ก่อน
