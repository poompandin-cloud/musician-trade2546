import { useNavigate } from "react-router-dom";
import { MapPin, Search, ClipboardList, LayoutList, FileText,Users,Info,UserSearch  } from "lucide-react";
import MenuCard from "../components/MenuCard"; 
import HuskyAnimation from '@/components/ui/HuskyAnimation';


const Index = ({ jobs, onAddJob }: { jobs: any[], onAddJob: (job: any) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* 1. Header ส่วนหัวข้อ (ขยับขึ้นมาเป็นอันดับแรก) */}
      <div className="flex flex-col items-center mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900">หาคนเล่นแทน</h1>
        <h2 className="text-3xl font-bold text-orange-500">ดนตรีกลางคืน</h2>
        <p className="text-gray-500 mt-2">แบบด่วน ทันที 🎵</p>
      </div>

      {/* 2. ส่วนของเมนูต่างๆ */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        <MenuCard 
          title="หาคนแทนด่วน"
          description="ค้นหานักดนตรีที่พร้อมรับงานทันที"
          icon={
            <div className="p-2 bg-orange-100 rounded-xl">
              <Search className="w-6 h-6 text-orange-600" strokeWidth={2.5} />
            </div>
          }
          onClick={() => navigate("/search")}
          variant="primary"
        />
        <MenuCard 
          title="งานที่ประกาศ"
          description="ดูงานที่เปิดรับอยู่ตอนนี้"
          icon={
            <div className="p-2 bg-orange-100 rounded-xl shadow-inner">
              <ClipboardList className="w-6 h-6 text-orange-600" strokeWidth={2.5} />
            </div>
          }
          onClick={() => navigate("/nearby-gigs")}
          variant="primary"
        />
        <MenuCard 
          title="ค้นหานักดนตรีใกล้คุณ"
          description="ค้นหาจากชื่อนักดนตรี"
          icon={
            <div className="p-2 bg-orange-100 rounded-xl shadow-inner">
              <UserSearch className="w-6 h-6 text-orange-600" strokeWidth={2.5} />
            </div>
          }
          onClick={() => navigate("/musicians")}
          variant="primary"
        />
        <MenuCard 
          title="ติดต่อเรา"
          description="เกี่ยวกับเว็บไซต์หาคนแทน"
          icon={<Info className="w-6 h-6 text-orange-600" />}
          onClick={() => navigate("/about")}
        />
      </div>

      {/* 3. Husky Animation (ย้ายมาไว้ล่างสุดตรงนี้ครับ) */}
      <div className="mt-12 opacity-90">
        <HuskyAnimation />
      </div>
    </div>
  );
};

export default Index;