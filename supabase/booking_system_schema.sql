-- Gig Booking Platform Database Schema
-- Complete booking flow with reviews and prestige system

-- 1. Job Applications Table (สำหรับระบบการจอง)
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    musician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- สำหรับการติดตามสถานะ
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- ป้องกันการสมัครซ้ำ
    UNIQUE(job_id, musician_id)
);

-- 2. Reviews Table (สำหรับระบบรีวิวแบบ Dynamic)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    points_change INTEGER NOT NULL, -- -10, -5, -1, +1, +5, +10
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- ป้องกันการรีวิวซ้ำ
    UNIQUE(job_id, reviewer_id, reviewee_id)
);

-- 3. Jobs Table Update (เพิ่มฟิลด์สำหรับ booking flow)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS selected_musician_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- 4. Profiles Table Update (เพิ่มฟิลด์สำหรับระบบ prestige)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS received_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 15, -- เปลี่ยนจาก 25 เป็น 15
ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMP WITH TIME ZONE;

-- 5. Notifications Table (สำหรับระบบแจ้งเตือน)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb -- สำหรับเก็บข้อมูลเพิ่มเติม (job_id, application_id, etc.)
);

-- 6. Credit Reset Log (สำหรับติดตามการรีเซ็ตเครดิต)
CREATE TABLE IF NOT EXISTS credit_reset_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reset_date DATE NOT NULL,
    total_users_reset INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_musician_id ON job_applications(musician_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_selected_musician ON jobs(selected_musician_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- RLS (Row Level Security) Policies
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_reset_logs ENABLE ROW LEVEL SECURITY;

-- Job Applications RLS
CREATE POLICY "Users can view their own applications" ON job_applications
    FOR SELECT USING (auth.uid() = musician_id OR auth.uid() = (SELECT profiles.user_id FROM jobs WHERE jobs.id = job_applications.job_id));

CREATE POLICY "Users can insert their own applications" ON job_applications
    FOR INSERT WITH CHECK (auth.uid() = musician_id);

CREATE POLICY "Job owners can update applications" ON job_applications
    FOR UPDATE USING (auth.uid() = (SELECT profiles.user_id FROM jobs WHERE jobs.id = job_applications.job_id));

-- Reviews RLS
CREATE POLICY "Users can view reviews they're involved in" ON reviews
    FOR SELECT USING (auth.uid() = reviewer_id OR auth.uid() = reviewee_id);

CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Notifications RLS
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Credit Reset Logs RLS (read-only for authenticated users)
CREATE POLICY "Authenticated users can view reset logs" ON credit_reset_logs
    FOR SELECT USING (auth.role() = 'authenticated');
