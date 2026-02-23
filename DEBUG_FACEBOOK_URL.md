# การตรวจสอบปัญหา Facebook URL ไม่แสดง

## ขั้นตอนการตรวจสอบ

### 1. เปิด Developer Console
1. คลิกขวาที่หน้าเว็บ
2. เลือก "Inspect" หรือ "ตรวจสอบ"
3. ไปที่แท็บ "Console"

### 2. ตรวจสอบ Log ที่แสดง
เมื่อโหลดหน้าโปรไฟล์ ควรเห็น log ดังนี้:

```
Profile data loaded: {id: "...", full_name: "...", facebook_url: "...", ...}
Facebook URL from DB: "https://www.facebook.com/username" หรือ undefined
isOwner: false  (สำหรับคนอื่น)
profileUserId: "abc123"  (ID ของโปรไฟล์ที่ดู)
currentUserId: "def456"  (ID ของผู้ใช้ที่ล็อกอิน)
Rendering Facebook URL section - isOwner: false, profile?.facebook_url: "https://www.facebook.com/username"
```

### 3. กรณีศึกษา

#### กรณีที่ 1: Database ยังไม่มีคอลัมน์ facebook_url
```
Facebook URL from DB: undefined
```
**วิธีแก้ไข**: รัน SQL migration ใน Supabase

#### กรณีที่ 2: ข้อมูลถูกโหลดแต่ไม่แสดง
```
Facebook URL from DB: "https://www.facebook.com/username"
Rendering Facebook URL section - isOwner: false, profile?.facebook_url: "https://www.facebook.com/username"
```
**วิธีแก้ไข**: ตรวจสอบว่า UI condition ถูกต้องหรือไม่

#### กรณีที่ 3: ข้อมูลไม่ถูกโหลด
```
Profile data loaded: null
```
**วิธีแก้ไข**: ตรวจสอบการเชื่อมต่อ Supabase

### 4. การตรวจสอบใน Supabase

#### ตรวจสอบคอลัมน์ในตาราง
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'facebook_url';
```

#### ตรวจสอบข้อมูล
```sql
SELECT id, full_name, facebook_url
FROM profiles
WHERE id = 'your-profile-id';
```

### 5. การแก้ไขปัญหาที่พบบ

#### ปัญหา: ไม่มีคอลัมน์ facebook_url
1. รัน SQL migration ใน Supabase Dashboard
2. รีเฟรชหน้าเว็บ
3. ทดสอบอีกครั้ง

#### ปัญหา: มีคอลัมน์แต่ข้อมูลเป็น null
1. ตรวจสอบว่าเจ้าของโปรไฟล์เคยบันทึกข้อมูลหรือไม่
2. ถ้ายังไม่ได้บันทึก ให้เจ้าของเข้าไปบันทึกก่อน
3. ทดสอบการดูอีกครั้ง

#### ปัญหา: UI ไม่แสดงผลถูกต้อง
1. ตรวจสอบ console.log ว่าข้อมูลมาครบหรือไม่
2. ตรวจสอบ condition `isOwner` และ `profile?.facebook_url`
3. ตรวจสอบว่า component ถูก render ซ้ำหรือไม่

### 6. คำถามที่ต้องตอบ

- ใน console แสดง `Facebook URL from DB:` เป็นอะไร?
- แสดง `isOwner:` เป็น `true` หรือ `false`?
- มี error ใน console หรือไม่?
- การรัน SQL migration สำเร็จหรือไม่?
- หลังจากรัน migration แล้วรีเฟรชหรือไม่?

### 7. วิธีการแก้ไขแบบละเอียด

1. **รัน Migration**: รัน SQL ใน Supabase ก่อน
2. **เช็ค Database**: ยืนยันว่าคอลัมน์ถูกเพิ่ม
3. **ทดสอบ Owner**: บันทึกข้อมูลด้วยเจ้าของโปรไฟล์
4. **ทดสอบ Public**: ดูโปรไฟล์ด้วยบัญชีอื่น
5. **ตรวจสอบ Console**: ดู log ทั้งหมดใน console
