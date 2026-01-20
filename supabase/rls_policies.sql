-- ========================================
-- RLS Policies for job_applications table
-- ========================================

-- Enable RLS on job_applications table
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to read job applications
-- ทุกคนที่ล็อกอินสามารถอ่านรายการสมัครงานได้
CREATE POLICY "Allow authenticated users to read job applications" ON job_applications
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to create applications for jobs they don't own
-- ผู้ใช้สามารถสมัครงานที่ตัวเองไม่ใช่เจ้าของงาน
CREATE POLICY "Allow users to apply for jobs they don't own" ON job_applications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND applicant_id = auth.uid() 
        AND applicant_id != (SELECT user_id FROM jobs WHERE jobs.id = job_id)
    );

-- Policy 3: Allow users to update their own applications
-- ผู้ใช้สามารถแก้ไขการสมัครงานของตัวเองได้
CREATE POLICY "Allow users to update their own applications" ON job_applications
    FOR UPDATE USING (auth.role() = 'authenticated' AND applicant_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND applicant_id = auth.uid());

-- Policy 4: Allow job owners to update applications for their jobs
-- เจ้าของงานสามารถอัปเดตสถานะการสมัครสำหรับงานของตัวเองได้
CREATE POLICY "Allow job owners to update applications for their jobs" ON job_applications
    FOR UPDATE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.user_id = auth.uid()
        )
    );

-- Policy 5: Allow users to delete their own applications
-- ผู้ใช้สามารถลบการสมัครงานของตัวเองได้
CREATE POLICY "Allow users to delete their own applications" ON job_applications
    FOR DELETE USING (auth.role() = 'authenticated' AND applicant_id = auth.uid());

-- Policy 6: Allow job owners to delete applications for their jobs
-- เจ้าของงานสามารถลบการสมัครสำหรับงานของตัวเองได้
CREATE POLICY "Allow job owners to delete applications for their jobs" ON job_applications
    FOR DELETE USING (
        auth.role() = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.user_id = auth.uid()
        )
    );

-- ========================================
-- RLS Policies for reviews table
-- ========================================

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to read reviews
-- ทุกคนที่ล็อกอินสามารถอ่านรีวิวได้
CREATE POLICY "Allow authenticated users to read reviews" ON reviews
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to create reviews for jobs they participated in
-- ผู้ใช้สามารถเขียนรีวิวสำหรับงานที่ตัวเองเข้าร่วมได้
CREATE POLICY "Allow users to create reviews for participated jobs" ON reviews
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND reviewer_id = auth.uid()
        AND (
            -- เจ้าของงานสามารถรีวิวผู้สมัครที่ได้รับการยืนยัน
            (EXISTS (
                SELECT 1 FROM jobs 
                WHERE jobs.id = job_id 
                AND jobs.user_id = auth.uid()
                AND jobs.confirmed_applicant_id IS NOT NULL
            ))
            OR
            -- ผู้สมัครที่ได้รับการยืนยันสามารถรีวิวเจ้าของงานได้
            (EXISTS (
                SELECT 1 FROM jobs 
                WHERE jobs.id = job_id 
                AND jobs.confirmed_applicant_id = auth.uid()
            ))
        )
    );

-- Policy 3: Allow users to update their own reviews
-- ผู้ใช้สามารถแก้ไขรีวิวของตัวเองได้
CREATE POLICY "Allow users to update their own reviews" ON reviews
    FOR UPDATE USING (auth.role() = 'authenticated' AND reviewer_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND reviewer_id = auth.uid());

-- Policy 4: Allow users to delete their own reviews
-- ผู้ใช้สามารถลบรีวิวของตัวเองได้
CREATE POLICY "Allow users to delete their own reviews" ON reviews
    FOR DELETE USING (auth.role() = 'authenticated' AND reviewer_id = auth.uid());

-- ========================================
-- Additional Security Functions
-- ========================================

-- Function to check if user is job owner
-- ฟังก์ชันตรวจสอบว่าผู้ใช้เป็นเจ้าของงานหรือไม่
CREATE OR REPLACE FUNCTION is_job_owner(job_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_id_param 
        AND jobs.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is confirmed applicant
-- ฟังก์ชันตรวจสอบว่าผู้ใช้เป็นผู้สมัครที่ได้รับการยืนยันหรือไม่
CREATE OR REPLACE FUNCTION is_confirmed_applicant(job_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM jobs 
        WHERE jobs.id = job_id_param 
        AND jobs.confirmed_applicant_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can review job
-- ฟังก์ชันตรวจสอบว่าผู้ใช้สามารถรีวิวงานนี้ได้หรือไม่
CREATE OR REPLACE FUNCTION can_review_job(job_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        -- เจ้าของงานสามารถรีวิวได้ถ้ามีผู้สมัครที่ได้รับการยืนยัน
        (EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_id_param 
            AND jobs.user_id = auth.uid()
            AND jobs.confirmed_applicant_id IS NOT NULL
        ))
        OR
        -- ผู้สมัครที่ได้รับการยืนยันสามารถรีวิวได้
        (EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_id_param 
            AND jobs.confirmed_applicant_id = auth.uid()
        ))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Simplified Policies using Functions
-- ========================================

-- Alternative simplified policy for reviews using helper function
-- นโยบายการใช้ฟังก์ชันช่วย
CREATE POLICY "Allow users to create reviews using helper function" ON reviews
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND reviewer_id = auth.uid()
        AND can_review_job(job_id)
    );

-- ========================================
-- Indexes for Performance
-- ========================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);

-- ========================================
-- Grant Permissions
-- ========================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON job_applications TO authenticated;
GRANT SELECT ON job_applications TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO authenticated;
GRANT SELECT ON reviews TO anon;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- Test Queries (Optional - for testing)
-- ========================================

-- Test job application creation
-- INSERT INTO job_applications (job_id, user_id, status) 
-- VALUES ('your-job-id', 'your-user-id', 'pending');

-- Test review creation
-- INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment)
-- VALUES ('your-job-id', 'your-user-id', 'other-user-id', 5, 'Great work!');

-- ========================================
-- Security Notes
-- ========================================

/*
SECURITY CONSIDERATIONS:

1. RLS is enabled on both tables
2. All policies require authentication (auth.role() = 'authenticated')
3. Users can only modify their own data
4. Job owners have special privileges for their jobs
5. Reviews can only be created by participants in the job
6. Helper functions provide centralized security logic
7. Indexes improve query performance

POLICY BREAKDOWN:

job_applications:
- SELECT: All authenticated users can read
- INSERT: Users can apply for jobs they don't own
- UPDATE: Users can update their own applications + job owners can update status
- DELETE: Users can delete their own applications + job owners can delete

reviews:
- SELECT: All authenticated users can read
- INSERT: Only job participants can review
- UPDATE: Only review authors can update
- DELETE: Only review authors can delete

FUNCTIONS:
- is_job_owner(): Check if user owns the job
- is_confirmed_applicant(): Check if user was confirmed for the job
- can_review_job(): Check if user can review the job

PERFORMANCE:
- Indexes on foreign keys and frequently queried columns
- SECURITY DEFINER functions for complex checks
*/
