'use client';

import React from "react";
// ตัด useSnack ออกก่อนเพื่อป้องกัน Error ถ้าพี่ไม่ได้ตั้งค่าไว้
import { ContinuousCalendar } from "@/components/ContinuousCalendar";

export default function DemoWrapper({ children }: { children?: React.ReactNode }) {
  // ฟังก์ชันพื้นฐานสำหรับแสดงวันที่เมื่อคลิก (จะแสดงใน Console ของ Browser)
  const defaultOnClick = (day: number, month: number, year: number) => {
    console.log(`Selected: ${day}/${month + 1}/${year}`);
  };

  // ในไฟล์ DemoWrapper.tsx
return (
  <div className="relative flex h-full w-full flex-col overflow-hidden">
    <div className="relative h-full overflow-auto no-scrollbar p-0"> {/* ปรับ p-0 เพื่อลดขอบขาวข้างใน */}
      {children}
    </div>
  </div>
);
}