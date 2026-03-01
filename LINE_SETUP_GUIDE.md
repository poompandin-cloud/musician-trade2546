# คู่มือการตั้งค่า LINE Login สำหรับรับแจ้งเตือนงาน

## 1. สร้าง LINE Login Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. ล็อกอินด้วยบัญชี LINE
3. สร้าง Provider ใหม่ (ถ้ายังไม่มี)
4. สร้าง Channel ประเภท **LINE Login**

## 2. ตั้งค่า Channel

ในหน้าจอตั้งค่า LINE Login Channel:

### **Basic settings**
- Channel name: Gig Glide (หรือชื่อแอปของคุณ)
- Channel description: แอปหางานดนตรีสำหรับนักดนตรีไทย
- Email: อีเมลของคุณ

### **LINE Login settings**
- **Callback URL**: `https://musiciantradethai.com/line-callback`
  - สำหรับ development: `http://localhost:8080/line-callback`
- **Login type**: Web app
- **Email permission**: เปิด (ถ้าต้องการ email)
- **Profile access**: เปิด (จำเป็นสำหรับดึง User ID)

## 3. รับ Client ID และ Client Secret

จากหน้า Channel settings ให้คัดลอก:
- **Channel ID** → ใช้เป็น `VITE_LINE_CLIENT_ID`
- **Channel Secret** → ใช้เป็น `VITE_LINE_CLIENT_SECRET`

## 4. ตั้งค่า Environment Variables

ไฟล์ `.env` ในโปรเจกต์ได้เพิ่ม LINE variables แล้ว:

```bash
# LINE Configuration
VITE_LINE_CLIENT_ID=YOUR_LINE_CHANNEL_ID
VITE_LINE_CLIENT_SECRET=YOUR_LINE_CHANNEL_SECRET
```

**⚠️ สำคัญ:**
1. รีสตาร์ท development server หลังจากเพิ่ม environment variables
2. ตรวจสอบว่าชื่อตัวแปรตรงกับในโค้ด (`VITE_LINE_CLIENT_ID`)
3. ไม่ต้องใส่เครื่องหมายคำพูด รอบๆ ค่า

## 5. อัปเดตฐานข้อมูล

รัน SQL script เพื่อเพิ่มคอลัมน์ `line_user_id`:

```sql
-- เพิ่มคอลัมน์ line_user_id ในตาราง profiles
ALTER TABLE profiles 
ADD COLUMN line_user_id TEXT;

-- เพิ่ม comment สำหรับอธิบายคอลัมน์
COMMENT ON COLUMN profiles.line_user_id IS 'LINE User ID สำหรับส่งการแจ้งเตือนงานผ่าน LINE Messaging API';
```

วิธีรัน:
1. เปิด Supabase Dashboard
2. ไปที่ SQL Editor
3. คัดลอกและวาง SQL ข้างบน
4. กด Run

## 6. ทดสอบระบบ

1. รีสตาร์ท development server
2. ไปที่หน้า Profile
3. คลิกปุ่ม "เชื่อมต่อ LINE รับแจ้งเตือนงาน"
4. ล็อกอินด้วย LINE
5. ตรวจสอบว่าปุ่มเปลี่ยนเป็น "✅ เชื่อมต่อ LINE เรียบร้อยแล้ว"

## 7. การใช้งานจริง (Production)

สำหรับ production:
1. เปลี่ยน Callback URL เป็น `https://musiciantradethai.com/line-callback`
2. ตั้งค่า environment variables บน hosting
3. ทดสอบอีกครั้งบน production URL

## หมายเหตุ

- LINE User ID จะถูกเก็บในตาราง `profiles.line_user_id`
- สามารถใช้ User ID นี้สำหรับส่งข้อความแจ้งเตือนผ่าน LINE Messaging API
- ผู้ใช้สามารถเชื่อมต่อได้ครั้งเดียวต่อบัญชี LINE
- สามารถยกเลิกการเชื่อมต่อได้โดยลบค่า `line_user_id` ออกจากฐานข้อมูล
