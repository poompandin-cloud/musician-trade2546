-- สร้างตาราง profile_comments สำหรับเก็บคอมเมนต์ในหน้าโปรไฟล์
CREATE TABLE IF NOT EXISTS profile_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เพิ่ม indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_profile_comments_profile_id ON profile_comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_author_id ON profile_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_profile_comments_created_at ON profile_comments(created_at DESC);

-- เพิ่ม comment สำหรับอธิบายตาราง
COMMENT ON TABLE profile_comments IS 'ตารางเก็บคอมเมนต์ในหน้าโปรไฟล์';
COMMENT ON COLUMN profile_comments.id IS 'Primary key ของคอมเมนต์';
COMMENT ON COLUMN profile_comments.profile_id IS 'ID ของเจ้าของหน้าโปรไฟล์ที่ถูกคอมเมนต์';
COMMENT ON COLUMN profile_comments.author_id IS 'ID ของผู้เขียนคอมเมนต์';
COMMENT ON COLUMN profile_comments.content IS 'เนื้อหาคอมเมนต์';
COMMENT ON COLUMN profile_comments.created_at IS 'วันที่สร้างคอมเมนต์';
COMMENT ON COLUMN profile_comments.updated_at IS 'วันที่อัปเดตคอมเมนต์ล่าสุด';

-- สร้าง RLS (Row Level Security) policies
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

-- Policy 1: ทุกคนสามารถอ่านคอมเมนต์ได้
CREATE POLICY "Anyone can view profile comments" ON profile_comments
    FOR SELECT USING (true);

-- Policy 2: ทุกคนที่ล็อกอินสามารถคอมเมนต์ได้
CREATE POLICY "Authenticated users can insert comments" ON profile_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy 3: ผู้เขียนคอมเมนต์สามารถแก้ไขได้
CREATE POLICY "Authors can edit their own comments" ON profile_comments
    FOR UPDATE USING (auth.uid() = author_id);

-- Policy 4: เจ้าของโปรไฟล์และเจ้าของคอมเมนต์สามารถลบได้
CREATE POLICY "Profile owners and comment authors can delete comments" ON profile_comments
    FOR DELETE USING (
        auth.uid() = profile_id OR 
        auth.uid() = author_id
    );
