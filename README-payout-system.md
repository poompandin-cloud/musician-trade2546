# ระบบ 'ออกเงินให้ก่อนแล้วหัก 7%' - Payout System

## 📋 ภาพรวมระบบ

ระบบจัดการการจ่ายเงินสำหรับแพลตฟอร์มนักดนตรี โดยมีฟีเจอร์หลักคือ:
- **ออกเงินให้นักดนตรีก่อน** เมื่องานเสร็จ
- **หักค่าธรรมเนียม 7%** จากร้านที่จ้าง
- **นักดนตรีได้รับ 93%** ของราคาเต็ม
- **มีหลักฐานการทำงาน** พร้อมรูปภาพและ GPS

## 🏗️ โครงสร้างระบบ

### 1. ฐานข้อมูล (Database)

#### **ตาราง `profiles`**
```sql
-- เพิ่มคอลัมน์ role
ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'MUSICIAN';
```

**คอลัมน์ใหม่:**
- `role` (ENUM: MUSICIAN, SHOP, ADMIN) - ประเภทผู้ใช้

#### **ตาราง `gigs`**
```sql
-- เพิ่มคอลัมน์การเงิน
ALTER TABLE gigs 
ADD COLUMN total_amount DECIMAL(10,2),
ADD COLUMN fee_amount DECIMAL(10,2),
ADD COLUMN musician_payout DECIMAL(10,2),
ADD COLUMN payment_status payment_status DEFAULT 'pending';
```

**คอลัมน์ใหม่:**
- `total_amount` - ราคาเต็มของงาน
- `fee_amount` - ค่าธรรมเนียม 7%
- `musician_payout` - ยอดจ่ายให้นักดนตรี 93%
- `payment_status` (ENUM: pending, advanced_by_admin, repaid)

#### **ตาราง `gig_logs` (ใหม่)**
```sql
CREATE TABLE gig_logs (
    id BIGSERIAL PRIMARY KEY,
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    evidence_photo_url TEXT,
    check_in_location TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**คอลัมน์:**
- `gig_id` - อ้างอิงไปยังตาราง gigs
- `evidence_photo_url` - รูปถ่ายหลักฐานเมื่อจบงาน
- `check_in_location` - พิกัด GPS หรือสถานที่เช็คอิน
- `confirmed_at` - เวลาที่ร้านกดยืนยันการจบงาน

### 2. ประเภทข้อมูล (Types)

#### **User Roles**
```typescript
export type UserRole = 'MUSICIAN' | 'SHOP' | 'ADMIN';
```

#### **Payment Status**
```typescript
export type PaymentStatus = 'pending' | 'advanced_by_admin' | 'repaid';
```

#### **Financial Data**
```typescript
export interface GigFinancialData {
  total_amount: number;      // ราคาเต็ม
  fee_amount: number;         // 7% ค่าธรรมเนียม
  musician_payout: number;   // 93% ยอดจ่ายให้นักดนตรี
  payment_status: PaymentStatus;
}
```

### 3. บริการ (Services)

#### **PayoutService**
คลาสสำหรับจัดการการทำงานทั้งหมด:

- **Gig Management**
  - `createGig()` - สร้างงานใหม่พร้อมคำนวณเงิน
  - `updateGigFinancial()` - อัปเดตข้อมูลการเงิน
  - `getGig()` - ดึงข้อมูลงาน
  - `getGigs()` - ดึงรายการงานพร้อมกรอง

- **Payment Management**
  - `updatePaymentStatus()` - อัปเดตสถานะการจ่ายเงิน
  - `getPayoutSummary()` - ดึงข้อมูลสรุปการจ่ายเงิน

- **Gig Log Management**
  - `createGigLog()` - สร้างหลักฐานการทำงาน
  - `getGigLogs()` - ดึงข้อมูลหลักฐาน

- **User Management**
  - `getUserProfile()` - ดึงข้อมูลผู้ใช้
  - `updateUserRole()` - อัปเดตบทบาทผู้ใช้
  - `checkUserPermission()` - ตรวจสอบสิทธิ์

## 🔄 การทำงานของระบบ

### 1. การสร้างงาน (Create Gig)

```typescript
const gigData = {
  title: "งานเล่นดนตรีที่ร้าน A",
  musician_id: "musician-123",
  shop_id: "shop-456",
  date: "2026-04-15",
  total_amount: 1000 // ราคาเต็ม 1,000 บาท
};

const result = await PayoutService.createGig(gigData);
```

**ผลลัพธ์:**
- `total_amount`: 1,000 บาท
- `fee_amount`: 70 บาท (7%)
- `musician_payout`: 930 บาท (93%)
- `payment_status`: "pending"

### 2. การสร้างหลักฐาน (Create Gig Log)

```typescript
const logData = {
  gig_id: "gig-789",
  evidence_photo_url: "https://example.com/evidence.jpg",
  check_in_location: "13.7563,100.5018"
};

const result = await PayoutService.createGigLog(logData);
```

### 3. การอัปเดตสถานะการจ่ายเงิน

```typescript
// แอดมินออกเงินก่อน
await PayoutService.updatePaymentStatus("gig-789", "advanced_by_admin");

