import React from 'react';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobShareButtonProps {
  job: any;
}

export const JobShareButton: React.FC<JobShareButtonProps> = ({ job }) => {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      // สร้างลิงก์สำหรับงานนี้
      const jobUrl = `${window.location.origin}/job/${job.id}`;
      const shareText = `รับสมัครนักดนตรี: ${job.title}`;
      
      // ตรวจสอบว่าเป็นมือถือและมี Web Share API
      if (navigator.share && /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)) {
        // มือถือ: ใช้ Web Share API
        await navigator.share({
          title: shareText,
          text: `${shareText}\n\n${job.venue} - ${job.province}\n\nดูรายละเอียดเพิ่มเติม:`,
          url: jobUrl,
        });
      } else {
        // คอม: คัดลอกลิงก์ลง Clipboard
        await navigator.clipboard.writeText(jobUrl);
        
        toast({
          title: "คัดลอกลิงก์งานเรียบร้อย!",
          description: "นำไปแปะใน IG/FB Story ได้เลย",
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('Error sharing job:', error);
      
      // ถ้า Web Share API ล้มเหลว ให้คัดลอกลิงก์แทน
      try {
        const jobUrl = `${window.location.origin}/job/${job.id}`;
        await navigator.clipboard.writeText(jobUrl);
        
        toast({
          title: "คัดลอกลิงก์งานเรียบร้อย!",
          description: "นำไปแปะใน IG/FB Story ได้เลย",
          duration: 3000,
        });
      } catch (clipboardError) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถแชร์งานได้ กรุณาลองใหม่",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
      title="แชร์งานนี้"
    >
      <Share2 className="w-4 h-4" />
    </button>
  );
};
