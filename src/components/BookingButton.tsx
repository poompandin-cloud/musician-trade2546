import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BookingButtonProps {
  jobId: string;
  jobOwnerId: string;
  currentUserId: string | null;
  onBookingSuccess?: () => void;
}

const BookingButton = ({ jobId, jobOwnerId, currentUserId, onBookingSuccess }: BookingButtonProps) => {
  const { toast } = useToast();
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // ตรวจสอบว่าผู้ใช้ปัจจุบันเคยสมัครงานนี้แล้วหรือไม่
  const checkApplicationStatus = async () => {
    if (!currentUserId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from("job_applications")
        .select("status")
        .eq("job_id", jobId)
        .eq("applicant_id", currentUserId)
        .single();

      if (data) {
        setHasApplied(true);
      }
    } catch (error) {
      // ไม่มีการสมัคร = ปกติ
    }
  };

  // สมัครงาน
  const handleApplyJob = async () => {
    if (!currentUserId) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "ต้องเข้าสู่ระบบก่อนสมัครงาน",
        variant: "destructive"
      });
      return;
    }

    if (currentUserId === jobOwnerId) {
      toast({
        title: "ไม่สามารถสมัครงานของตัวเอง",
        description: "คุณเป็นเจ้าของประกาศนี้",
        variant: "destructive"
      });
      return;
    }

    setIsApplying(true);

    try {
      // สร้างการสมัครงานใหม่
      const { data, error } = await (supabase as any)
        .from("job_applications")
        .insert({
          job_id: jobId,
          applicant_id: currentUserId,
          status: "pending"
        })
        .select()
        .single();

      if (error) {
        console.error("Application error:", error);
        toast({
          title: "สมัครงานไม่สำเร็จ",
          description: error.message || "เกิดข้อผิดพลาดในการสมัครงาน",
          variant: "destructive"
        });
        return;
      }

      // สำเร็จ
      setHasApplied(true);
      toast({
        title: "สมัครงานสำเร็จ!",
        description: "เจ้าของงานจะได้รับการแจ้งเตือน กรุณารอการยืนยัน",
      });

      // สร้างการแจ้งเตือนให้เจ้าของงาน
      try {
        await (supabase as any)
          .from("notifications")
          .insert({
            user_id: jobOwnerId,
            type: "job_application",
            title: "มีผู้สมัครงานใหม่",
            message: `มีผู้สมัครงานของคุณ`,
            data: {
              job_id: jobId,
              applicant_id: currentUserId
            },
            read: false
          });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // ไม่ต้องแสดง error ต่อ user ถ้า notification ล้มเหลว
      }

      if (onBookingSuccess) {
        onBookingSuccess();
      }

    } catch (error) {
      console.error("System error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  // ตรวจสอบสถานะการสมัครเมื่อ component mount
  useEffect(() => {
    checkApplicationStatus();
  }, [jobId, currentUserId]);

  // ถ้ายังไม่ login หรือเป็นเจ้าของงาน ไม่แสดงปุ่ม
  if (!currentUserId || currentUserId === jobOwnerId) {
    return null;
  }

  // ถ้าเคยสมัครแล้ว แสดงสถานะ
  if (hasApplied) {
    return (
      <Button 
        className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-4 sm:py-6 px-4 rounded-2xl shadow-lg cursor-not-allowed text-sm sm:text-base"
        disabled
      >
        <span className="hidden sm:inline">รอการยืนยันจากเจ้าของงาน...</span>
        <span className="sm:hidden">รอการยืนยัน...</span>
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleApplyJob}
      disabled={isApplying}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 sm:py-6 px-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] text-sm sm:text-base"
    >
      {isApplying ? (
        <>
          <span className="hidden sm:inline">กำลังสมัคร...</span>
          <span className="sm:hidden">สมัคร...</span>
        </>
      ) : (
        <>
          <span className="hidden sm:inline">รับงานนี้</span>
          <span className="sm:hidden">รับงาน</span>
        </>
      )}
    </Button>
  );
};

export default BookingButton;
