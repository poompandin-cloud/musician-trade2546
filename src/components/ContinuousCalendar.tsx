'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

const daysOfWeek = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const monthNames = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

interface ContinuousCalendarProps {
  onClick?: (_day:number, _month: number, _year: number) => void;
  jobs?: Job[]; // เปลี่ยนเป็น Array of Objects
  isOwner?: boolean; // เพิ่ม prop สำหรับตรวจสอบสิทธิ
  dayMinHeight?: string; // เพิ่ม prop สำหรับความสูงของช่องวันที่
}

interface Job {
  id: string;
  title: string;
  starttime: string; // ✅ เปลี่ยนเป็นตัวเล็กให้ตรงกับ Database
  endtime: string;   // ✅ เปลี่ยนเป็นตัวเล็กให้ตรงกับ Database
  location: string;
  date: string; // format: "DD/MM/YYYY"
}

export const ContinuousCalendar: React.FC<ContinuousCalendarProps> = ({ onClick, jobs, isOwner = true, dayMinHeight = 'min-h-[60px]' }) => {
  const today = new Date();
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [year, setYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const monthOptions = monthNames.map((month, index) => ({ name: month, value: `${index}` }));

  // เพิ่มฟังก์ชันสำหรับควบคุมปฏิทิน
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setYear(year - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setYear(year + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleTodayClick = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    scrollToDay(today.getMonth(), today.getDate());
  };

  const scrollToDay = (monthIndex: number, dayIndex: number) => {
    const targetDayIndex = dayRefs.current.findIndex(
      (ref) => ref && ref.getAttribute('data-month') === `${monthIndex}` && ref.getAttribute('data-day') === `${dayIndex}`,
    );

    const targetElement = dayRefs.current[targetDayIndex];

    if (targetDayIndex !== -1 && targetElement) {
      const container = document.querySelector('.calendar-container');
      const elementRect = targetElement.getBoundingClientRect();
      const is2xl = window.matchMedia('(min-width: 1536px)').matches;
      const offsetFactor = is2xl ? 3 : 2.5;

      if (container) {
        const containerRect = container.getBoundingClientRect();
        const offset = elementRect.top - containerRect.top - (containerRect.height / offsetFactor) + (elementRect.height / 2);

        container.scrollTo({
          top: container.scrollTop + offset,
          behavior: 'smooth',
        });
      } else {
        const offset = window.scrollY + elementRect.top - (window.innerHeight / offsetFactor) + (elementRect.height / 2);
  
        window.scrollTo({
          top: offset,
          behavior: 'smooth',
        });
      }
    }
  };

  const handlePrevYear = () => setYear((prevYear) => prevYear - 1);
  const handleNextYear = () => setYear((prevYear) => prevYear + 1);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const monthIndex = parseInt(event.target.value, 10);
    setSelectedMonth(monthIndex);
    scrollToDay(monthIndex, 1);
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    if (!onClick) { return; }
    if (month < 0) {
      onClick(day, 11, year - 1);
    } else {
      onClick(day, month, year);
    }
  }

  const generateCalendar = useMemo(() => {
    const today = new Date();

    const daysInMonth = (): { month: number; day: number }[] => {
      const daysInMonth = [];
      const startDayOfWeek = new Date(year, selectedMonth, 1).getDay();

      // เพิ่มวันว่างจากเดือนก่อนหน้า
      if (startDayOfWeek > 0) {
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevMonthYear = selectedMonth === 0 ? year - 1 : year;
        const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
        
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
          daysInMonth.push({ month: -1, day: daysInPrevMonth - i });
        }
      }

      // เพิ่มวันในเดือนปัจจุบัน
      const daysInCurrentMonth = new Date(year, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInCurrentMonth; day++) {
        daysInMonth.push({ month: selectedMonth, day });
      }

      // เพิ่มวันว่างจากเดือนถัดไป 1 แถว
      const totalDays = daysInMonth.length;
      const remainingDays = 7 - (totalDays % 7); // แค่ 1 แถว
      for (let day = 1; day <= remainingDays; day++) {
        daysInMonth.push({ month: -1, day });
      }
    
      return daysInMonth;
    };

    const calendarDays = daysInMonth();

    const calendarWeeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      calendarWeeks.push(calendarDays.slice(i, i + 7));
    }

    const calendar = calendarWeeks.map((week, weekIndex) => (
      <div className="flex w-full" key={`week-${weekIndex}`}>
        {week.map(({ month, day }, dayIndex) => {
          const index = weekIndex * 7 + dayIndex;
          const isNewMonth = index === 0 || calendarDays[index - 1].month !== month;
          const isToday = today.getMonth() === month && today.getDate() === day && today.getFullYear() === year;

          return (
            <div
              key={`${month}-${day}`}
              ref={(el) => { dayRefs.current[index] = el; }}
              data-month={month}
              data-day={day}
              onClick={() => handleDayClick(day, month, year)}
              className={`relative z-10 m-[-0.5px] group w-full grow cursor-pointer rounded-xl border font-medium transition-all hover:z-20 hover:border-cyan-400 sm:-m-px sm:rounded-lg sm:border-2 lg:rounded-xl ${dayMinHeight}`}
            >
              <span className={`absolute left-1 top-1 flex size-1 items-center justify-center rounded-full text-xs sm:size-2 sm:text-xs lg:left-1 lg:top-1 lg:size-3 lg:text-xs ${isToday ? 'bg-blue-500 font-semibold text-white ring-2 ring-blue-300 ring-offset-2' : ''} ${month < 0 ? 'text-slate-400' : 'text-slate-800'}`}>
                {day}
              </span>
              {/* 2. สร้างตะกร้าใบนี้ครอบส่วน jobs ไว้เพื่อตัดส่วนเกินเฉพาะแถบสีฟ้า */}
<div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
  {jobs && jobs
    .filter(job => job.date === `${day}/${month + 1}/${year}`)
    .map((job, index) => {
      // คำนวณตำแหน่งและจำกัดไม่ให้ล้นเกินช่อง
      const topPosition = index * 28 + 12;
      const maxTop = 80; // จำกัดความสูงสูงสุด
      const finalTop = Math.min(topPosition, maxTop);
      
      return (
        <div 
          key={job.id}
          className="absolute left-1 right-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-1 py-1 rounded font-medium overflow-hidden"
          style={{ 
            top: `${finalTop}px`,
            height: '26px',
            zIndex: 5
          }}
        >
          <div className="truncate font-semibold text-[9px] leading-tight whitespace-nowrap">{job.title}</div>
          <div className="truncate text-[8px] opacity-90 leading-tight whitespace-nowrap">{job.starttime} - {job.endtime}</div>
        </div>
      );
    })
  }
</div>
              {/* 2. สร้างตะกร้าใบนี้ครอบส่วน jobs ไว้เพื่อตัดส่วนเกินเฉพาะแถบสีฟ้า */}
<div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
  {jobs && jobs
    .filter(job => job.date === `${day}/${month + 1}/${year}`)
    .map((job, index) => {
      // คำนวณตำแหน่งและจำกัดไม่ให้ล้นเกินช่อง
      const topPosition = index * 28 + 12;
      const maxTop = 80; // จำกัดความสูงสูงสุด
      const finalTop = Math.min(topPosition, maxTop);
      
      return (
        <div 
          key={job.id}
          className="absolute left-1 right-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-1 py-1 rounded font-medium overflow-hidden"
          style={{ 
            top: `${finalTop}px`,
            height: '26px',
            zIndex: 5
          }}
        >
          <div className="truncate font-semibold text-[9px] leading-tight whitespace-nowrap">{job.title}</div>
          <div className="truncate text-[8px] opacity-90 leading-tight whitespace-nowrap">{job.starttime} - {job.endtime}</div>
        </div>
      );
    })
  }
</div>
              
              {/* จุดสีแดงสำหรับวันที่มีงาน (ถ้าต้องการเก็บไว้ด้วย) */}
              {jobs && jobs.filter(job => job.date === `${day}/${month + 1}/${year}`).length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
              
              {/* เพิ่ม Event Bar ของคนอื่น */}
              {index === 0 && day === 15 && (
                <div 
                  className="absolute left-1 right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1 py-1 rounded font-medium overflow-hidden"
                  style={{ 
                    top: '40px',
                    height: '26px',
                    zIndex: 5
                  }}
                >
                  <div className="truncate font-semibold text-[9px] leading-tight whitespace-nowrap">งานของคนอื่น</div>
                  <div className="truncate text-[8px] opacity-90 leading-tight whitespace-nowrap">14:00 - 18:00</div>
                </div>
              )}
              
              {/* ลบ Month Watermark ออก */}
              
              <button type="button" className="absolute right-2 top-2 rounded-full opacity-0 transition-all focus:opacity-100 group-hover:opacity-100">
                <svg className="size-8 scale-90 text-blue-500 transition-all hover:scale-100 group-focus:scale-100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4.243a1 1 0 1 0-2 0V11H7.757a1 1 0 1 0 0 2H11v3.243a1 1 0 1 0 2 0V13h3.243a1 1 0 1 0 0-2H13V7.757Z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    ));
    
    return calendar;
  }, [year, selectedMonth, jobs]);

  useEffect(() => {
    // Auto-focus: เมื่อโหลดหน้าเว็บเสร็จให้เลื่อนไปยังวันปัจจุบัน
    scrollToDay(today.getMonth(), today.getDate());
  }, []);

  return (
    <div className="no-scrollbar calendar-container max-h-full overflow-y-scroll rounded-t-2xl bg-white pb-4 text-slate-800 shadow-lg">
      {/* Header ปฏิทินพร้อมปุ่มควบคุม */}
      <div className="sticky -top-px z-50 w-full rounded-t-2xl bg-white px-4 pt-3 sm:px-6 sm:pt-4">
        <div className="mb-2 flex w-full flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <Select name="month" value={`${selectedMonth}`} options={monthOptions} onChange={handleMonthChange} />
          </div>
          <div className="flex w-fit items-center justify-between">
            <button
              onClick={handlePrevMonth}
              type="button"
              className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-100"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="mx-2 text-sm font-medium text-gray-900">
              {monthNames[selectedMonth]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              type="button"
              className="rounded-lg border border-gray-300 bg-white p-1.5 text-gray-600 hover:bg-gray-100"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid w-full grid-cols-7 justify-between text-slate-500">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="w-full border-b border-slate-200 py-1 text-center text-xs font-semibold">
              {day}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full px-3 pt-0.5 sm:px-4 sm:pt-1">
        {generateCalendar}
      </div>
    </div>
  );
};

export interface SelectProps {
  name: string;
  value: string;
  label?: string;
  options: { 'name': string, 'value': string }[];
  onChange: (_event: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export const Select = ({ name, value, label, options = [], onChange, className }: SelectProps) => (
  <div className={`relative ${className}`}>
    {label && (
      <label htmlFor={name} className="mb-2 block font-medium text-slate-800">
        {label}
      </label>
    )}
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="cursor-pointer rounded-lg border border-gray-300 bg-white py-1.5 pl-2 pr-6 text-sm font-medium text-gray-900 hover:bg-gray-100 sm:rounded-xl sm:py-2.5 sm:pl-3 sm:pr-8"
      required
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-1 sm:pr-2">
      <svg className="size-5 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clipRule="evenodd" />
      </svg>
    </span>
  </div>
);
