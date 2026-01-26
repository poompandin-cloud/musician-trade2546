import { useNavigate } from "react-router-dom";
import { Search, MapPin, Music, Info, Users } from "lucide-react";
import MenuCard from "../components/MenuCard"; 
import HuskyAnimation from '@/components/ui/HuskyAnimation';

const Index = ({ jobs, onAddJob }: { jobs: any[], onAddJob: (job: any) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Husky Animation */}
      <div className="mb-8">
        <HuskyAnimation />
      </div>

      {/* Header ส่วนหัวข้อ */}
      <div className="flex flex-col items-center mb-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900">หาคนเล่นแทน</h1>
        <h2 className="text-3xl font-bold text-orange-500">ดนตรีกลางคืน</h2>
        <p className="text-gray-500 mt-2">แบบด่วน ทันที 🎵</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-md">
        <MenuCard 
          title="หาคนแทนด่วน"
          description="ค้นหานักดนตรีที่พร้อมรับงานทันที"
          icon={<Search className="w-6 h-6 text-orange-500" />}
          onClick={() => navigate("/search")}
          variant="primary"
        />

        <MenuCard 
          title="งานที่ประกาศ"
          description="ดูงานที่เปิดรับอยู่ตอนนี้"
          icon={<MapPin className="w-6 h-6 text-orange-500" />}
          onClick={() => navigate("/nearby-gigs")}
          variant="primary"
          className="scale-105 shadow-xl border-2 border-orange-500" 
        />

        <MenuCard 
          title="ค้นหานักดนตรี"
          description="ค้นหาจากชื่อนักดนตรี"
          icon={<Users className="w-6 h-6 text-orange-500" />}
          onClick={() => navigate("/musicians")}
          variant="primary"
        />

        <MenuCard 
          title="สมัครเป็นนักดนตรี"
          description="เข้าร่วมเครือข่ายและรับงานเพิ่ม"
          icon={<Music className="w-6 h-6 text-gray-600" />}
          onClick={() => navigate("/join")}
        />

        <MenuCard 
          title="เกี่ยวกับ snowguin"
          description="เรียนรู้เพิ่มเติมเกี่ยวกับเรา"
          icon={<Info className="w-6 h-6 text-gray-600" />}
          onClick={() => navigate("/about")}
        />
      </div>
    </div>
  );
};

export default Index;