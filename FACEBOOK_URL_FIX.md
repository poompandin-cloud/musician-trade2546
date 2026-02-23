# การแก้ไขปัญหา Facebook URL ไม่แสดงในหน้า Public View

## ปัญหาที่พบ
Facebook URL ไม่แสดงในหน้าโปรไฟล์คนอื่น แม้ว่ามีการบันทึกข้อมูลแล้ว

## สาเหตุที่เป็นไปได้
1. **Empty String Handling**: ข้อมูลอาจถูกบันทึกเป็น empty string (`""`) แทนที่จะเป็น `null`
2. **UI Logic**: การตรวจสอบ `profile?.facebook_url` อาจไม่รองรับกรณี empty string
3. **Data Validation**: ไม่มีการตรวจสอบว่าค่าเป็น empty string หรือไม่

## การแก้ไขที่ทำ

### 1. แก้ไขการแสดงผลใน UI
```tsx
// ก่อนแก้ไข
{profile?.facebook_url ? (
  <a href={profile.facebook_url}>...</a>
) : (
  <div>ไม่ระบุ</div>
)}

// หลังแก้ไข
{profile?.facebook_url && profile.facebook_url.trim() !== '' ? (
  <a href={profile.facebook_url}>...</a>
) : (
  <div>ไม่ระบุ</div>
)}
```

### 2. แก้ไขการจัดการข้อมูลใน formData
```tsx
// ก่อนแก้ไข
facebook_url: data.facebook_url || "",

// หลังแก้ไข
facebook_url: (data.facebook_url && data.facebook_url.trim() !== '') ? data.facebook_url : "",
```

### 3. แก้ไขการบันทึกข้อมูล
```tsx
// ก่อนแก้ไข
facebook_url: formData.facebook_url || null,

// หลังแก้ไข
facebook_url: (formData.facebook_url && formData.facebook_url.trim() !== '') ? formData.facebook_url : null,
```

## การตรวจสอบการแก้ไข

### 1. ตรวจสอบใน Console
เปิด Developer Console และดู log:
```
Facebook URL from DB: "https://www.facebook.com/username" หรือ ""
Rendering Facebook URL section - isOwner: false, profile?.facebook_url: "https://www.facebook.com/username"
```

### 2. ทดสอบกรณีต่างๆ
- **กรณีมีข้อมูล**: ควรแสดงเป็นลิงก์
- **กรณีไม่มีข้อมูล**: ควรแสดง "ไม่ระบุ"
- **กรณี empty string**: ควรแสดง "ไม่ระบุ"

### 3. ตรวจสอบใน Database
```sql
-- ตรวจสอบข้อมูลที่เป็น empty string
SELECT id, facebook_url, 
       CASE WHEN facebook_url IS NULL THEN 'NULL'
            WHEN facebook_url = '' THEN 'EMPTY'
            ELSE 'HAS_VALUE'
       END as status
FROM profiles 
WHERE id = 'your-profile-id';
```

## วิธีการป้องกัน

### 1. Database Level
- ใช้ `NOT NULL` constraint ถ้าต้องการให้มีค่าเสมอ
- ใช้ `CHECK` constraint สำหรับ validate URL format
- ตั้งค่า default เป็น `NULL`

### 2. Application Level
- ตรวจสอบ empty string ทุกครั้งก่อนแสดงผล
- ใช้ helper function สำหรับ validation
- จัดการ null และ empty string อย่างสม่ำเสมอ

### 3. UI Level
- แสดงผลที่ชัดเจนสำหรับทุกกรณี
- ใช้ loading state ขณะดึงข้อมูล
- แสดง error message ถ้ามีปัญหา
