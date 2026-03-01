-- เพิ่มคอลัมน์ line_user_id ในตาราง profiles
ALTER TABLE profiles 
ADD COLUMN line_user_id TEXT;

-- เพิ่ม comment สำหรับอธิบายคอลัมน์
COMMENT ON COLUMN profiles.line_user_id IS 'LINE User ID สำหรับส่งการแจ้งเตือนงานผ่าน LINE Messaging API';
