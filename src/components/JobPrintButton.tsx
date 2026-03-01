import React from 'react';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobPrintButtonProps {
  job: any;
}

export const JobPrintButton: React.FC<JobPrintButtonProps> = ({ job }) => {
  const { toast } = useToast();

  const handlePrint = () => {
    try {
      // สร้าง CSS สำหรับการปริ้นเฉพาะการ์ดที่เลือก
      const printCSS = `
        @media print {
          * { visibility: hidden; }
          #job-card-${job.id} { 
            visibility: visible; 
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            box-shadow: none;
            border: none;
            margin: 0;
            padding: 20px;
            page-break-inside: avoid;
          }
          #job-card-${job.id} * { 
            visibility: visible; 
            color: black !important;
            background: white !important;
          }
          #job-card-${job.id} .no-print { 
            display: none !important; 
          }
        }
      `;
      
      // สร้าง style element และเพิ่มเข้าไปในหน้า
      const styleElement = document.createElement('style');
      styleElement.textContent = printCSS;
      document.head.appendChild(styleElement);
      
      // เรียกใช้คำสั่งปริ้น
      window.print();
      
      // ลบ style element หลังจากปริ้นเสร็จ
      setTimeout(() => {
        document.head.removeChild(styleElement);
      }, 1000);
      
      toast({
        title: "เปิดหน้าต่างปริ้นแล้ว",
        description: "เลือกเครื่องปริ้นและตั้งค่าตามต้องการ",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error printing:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเปิดหน้าต่างปริ้นได้ กรุณาลองใหม่",
        variant: "destructive",
      });
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl"
      title="ปริ้นโพสต์นี้"
    >
      <Printer className="w-4 h-4" />
    </button>
  );
};
