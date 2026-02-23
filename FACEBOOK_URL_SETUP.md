# การตั้งค่า Facebook URL ในระบบ

## ปัญหาที่พบ
ผู้ใช้บันทึกข้อมูล Facebook URL ได้สำเร็จ แต่เมื่อใช้บัญชีอื่นเข้าดูโปรไฟล์ (Public View) ไม่แสดงข้อมูล Facebook

## สาเหตุ
ตาราง `profiles` ใน Supabase ยังไม่มีคอลัมน์ `facebook_url`

## วิธีแก้ไข

### 1. รัน SQL Migration ใน Supabase
1. เข้าไปที่ Supabase Dashboard
2. ไปที่เมนู SQL Editor
3. รันคำสั่งต่อไปนี้:

```sql
-- Add facebook_url column
ALTER TABLE profiles 
ADD COLUMN facebook_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.facebook_url IS 'Facebook profile URL with full https://www.facebook.com/ format';

-- Update Row Level Security (RLS) policy
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

### 2. ตรวจสอบการทำงาน
หลังรัน migration แล้ว:
1. ทดสอบเข้าหน้าโปรไฟล์ของตัวเอง
2. กรอก Facebook URL และบันทึก
3. ล็อกเอาท์แล้วใช้บัญชีอื่นเข้าดู
4. ควรจะเห็นปุ่ม/ลิงก์ Facebook แสดงผล

### 3. ตรวจสอบใน Console
เปิด Developer Console แล้วดูว่ามี log:
- `Profile data loaded:` - แสดงข้อมูลที่โหลดมา
- `Facebook URL from DB:` - แสดงค่า facebook_url ที่ได้จากฐานข้อมูล

## ฟีเจอร์ที่ควรทำงาน
- ✅ สำหรับเจ้าของโปรไฟล์: แสดง input field ที่แก้ไขได้
- ✅ สำหรับผู้เข้าชม (มี Facebook URL): แสดงเป็นลิงก์ที่คลิกได้
- ✅ สำหรับผู้เข้าชม (ไม่มี Facebook URL): แสดง "ไม่ระบุ"
- ✅ Auto-format URL: กรอกแค่ username จะเติม https://www.facebook.com/ อัตโนมัติ

## การตรวจสอบสิทธิ์
ระบบตรวจสอบสิทธิ์แล้ว:
- เจ้าของโปรไฟล์เท่านั้นที่แก้ไขได้
- คนอื่นเห็นเป็นลิงก์เท่านั้น
- มี RLS policy ป้องกันในระดับ database
