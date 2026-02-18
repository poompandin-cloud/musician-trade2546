-- สร้างตาราง profile_likes สำหรับเก็บข้อมูลการถูกใจโปรไฟล์
CREATE TABLE IF NOT EXISTS profile_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- ป้องกันไม่ให้ผู้ใช้คนเดียวกดถูกใจโปรไฟล์เดียวกันหลายครั้ง
    UNIQUE(profile_id, user_id)
);

-- สร้าง Index สำหรับการค้นหาที่เร็วขึ้น
CREATE INDEX IF NOT EXISTS idx_profile_likes_profile_id ON profile_likes(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_likes_user_id ON profile_likes(user_id);

-- เปิดใช้งาน RLS (Row Level Security)
ALTER TABLE profile_likes ENABLE ROW LEVEL SECURITY;

-- สร้าง Policy สำหรับการดูข้อมูล (ทุกคนสามารถดูได้)
CREATE POLICY "Anyone can view profile likes" ON profile_likes
    FOR SELECT USING (true);

-- สร้าง Policy สำหรับการเพิ่มข้อมูล (ผู้ใช้ที่ล็อกอินสามารถเพิ่มได้)
CREATE POLICY "Authenticated users can like profiles" ON profile_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- สร้าง Policy สำหรับการลบข้อมูล (เจ้าของ like สามารถลบได้)
CREATE POLICY "Users can delete their own likes" ON profile_likes
    FOR DELETE USING (auth.uid() = user_id);

-- สร้าง Policy สำหรับการแก้ไข (ไม่อนุญาตให้แก้ไข)
CREATE POLICY "No updates allowed" ON profile_likes
    FOR UPDATE USING (false);
