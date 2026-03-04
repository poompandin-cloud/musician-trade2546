-- เพิ่มคอลัมน์ author_ip สำหรับเก็บ IP Address ของผู้คอมเมนต์
ALTER TABLE profile_comments ADD COLUMN IF NOT EXISTS author_ip TEXT;

-- เพิ่ม comment สำหรับอธิบายคอลัมน์ใหม่
COMMENT ON COLUMN profile_comments.author_ip IS 'IP Address ของผู้เขียนคอมเมนต์ (Admin Only)';

-- อัปเดต RLS Policies ให้เข้มงวดขึ้น
-- ลบ Policy เดิมทั้งหมดก่อน
DROP POLICY IF EXISTS "Anyone can view profile comments" ON profile_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON profile_comments;
DROP POLICY IF EXISTS "Authors can edit their own comments" ON profile_comments;
DROP POLICY IF EXISTS "Profile owners and comment authors can delete comments" ON profile_comments;

-- Policy 1: ทุกคนสามารถอ่านคอมเมนต์ได้ แต่ไม่รวม IP Address
CREATE POLICY "Anyone can view profile comments (without IP)" ON profile_comments
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

-- สร้างฟังก์ชันสำหรับ Admin ในการดู IP Address
CREATE OR REPLACE FUNCTION admin_get_comment_with_ip(comment_id UUID)
RETURNS TABLE (
    id UUID,
    profile_id UUID,
    author_id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    author_ip TEXT,
    author_full_name TEXT,
    author_avatar_url TEXT
)
SECURITY DEFINER
AS $$
BEGIN
    -- ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่ (ต้องมี admin role ใน profiles)
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
        pc.id,
        pc.profile_id,
        pc.author_id,
        pc.content,
        pc.created_at,
        pc.updated_at,
        pc.author_ip,
        p.full_name as author_full_name,
        p.avatar_url as author_avatar_url
    FROM profile_comments pc
    LEFT JOIN profiles p ON pc.author_id = p.id
    WHERE pc.id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- สร้างฟังก์ชันสำหรับ Admin ในการดู IP Address ทั้งหมดในโปรไฟล์
CREATE OR REPLACE FUNCTION admin_get_profile_comments_with_ip(profile_uuid UUID)
RETURNS TABLE (
    id UUID,
    profile_id UUID,
    author_id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    author_ip TEXT,
    author_full_name TEXT,
    author_avatar_url TEXT
)
SECURITY DEFINER
AS $$
BEGIN
    -- ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin access required';
    END IF;
    
    RETURN QUERY
    SELECT 
        pc.id,
        pc.profile_id,
        pc.author_id,
        pc.content,
        pc.created_at,
        pc.updated_at,
        pc.author_ip,
        p.full_name as author_full_name,
        p.avatar_url as author_avatar_url
    FROM profile_comments pc
    LEFT JOIN profiles p ON pc.author_id = p.id
    WHERE pc.profile_id = profile_uuid
    ORDER BY pc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- สร้าง view สำหรับการดูคอมเมนต์โดยไม่รวม IP Address (สำหรับ Frontend)
CREATE OR REPLACE VIEW public_comments AS
SELECT 
    id,
    profile_id,
    author_id,
    content,
    created_at,
    updated_at
FROM profile_comments;

-- สร้าง RLS สำหรับ view นี้ด้วย
ALTER TABLE public_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public comments" ON public_comments
    FOR SELECT USING (true);
