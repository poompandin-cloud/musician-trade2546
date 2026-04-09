# Prompt สำหรับ Windsurf - ระบบ 'ออกเงินให้ก่อนแล้วหัก 7%'

## 🎯 วัตถุประสงค์
สร้างระบบจัดการการจ่ายเงินสำหรับแพลตฟอร์มนักดนตรี ที่มีฟีเจอร์หลักคือ "ออกเงินให้ก่อนแล้วหัก 7%"

## 📋 สิ่งที่ต้องการให้ Windsurf ทำ:

### 1. Database Updates
```sql
-- รัน SQL script นี้ใน Supabase Dashboard
-- ไฟล์: update-database-for-payout.sql
```

### 2. สร้าง UI Components
- **GigFinancialForm** - ฟอร์มกรอกราคางาน
- **PaymentStatusBadge** - Badge แสดงสถานะการจ่ายเงิน
- **GigLogForm** - ฟอร์มสร้างหลักฐานการทำงาน
- **FinancialSummaryCard** - การ์ดสรุปการเงิน

### 3. สร้าง Pages
- **PayoutManagementPage** - หน้าจัดการการจ่ายเงิน
- **GigDetailsPage** - หน้ารายละเอียดงาน
- **DashboardPages** - หน้า Dashboard สำหรับแต่ละบทบาท

### 4. Implement Business Logic
- การคำนวณค่าธรรมเนียม 7%
- การจัดการสถานะการจ่ายเงิน
- การสร้างและจัดการ gig logs
- การตรวจสอบสิทธิ์ผู้ใช้

## 🏗️ โครงสร้างที่ต้องการ:

### 1. Database Schema
```sql
-- ตาราง profiles: เพิ่มคอลัมน์ role (ENUM: MUSICIAN, SHOP, ADMIN)
-- ตาราง gigs: เพิ่มคอลัมน์การเงิน (total_amount, fee_amount, musician_payout, payment_status)
-- ตาราง gig_logs: สร้างใหม่สำหรับเก็บหลักฐาน
```

### 2. TypeScript Types
```typescript
// ไฟล์: types/payout-system.ts
// มี types ครบถ้วนสำหรับระบบ
```

### 3. Service Layer
```typescript
// ไฟล์: services/payoutService.ts
// มี methods สำหรับจัดการทุกอย่าง
```

## 🔄 การทำงานของระบบ:

### 1. การสร้างงาน
- ร้านกรอกราคางาน (total_amount)
- ระบบคำนวณอัตโนมัติ:
  - fee_amount = total_amount * 0.07 (7%)
  - musician_payout = total_amount * 0.93 (93%)
- payment_status = "pending"

### 2. การจบงาน
- นักดนตรีอัปโหลดรูปภาพหลักฐาน
- บันทึกพิกัด GPS หรือสถานที่
- ร้านกดยืนยันการจบงาน

### 3. การจ่ายเงิน
- **แอดมิน**: อัปเดตสถานะเป็น "advanced_by_admin"
- **ร้าน**: อัปเดตสถานะเป็น "repaid" เมื่อจ่ายคืน

## 🎨 UI Requirements:

### 1. ฟอร์มกรอกราคางาน
```
[ ราคางาน: 1,000 บาท ]
[ ค่าธรรมเนียม: 70 บาท (7%) ]
[ ยอดจ่ายนักดนตรี: 930 บาท (93%) ]
[ บันทึก ]
```

### 2. Badge สถานะการจ่ายเงิน
```
[ รอจ่าย ] - สีเทา
[ ออกเงินก่อน ] - สีเขียว
[ จ่ายคืนแล้ว ] - สีน้ำเงิน
```

### 3. ฟอร์มหลักฐานการทำงาน
```
[ อัปโหลดรูปภาพหลักฐาน ]
[ พิกัด GPS: 13.7563,100.5018 ]
[ บันทึกหลักฐาน ]
```

## 🔐 ความปลอดภัย:

### 1. สิทธิ์ผู้ใช้
- **MUSICIAN**: ดูงานของตัวเอง, สร้าง gig logs
- **SHOP**: ดูงานที่จ้าง, อัปเดตสถานะเป็น repaid
- **ADMIN**: จัดการทุกอย่าง, อัปเดตสถานะเป็น advanced_by_admin

### 2. RLS Policies
- gig_logs: เฉพาะผู้ที่เกี่ยวข้องกับงานเท่านั้น
- profiles: admin เท่านั้นที่อัปเดต role

## 📊 Dashboard สำหรับแต่ละบทบาท:

### 1. Musician Dashboard
- จำนวนงานทั้งหมด
- จำนวนงานที่เสร็จ
- รายได้รวม
- รอจ่ายเงิน

### 2. Shop Dashboard
- จำนวนงานที่จ้าง
- จำนวนงานที่เสร็จ
- ค่าใช้จ่ายรวม
- รอชำระเงิน

### 3. Admin Dashboard
- จำนวนงานทั้งหมด
- ค่าธรรมเนียมที่เก็บได้
- รออนุมัติออกเงิน
- รอรับชำระคืน

## 🚀 ขั้นตอนการพัฒนา:

### Phase 1: Database & Types
1. รัน SQL script ใน Supabase
2. ตรวจสอบ types ใน payout-system.ts
3. ตรวจสอบ service ใน payoutService.ts

### Phase 2: Core Components
1. สร้าง GigFinancialForm
2. สร้าง PaymentStatusBadge
3. สร้าง GigLogForm
4. สร้าง FinancialSummaryCard

### Phase 3: Pages & Integration
1. สร้าง PayoutManagementPage
2. สร้าง GigDetailsPage
3. สร้าง Dashboard Pages
4. ต่อกับ existing navigation

### Phase 4: Testing & Polish
1. Unit tests
2. Integration tests
3. UI/UX improvements
4. Performance optimization

## 📁 ไฟล์ที่เกี่ยวข้อง:

### สร้างแล้ว:
- `update-database-for-payout.sql` - SQL script
- `types/payout-system.ts` - TypeScript types
- `services/payoutService.ts` - Service layer
- `README-payout-system.md` - Documentation

### ต้องสร้าง:
- `components/GigFinancialForm.tsx`
- `components/PaymentStatusBadge.tsx`
- `components/GigLogForm.tsx`
- `components/FinancialSummaryCard.tsx`
- `pages/PayoutManagementPage.tsx`
- `pages/GigDetailsPage.tsx`
- `pages/DashboardPages.tsx`

## 🎯 Success Criteria:

1. ✅ Database schema พร้อมใช้งาน
2. ✅ UI components ทำงานได้
3. ✅ การคำนวณเงินถูกต้อง (7%/93%)
4. ✅ สิทธิ์ผู้ใช้ทำงานได้
5. ✅ Dashboard แสดงข้อมูลถูกต้อง
6. ✅ มีหลักฐานการทำงาน
7. ✅ Real-time updates ทำงานได้

---

**🚀 ให้ Windsurf เริ่มพัฒนาระบบ 'ออกเงินให้ก่อนแล้วหัก 7%' ตามข้อกำหนดข้างบน!**