// ร้านจ่ายคืน
await PayoutService.updatePaymentStatus("gig-789", "repaid");
```

## 🎯 สถานะการจ่ายเงิน

| สถานะ | ความหมาย | ผู้ดำเนินการ |
|---------|-----------|----------------|
| **pending** | รอจ่าย | แอดมิน |
| **advanced_by_admin** | ออกเงินก่อน | แอดมิน |
| **repaid** | จ่ายคืนแล้ว | ร้าน |

## 📊 การคำนวณเงิน

### สูตรการคำนวณ
```typescript
const fee_amount = total_amount * 0.07;      // 7%
const musician_payout = total_amount * 0.93;  // 93%
```

### ตัวอย่างการคำนวณ
| ราคาเต็ม | ค่าธรรมเนียม (7%) | ยอดจ่ายนักดนตรี (93%) |
|-----------|-------------------|------------------------|
| 1,000 บาท | 70 บาท | 930 บาท |
| 2,000 บาท | 140 บาท | 1,860 บาท |
| 5,000 บาท | 350 บาท | 4,650 บาท |

## 🔐 ความปลอดภัยและสิทธิ์

### 1. Row Level Security (RLS)
- **gig_logs**: เฉพาะผู้ที่เกี่ยวข้องกับงานเท่านั้นที่เห็น/สร้าง logs
- **profiles**: การอัปเดต role ต้องเป็น admin เท่านั้น

### 2. สิทธิ์ผู้ใช้
- **MUSICIAN**: ดูงานของตัวเอง, สร้าง gig logs
- **SHOP**: ดูงานที่จ้าง, อัปเดตสถานะเป็น repaid
- **ADMIN**: จัดการทุกอย่าง, อัปเดตสถานะเป็น advanced_by_admin

## 🎨 UI Components (ที่จะพัฒนา)

### 1. GigFinancialForm
- ฟอร์มสำหรับกรอกราคางาน
- คำนวณค่าธรรมเนียมอัตโนมัติ
- แสดงยอดจ่ายให้นักดนตรี

### 2. PaymentStatusBadge
- แสดงสถานะการจ่ายเงิน
- สีสำหรับแต่ละสถานะ
- ไอคอนสำหรับแต่ละสถานะ

### 3. GigLogForm
- ฟอร์มสำหรับอัปโหลดรูปภาพ
- ดึงพิกัด GPS
- บันทึกเวลายืนยัน

### 4. FinancialSummaryCard
- แสดงสรุปการเงิน
- ยอดรวม, ค่าธรรมเนียม, ยอดจ่าย
- กราฟแสดงสถิติ

## 📱 Dashboard สำหรับแต่ละบทบาท

### 1. Musician Dashboard
- จำนวนงานทั้งหมด
- จำนวนงานที่เสร็จ
- รายได้รวม
- รอจ่ายเงิน
- งานล่าสุด

### 2. Shop Dashboard
- จำนวนงานที่จ้าง
- จำนวนงานที่เสร็จ
- ค่าใช้จ่ายรวม
- รอชำระเงิน
- งานล่าสุด

### 3. Admin Dashboard
- จำนวนงานทั้งหมด
- ค่าธรรมเนียมที่เก็บได้
- รออนุมัติออกเงิน
- รอรับชำระคืน
- งานล่าสุด

## 🔧 การติดตั้งและการตั้งค่า

### 1. รัน SQL Script
```sql
-- ใน Supabase Dashboard → SQL Editor
-- รันไฟล์ update-database-for-payout.sql
```

### 2. ติดตั้ง Dependencies
```bash
# ไม่ต้องติดตั้ง dependencies ใหม่
# ใช้ dependencies ที่มีอยู่แล้ว
```

### 3. ตั้งค่า Environment Variables
```bash
# ไม่ต้องตั้งค่าใหม่
# ใช้ Supabase configuration ที่มีอยู่แล้ว
```

## 🧪 การทดสอบ

### 1. ทดสอบ Database
```sql
-- ตรวจสอบตาราง
SELECT * FROM information_schema.columns 
WHERE table_name IN ('profiles', 'gigs', 'gig_logs');

-- ทดสอบ function
SELECT * FROM calculate_gig_payment(1000.00);
```

### 2. ทดสอบ Service
```typescript
// ทดสอบการสร้างงาน
const testGig = {
  title: "Test Gig",
  musician_id: "test-musician",
  shop_id: "test-shop",
  date: "2026-04-15",
  total_amount: 1000
};

const result = await PayoutService.createGig(testGig);
console.log(result);
```

## 🚀 ขั้นตอนถัดไป

### 1. Implement UI Components
- [ ] GigFinancialForm
- [ ] PaymentStatusBadge
- [ ] GigLogForm
- [ ] FinancialSummaryCard

### 2. Create Pages
- [ ] Payout Management Page
- [ ] Gig Details Page
- [ ] Dashboard Pages (Musician/Shop/Admin)

### 3. Add Real-time Features
- [ ] Real-time payment status updates
- [ ] Notifications for payment changes
- [ ] Live dashboard updates

### 4. Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Production deployment

## 📞 การติดต่อและ Support

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ console logs
2. ตรวจสอบ network requests
3. ตรวจสอบ database connection
4. ติดต่อทีมพัฒนา

---

**🎯 ระบบพร้อมใช้งานสำหรับ 'ออกเงินให้ก่อนแล้วหัก 7%'!**
