import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseVisitorTrackingProps {
  profileId: string;
  userId?: string | null;
}

export const useVisitorTracking = ({ profileId, userId }: UseVisitorTrackingProps) => {
  const startTimeRef = useRef<number>(Date.now());
  const logIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ตรวจสอบว่ามี profileId และไม่ใช่ loading state
    if (!profileId || profileId === 'undefined' || profileId === '') {
      return;
    }

    // สร้าง session ID สำหรับผู้เข้าชมที่ไม่ได้ล็อกอิน
    const sessionId = userId ? null : `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // ฟังก์ชันสำหรับ log การเข้าชม (background)
    const logVisit = async () => {
      try {
        // ตรวจสอบว่า window มีอยู่ (SSR protection)
        if (typeof window === 'undefined') return;

        const response = await fetch('/api/visitor-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-landing-page': window.location?.href || '',
          },
          body: JSON.stringify({
            profile_id: profileId,
            visitor_id: userId || null,
            session_id: sessionId,
          }),
        });

        // ตรวจสอบว่า response ถูกต้อง
        if (!response.ok) {
          console.debug('Visitor tracking API error:', response.status);
          return;
        }

        const result = await response.json();
        if (result?.success && result?.log_id) {
          logIdRef.current = result.log_id;
        }
      } catch (error) {
        // Silent error - ไม่ต้องแสดง error ใน console เพื่อไม่ให้รบกวน UX
        console.debug('Visitor tracking failed:', error);
      }
    };

    // ฟังก์ชันสำหรับอัปเดตข้อมูลการเข้าชมเมื่อออกจากหน้า
    const updateVisitOnUnload = async () => {
      if (!logIdRef.current) return;

      const visitDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const isBounce = visitDuration < 10; // ถ้าอยู่น้อยกว่า 10 วินาที ถือว่าเป็น bounce

      try {
        // ตรวจสอบว่า window และ navigator มีอยู่ (SSR protection)
        if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

        // ใช้ sendBeacon สำหรับการส่งข้อมูลเมื่อ page unload
        const data = {
          log_id: logIdRef.current,
          visit_duration_seconds: visitDuration,
          is_bounce: isBounce,
        };

        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });

        if (navigator?.sendBeacon) {
          navigator.sendBeacon('/api/visitor-logs', blob);
        } else {
          // Fallback สำหรับ browser ที่ไม่รองรับ sendBeacon
          await fetch('/api/visitor-logs', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
        }
      } catch (error) {
        // Silent error
        console.debug('Visit update failed:', error);
      }
    };

    // เริ่ม tracking ทันทีที่ component mount (แต่ต้องแน่ใจว่าไม่ใช่ SSR)
    if (typeof window !== 'undefined') {
      logVisit();
    }

    // ตั้งค่า event listeners สำหรับ page unload
    const handlePageUnload = () => {
      updateVisitOnUnload();
    };

    const handleVisibilityChange = () => {
      if (document?.visibilityState === 'hidden') {
        updateVisitOnUnload();
      }
    };

    // Event listeners สำหรับตรวจจับการออกจากหน้า (SSR protection)
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      window.addEventListener('beforeunload', handlePageUnload);
      window.addEventListener('pagehide', handlePageUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup
    return () => {
      // ลบ event listeners (SSR protection)
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        window.removeEventListener('beforeunload', handlePageUnload);
        window.removeEventListener('pagehide', handlePageUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      
      // อัปเดตข้อมูลเมื่อ component unmount
      updateVisitOnUnload();
    };
  }, [profileId, userId]);

  // Hook ไม่ต้อง return อะไร เพราะทำงานเบื้องหลัง
};
