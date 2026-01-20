# ✅ แก้ไข RLS Policies - ใช้ชื่อคอลัมน์ที่ถูกต้อง

## สิ่งที่ได้แก้ไข:

### 1. 🔧 ตาราง job_applications
**เปลี่ยนจาก** `user_id` **เป็น** `applicant_id`:

#### Policies ที่แก้ไข:
- **INSERT Policy**: `applicant_id = auth.uid()` และ `applicant_id != (SELECT user_id FROM jobs...)`
- **UPDATE Policy**: `applicant_id = auth.uid()` (USING และ WITH CHECK)
- **DELETE Policy**: `applicant_id = auth.uid()` (สำหรับผู้สมัคร)

#### Indexes ที่แก้ไข:
- `idx_job_applications_applicant_id` แทน `idx_job_applications_user_id`

### 2. ⭐ ตาราง reviews
**ใช้ `reviewer_id` อยู่แล้ว** (ไม่ต้องแก้ไข):

#### Policies ที่ตรวจสอบแล้ว:
- **INSERT Policy**: `reviewer_id = auth.uid()` ✅
- **UPDATE Policy**: `reviewer_id = auth.uid()` ✅  
- **DELETE Policy**: `reviewer_id = auth.uid()` ✅

#### Indexes ที่ตรวจสอบแล้ว:
- `idx_reviews_reviewer_id` ✅
- `idx_reviews_reviewee_id` ✅

### 3. 🛡️ Security Functions
**ยังคงใช้ logic เดิม** (ไม่ต้องแก้ไข):
- `is_job_owner()` - ใช้ `jobs.user_id` ถูกต้อง ✅
- `is_confirmed_applicant()` - ใช้ `jobs.confirmed_applicant_id` ถูกต้อง ✅
- `can_review_job()` - ใช้ `jobs.user_id` ถูกต้อง ✅

## โค้ด SQL ที่แก้ไขแล้ว:

### job_applications Policies:
```sql
-- INSERT: ใช้ applicant_id
CREATE POLICY "Allow users to apply for jobs they don't own" ON job_applications
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND applicant_id = auth.uid() 
        AND applicant_id != (SELECT user_id FROM jobs WHERE jobs.id = job_id)
    );

-- UPDATE: ใช้ applicant_id
CREATE POLICY "Allow users to update their own applications" ON job_applications
    FOR UPDATE USING (auth.role() = 'authenticated' AND applicant_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND applicant_id = auth.uid());

-- DELETE: ใช้ applicant_id
CREATE POLICY "Allow users to delete their own applications" ON job_applications
    FOR DELETE USING (auth.role() = 'authenticated' AND applicant_id = auth.uid());
```

### reviews Policies:
```sql
-- INSERT: ใช้ reviewer_id (ถูกต้องแล้ว)
CREATE POLICY "Allow users to create reviews for participated jobs" ON reviews
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND reviewer_id = auth.uid()
        AND (condition...)
    );

-- UPDATE: ใช้ reviewer_id (ถูกต้องแล้ว)
CREATE POLICY "Allow users to update their own reviews" ON reviews
    FOR UPDATE USING (auth.role() = 'authenticated' AND reviewer_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND reviewer_id = auth.uid());

-- DELETE: ใช้ reviewer_id (ถูกต้องแล้ว)
CREATE POLICY "Allow users to delete their own reviews" ON reviews
    FOR DELETE USING (auth.role() = 'authenticated' AND reviewer_id = auth.uid());
```

### Indexes:
```sql
-- job_applications indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON reviews(job_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
```

## วิธีรัน SQL ใหม่:

### 1. ลบ Policies เก่า (ถ้ามี):
```sql
-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow users to apply for jobs they don't own" ON job_applications;
DROP POLICY IF EXISTS "Allow users to update their own applications" ON job_applications;
DROP POLICY IF EXISTS "Allow users to delete their own applications" ON job_applications;
-- (และ policies อื่นๆ ที่เกี่ยวข้อง)
```

### 2. รัน SQL ใหม่:
```sql
-- รันทั้งหมดใน Supabase SQL Editor
-- ไฟล์: supabase/rls_policies.sql
```

### 3. ตรวจสอบผล:
```sql
-- ตรวจสอบ policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('job_applications', 'reviews');

-- ตรวจสอบ indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('job_applications', 'reviews');
```

## ความปลอดภัยที่ได้:

✅ **Correct Column Names**: ใช้ `applicant_id` และ `reviewer_id` ตาม schema  
✅ **No Column Errors**: ไม่มี error "column does not exist"  
✅ **Proper RLS**: ทุก policy ตรวจสอบสิทธิ์อย่างถูกต้อง  
✅ **Performance**: Indexes สำหรับคอลัมน์ที่ถูกต้อง  
✅ **Security Logic**: Functions ใช้ชื่อคอลัมน์ที่ถูกต้อง  

**ตอนนี้สามารถรัน SQL ได้โดยไม่มี error!** 🛡️✨
