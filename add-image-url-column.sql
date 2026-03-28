-- เพิ่มคอลัมน์ image_url ในตาราง public_chats
-- สำหรับเก็บ URL ของรูปภาพที่อัปโหลดไปยัง Supabase Storage

-- เพิ่มคอลัมน์ image_url แบบ optional (nullable)
ALTER TABLE public_chats 
ADD COLUMN image_url TEXT;

-- เพิ่ม comment อธิบายคอลัมน์
COMMENT ON COLUMN public_chats.image_url IS 'URL ของรูปภาพที่อัปโหลดไปยัง Supabase Storage (chat_images bucket)';

-- ตรวจสอบโครงสร้างตารางหลังเพิ่มคอลัมน์
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'public_chats' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ตรวจสอบว่ามีคอลัมน์ image_url แล้วหรือยัง
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'public_chats' 
        AND table_schema = 'public'
        AND column_name = 'image_url'
) as has_image_url_column;

-- แสดงตัวอย่างข้อมูลในตาราง (ถ้ามี)
SELECT id, content, user_id, created_at, image_url 
FROM public_chats 
ORDER BY created_at DESC 
LIMIT 5;
