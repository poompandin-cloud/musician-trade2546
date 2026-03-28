-- สร้าง Supabase Storage bucket สำหรับเก็บรูปภาพแชท
-- ชื่อ bucket: chat_images

-- สร้าง bucket (ถ้ายังไม่มี)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat_images', 
    'chat_images', 
    true, 
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ตั้งค่า RLS policies สำหรับ bucket
-- 1. ทุกคนสามารถอ่านไฟล์ได้
CREATE POLICY "Anyone can view chat images" ON storage.objects
FOR SELECT USING (bucket_id = 'chat_images');

-- 2. เฉพาะผู้ใช้ที่ล็อกอินสามารถอัปโหลดไฟล์ได้
CREATE POLICY "Authenticated users can upload chat images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'chat_images' AND 
    auth.role() = 'authenticated'
);

-- 3. เจ้าของไฟล์สามารถอัปเดตไฟล์ได้
CREATE POLICY "Users can update their own chat images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'chat_images' AND 
    auth.role() = 'authenticated' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. เจ้าของไฟล์สามารถลบไฟล์ได้
CREATE POLICY "Users can delete their own chat images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'chat_images' AND 
    auth.role() = 'authenticated' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- ตรวจสอบว่ามี bucket แล้วหรือยัง
SELECT * FROM storage.buckets WHERE name = 'chat_images';

-- ตรวจสอบ policies ที่เกี่ยวข้องกับ chat_images
SELECT * FROM storage.policies WHERE bucket_id = 'chat_images';

-- แสดงข้อมูลไฟล์ใน bucket (ถ้ามี)
SELECT * FROM storage.objects WHERE bucket_id = 'chat_images' ORDER BY created_at DESC LIMIT 10;
