# แก้ไขปัญหาข้อมูลปฏิทินรั่วไปหน้าอื่น

## ปัญหา
- ข้อมูลจากปฏิทินส่วนตัวไปปรากฏในหน้า "งานที่ประกาศ" (Nearby Gigs)
- ทำให้ผู้ใช้เห็นกำหนดการส่วนตัวในหน้าที่ควรจะเห็นเฉพาะการจ้างงาน

## วิธีแก้ไข

### 1. เพิ่มคอลัมน์ is_calendar_entry
```sql
-- รัน migration: supabase_migrations/add_is_calendar_entry_column.sql
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS is_calendar_entry BOOLEAN DEFAULT FALSE;
```

### 2. อัปเดตการบันทึกข้อมูลปฏิทิน
**ProfilePage.tsx - handleSaveJob:**
```tsx
const jobData = {
  user_id: profileUserId,
  instrument: job.title,
  start_time: job.start_time,
  end_time: endTime,
  date: job.date,
  is_calendar_entry: true, // ✅ ระบุว่าเป็นข้อมูลจากปฏิทิน
};
```

### 3. กรองข้อมูลในแต่ละหน้า

#### ปฏิทินส่วนตัว (fetchCalendarJobs):
```tsx
const { data, error } = await supabase
  .from('jobs')
  .select('*')
  .eq('user_id', profileUserId)
  .eq('is_calendar_entry', true) // ✅ ดึงเฉพาะ calendar entries
  .order('date', { ascending: true });
```

#### งานที่ฉันประกาศ (fetchMyJobs):
```tsx
const { data, error } = await (supabase as any)
  .from("jobs")
  .select("*")
  .eq("user_id", profileUserId)
  .eq("is_calendar_entry", false) // ✅ ดึงเฉพาะงานประกาศ
  .order("created_at", { ascending: false });
```

#### งานที่ประกาศ (Nearby Gigs - App.tsx):
```tsx
const activeJobs = jobs.filter(job => {
  if (!job.created_at) return true;
  const jobTime = new Date(job.created_at).getTime();
  const isRecent = (Date.now() - jobTime) < (3 * 24 * 60 * 60 * 1000);
  const isNotCalendarEntry = !job.is_calendar_entry; // ✅ กรองออก calendar entries
  return isRecent && isNotCalendarEntry;
});
```

### 4. Clean Data เก่า
```sql
-- รัน: clean_calendar_data.sql
UPDATE jobs 
SET is_calendar_entry = true 
WHERE instrument LIKE '%ซ้อม%' OR 
      instrument LIKE '%ฝึก%' OR 
      instrument LIKE '%ปฏิทิน%';
```

## ผลลัพธ์ที่ได้

### ก่อนแก้ไข:
- ปฏิทิน: บันทึกใน `jobs` table
- งานประกาศ: ดึงจาก `jobs` table (รวม calendar entries ด้วย)
- ปัญหา: ข้อมูลปฏิทินแสดงในหน้างานประกาศ

### หลังแก้ไข:
- ปฏิทิน: บันทึกใน `jobs` table พร้อม `is_calendar_entry = true`
- ปฏิทิน: ดึงเฉพาะ `is_calendar_entry = true`
- งานประกาศ: ดึงเฉพาะ `is_calendar_entry = false`
- ผล: ข้อมูลไม่รั่วกันระหว่างหน้า

## การทดสอบ

### 1. รัน Migration:
```sql
-- ใน Supabase SQL Editor
-- รันไฟล์: supabase_migrations/add_is_calendar_entry_column.sql
```

### 2. Clean Data เก่า:
```sql
-- รันไฟล์: clean_calendar_data.sql
```

### 3. ทดสอบการทำงาน:
- เพิ่มกำหนดการในปฏิทิน → ไม่ควรปรากฏในหน้างานประกาศ
- สร้างงานประกาศ → ควรปรากฏในหน้างานประกาศเท่านั้น
- ตรวจสอบว่าข้อมูลถูกแยกกันถูกต้อง

## ประโยชน์
- ใช้ตารางเดียว (jobs) แต่แยกประเภทด้วย flag
- ไม่ต้องสร้างตารางใหม่
- สามารถกรองข้อมูลได้ง่าย
- ยังคงประสิทธิภาพในการ query
