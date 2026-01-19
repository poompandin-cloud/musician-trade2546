-- =====================================================
-- สร้าง Storage Bucket สำหรับเก็บรูปโปรไฟล์
-- =====================================================
-- หมายเหตุ: รัน SQL นี้ใน Supabase SQL Editor

-- สร้าง bucket ชื่อ "avatars" สำหรับเก็บรูปโปรไฟล์
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- สร้าง Policy: ทุกคนสามารถดูรูปโปรไฟล์ได้ (เพราะเป็น public bucket)
DROP POLICY IF EXISTS "Public Avatar Access" ON storage.objects;
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- สร้าง Policy: ผู้ใช้สามารถอัปโหลดรูปโปรไฟล์ของตัวเองได้เท่านั้น
-- ตรวจสอบว่า path ขึ้นต้นด้วย user_id ของตัวเอง (เช่น {user_id}/filename.jpg)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (split_part(name, '/', 1) = auth.uid()::text)
);

-- สร้าง Policy: ผู้ใช้สามารถอัปเดตรูปโปรไฟล์ของตัวเองได้เท่านั้น
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (split_part(name, '/', 1) = auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (split_part(name, '/', 1) = auth.uid()::text)
);

-- สร้าง Policy: ผู้ใช้สามารถลบรูปโปรไฟล์ของตัวเองได้เท่านั้น
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (split_part(name, '/', 1) = auth.uid()::text)
);

-- =====================================================
-- เสร็จสิ้นการสร้าง Storage Bucket
-- =====================================================
-- หมายเหตุ: 
-- 1. Bucket "avatars" จะถูกสร้างเป็น public เพื่อให้สามารถดูรูปโปรไฟล์ได้
-- 2. ผู้ใช้สามารถอัปโหลด/อัปเดต/ลบรูปของตัวเองเท่านั้น
-- 3. รูปจะถูกเก็บในรูปแบบ: avatars/{user_id}/{timestamp}.{ext}
-- 4. Policy ตรวจสอบว่า folder แรกใน path ต้องเป็น user_id ของผู้ใช้เอง
