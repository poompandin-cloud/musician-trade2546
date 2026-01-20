-- =====================================================
-- เพิ่มคอลัมน์ video_urls ในตาราง profiles
-- =====================================================

-- เพิ่มคอลัมน์ video_urls สำหรับเก็บหลายลิงก์วิดีโอ
DO $$ 
BEGIN
    -- เพิ่ม video_urls ถ้ายังไม่มี
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'video_urls'
    ) THEN
        ALTER TABLE profiles ADD COLUMN video_urls TEXT[] DEFAULT NULL;
    END IF;
END $$;

-- อัปเดต RLS Policy สำหรับ video_urls
-- อนุญาตให้ผู้ใช้อัปเดตคอลัมน์ video_urls ของตัวเองได้
DROP POLICY IF EXISTS "Users can update own profile with videos" ON profiles;
CREATE POLICY "Users can update own profile with videos"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        -- ตรวจสอบว่า video_urls เป็น array ที่ถูกต้อง
        (video_urls IS NULL OR 
         (array_length(video_urls, 1) <= 5 AND
          (SELECT COUNT(*) = array_length(video_urls, 1) FROM unnest(video_urls) AS url 
           WHERE url ~ '^https?://(www\.)?(youtube\.com/(watch\?v=|embed/|shorts/)|youtu\.be/|facebook\.com/[^/]+/videos/|fb\.watch/).*$'))
        )
    );

-- อัปเดต RLS Policy สำหรับการ insert (สำหรับ trigger)
DROP POLICY IF EXISTS "Users can insert own profile with videos" ON profiles;
CREATE POLICY "Users can insert own profile with videos"
    ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- เสร็จการอัปเกรดระบบ
-- =====================================================

-- รีเฟรช PostgREST cache เพื่อให้ schema ใหม่มีผลทันที
NOTIFY pgrst, 'reload schema';

-- เพิ่ม comment อธิบายการใช้งาน
COMMENT ON COLUMN profiles.video_urls IS 'Array of video URLs (YouTube and Facebook) for musician portfolio';
