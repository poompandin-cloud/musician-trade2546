-- =====================================================
-- Booking Flow & Review System
-- =====================================================
-- หมายเหตุ: รัน SQL นี้ใน Supabase SQL Editor

-- 1. สร้างตาราง job_applications สำหรับจัดการการจองงาน
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, rejected, completed
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    contact_shared BOOLEAN DEFAULT FALSE, -- เปิดเผยข้อมูลติดต่อระหว่างกันหรือไม่
    notes TEXT, -- หมายเหตุจากผู้สมัคร
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. สร้างตาราง reviews สำหรับระบบรีวิวซึ่งกันและกัน
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 1-5 ดาว
    points_change INTEGER NOT NULL, -- -10 ถึง +10 คะแนน
    comment TEXT,
    review_type TEXT NOT NULL, -- 'musician_to_owner' หรือ 'owner_to_musician'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- ป้องกันการรีวิวซ้ำ
    UNIQUE(job_id, reviewer_id, review_type)
);

-- 3. เพิ่มคอลัมน์ status ในตาราง jobs (ถ้ายังไม่มี)
DO $$ 
BEGIN
    -- เพิ่ม status ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'status'
    ) THEN
        ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'open';
    END IF;

    -- เพิ่ม end_time ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'end_time'
    ) THEN
        ALTER TABLE jobs ADD COLUMN end_time TIMESTAMPTZ;
    END IF;

    -- เพิ่ม confirmed_applicant_id ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'confirmed_applicant_id'
    ) THEN
        ALTER TABLE jobs ADD COLUMN confirmed_applicant_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 4. สร้าง Index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

-- 5. ตั้งค่า Row Level Security (RLS) สำหรับ job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับ job_applications
DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
CREATE POLICY "Users can view own applications"
    ON job_applications
    FOR SELECT
    USING (auth.uid() = applicant_id OR auth.uid() = (SELECT user_id FROM jobs WHERE jobs.id = job_applications.job_id));

DROP POLICY IF EXISTS "Users can insert own applications" ON job_applications;
CREATE POLICY "Users can insert own applications"
    ON job_applications
    FOR INSERT
    WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Job owners can update applications" ON job_applications;
CREATE POLICY "Job owners can update applications"
    ON job_applications
    FOR UPDATE
    USING (auth.uid() = (SELECT user_id FROM jobs WHERE jobs.id = job_applications.job_id));

-- 6. ตั้งค่า Row Level Security (RLS) สำหรับ reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับ reviews
DROP POLICY IF EXISTS "Users can view relevant reviews" ON reviews;
CREATE POLICY "Users can view relevant reviews"
    ON reviews
    FOR SELECT
    USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

DROP POLICY IF EXISTS "Users can insert reviews" ON reviews;
CREATE POLICY "Users can insert reviews"
    ON reviews
    FOR INSERT
    WITH CHECK (auth.uid() = reviewer_id);

-- 7. สร้าง Function สำหรับอัปเดตคะแนน received_tokens
CREATE OR REPLACE FUNCTION update_received_tokens(
    user_uuid UUID,
    points_change INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_tokens INTEGER;
    new_tokens INTEGER;
BEGIN
    -- ดึงคะแนนปัจจุบัน (ใช้ prestige_points ถ้ามี หรือ received_tokens ถ้ามี)
    BEGIN
        SELECT prestige_points INTO current_tokens 
        FROM profiles 
        WHERE id = user_uuid;
        
        -- ถ้าไม่มี prestige_points ให้ลอง received_tokens
        IF current_tokens IS NULL THEN
            SELECT received_tokens INTO current_tokens 
            FROM profiles 
            WHERE id = user_uuid;
        END IF;
        
        -- ถ้ายังไม่มีเลย ให้เริ่มที่ 100
        IF current_tokens IS NULL THEN
            current_tokens := 100;
        END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            current_tokens := 100;
    END;
    
    -- คำนวณคะแนนใหม่ (สามารถติดลบได้)
    new_tokens := current_tokens + points_change;
    
    -- อัปเดตคะแนน (อัปเดตทั้ง prestige_points และ received_tokens)
    UPDATE profiles 
    SET 
        prestige_points = new_tokens,
        received_tokens = new_tokens,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating received tokens: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. สร้าง Function สำหรับคำนวณคะแนนจาก rating
CREATE OR REPLACE FUNCTION calculate_points_from_rating(rating INTEGER)
RETURNS INTEGER AS $$
BEGIN
    CASE rating
        WHEN 5 THEN RETURN 10;  -- ดีมาก (5 ดาว): +10
        WHEN 4 THEN RETURN 5;   -- ดี (4 ดาว): +5
        WHEN 3 THEN RETURN 1;   -- ปกติ (3 ดาว): +1
        WHEN 2 THEN RETURN -5;  -- พอใช้ (2 ดาว): -5
        WHEN 1 THEN RETURN -10; -- แย่มาก (1 ดาว): -10
        ELSE RETURN 0;
    END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. สร้าง Trigger สำหรับอัปเดตคะแนนอัตโนมัติเมื่อมีการรีวิว
CREATE OR REPLACE FUNCTION auto_update_tokens_on_review()
RETURNS TRIGGER AS $$
BEGIN
    -- อัปเดตคะแนนของคนที่ถูกรีวิว
    PERFORM update_received_tokens(NEW.reviewee_id, NEW.points_change);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง Trigger
DROP TRIGGER IF EXISTS trigger_auto_update_tokens ON reviews;
CREATE TRIGGER trigger_auto_update_tokens
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_tokens_on_review();

-- =====================================================
-- เสร็จสิ้นการสร้าง Booking Flow & Review System
-- =====================================================
-- หมายเหตุ: 
-- 1. job_applications: เก็บการจองงานทั้งหมด
-- 2. reviews: เก็บการรีวิวและคะแนน
-- 3. jobs.status: 'open', 'closed', 'completed'
-- 4. Function อัปเดตคะแนนอัตโนมัติ
-- 5. รองรับคะแนนติดลบได้
