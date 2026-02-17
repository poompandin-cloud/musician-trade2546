-- SQL Script สำหรับรีเซ็ตเครดิตรายเดือน (Credit Monthly Reset)
-- รันทุกวันที่ 1 ของเดือน เวลา 00:00 น.

-- 1. สร้าง Function สำหรับรีเซ็ตเครดิตรายเดือน
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- อัปเดตเครดิตทุกคนเป็น 25
    UPDATE public.profiles 
    SET credits = 25, 
        updated_at = NOW()
    WHERE credits IS NOT NULL;
    
    -- บันทึก log ว่ามีการรีเซ็ต
    INSERT INTO public.credit_reset_logs (reset_date, total_users_reset, credits_per_user)
    VALUES (
        NOW(),
        (SELECT COUNT(*) FROM public.profiles WHERE credits IS NOT NULL),
        25
    );
    
    RAISE LOG 'Monthly credit reset completed: % users reset to 25 credits', 
        (SELECT COUNT(*) FROM public.profiles WHERE credits IS NOT NULL);
END;
$$;

-- 2. สร้างตารางสำหรับเก็บ log การรีเซ็ตเครดิต (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.credit_reset_logs (
    id BIGSERIAL PRIMARY KEY,
    reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_users_reset INTEGER,
    credits_per_user INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. สร้าง Cron Job สำหรับรัน function ทุกวันที่ 1 ของเดือน
-- ใช้ pg_cron extension (ต้องติดตั้งก่อน)
-- รันเวลา 00:00 ของวันที่ 1 ทุกเดือน
SELECT cron.schedule(
    'monthly-credit-reset',
    '0 0 1 * *',  -- นาที 0, ชั่วโมง 0, วันที่ 1, ทุกเดือน
    'SELECT reset_monthly_credits();'
);

-- 4. ตรวจสอบ Cron Jobs ที่มีอยู่
SELECT * FROM cron.job;

-- 5. ทดสอบการรัน function (สำหรับทดสอบเท่านั้น)
-- SELECT reset_monthly_credits();

-- 6. ตรวจสอบว่ามี pg_cron extension หรือไม่
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- ถ้ายังไม่มี pg_cron ให้รันคำสั่งนี้:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
