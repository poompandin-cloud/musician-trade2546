import { useNavigate } from "react-router-dom";
import { Search, MapPin, Music, Info, Users } from "lucide-react";
import MenuCard from "../components/MenuCard"; 

const Index = ({ jobs, onAddJob }: { jobs: any[], onAddJob: (job: any) => void }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Header ส่วนหัวข้อ */}
      <div className="flex flex-col items-center mb-12 text-center">
        <div className="w-40 h-40 mb-4 flex items-center justify-center">
          <img 
            // ใช้ / นำหน้าชื่อไฟล์โดยตรง เพราะ Vite จะไปดูที่โฟลเดอร์ public ให้อัตโนมัติ
            src="/logo.jpg" 
            alt="snowguin logo" 
            className="max-w-full max-h-full object-contain" 
            // ใส่พารามิเตอร์ v เพื่อกัน Cache ของเก่าที่เสีย
            key="snowguin-logo-v1"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              console.error("ยังโหลดรูป /public/logo.jpg ไม่ได้");
              // แผนสำรองสุดท้าย: ถ้ายังไม่ขึ้น ให้แสดงตัวหนังสือแทนเพื่อให้แอปดูไม่เสีย
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-text')) {
                const text = document.createElement('div');
                text.className = 'fallback-text text-2xl font-black text-orange-500 tracking-tighter';
                text.innerText = 'SNOWGUIN';
                parent.appendChild(text);
              }
            }}
          />
        </div>
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