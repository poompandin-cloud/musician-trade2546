import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Search, ClipboardList, LayoutList, FileText,Users,Info,UserSearch  } from "lucide-react";
import MenuCard from "../components/MenuCard"; 
import HuskyAnimation from '@/components/ui/HuskyAnimation';
import { useEffect, useRef } from 'react';


const Index = ({ jobs, onAddJob }: { jobs: any[], onAddJob: (job: any) => void }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const jobRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // ตรวจสอบและ auto-scroll ไปที่งานที่ต้องการ
  useEffect(() => {
    if (id && jobs.length > 0) {
      const targetJob = jobs.find(job => job.id === id);
      
      if (targetJob) {
        console.log('🎯 Found target job:', targetJob);
        
        // รอให้ DOM render เสร็จก่อน scroll
        setTimeout(() => {
          const jobElement = jobRefs.current[id];
          if (jobElement) {
            console.log('📍 Scrolling to job element:', id);
            jobElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // เพิ่ม highlight effect
            jobElement.classList.add('ring-4', 'ring-orange-400', 'ring-offset-2');
            setTimeout(() => {
              jobElement.classList.remove('ring-4', 'ring-orange-400', 'ring-offset-2');
            }, 3000);
          } else {
            console.log('⚠️ Job element not found for ID:', id);
          }
        }, 100);
      } else {
        console.log('⚠️ Job not found with ID:', id);
        // ถ้าไม่พบงาน อาจจะแสดง toast หรือ redirect ไปหน้าอื่น
      }
    }
  }, [id, jobs]);

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

        {/* แสดงงานที่ตรงกับ ID ถ้ามี */}
        {id && jobs.length > 0 && (
          <div className="mt-8 w-full max-w-4xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
              📍 งานที่คุณค้นหาอยู่ที่นี่
            </h2>
            {jobs
              .filter(job => job.id === id)
              .map(job => (
                <div
                  key={job.id}
                  ref={(el) => { jobRefs.current[job.id] = el; }}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        🎸 {job.title || 'หางานดนตรี'}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>📍 สถานที่: {job.location || job.venue}</p>
                        <p>🗓️ วันที่: {job.date || job.event_date}</p>
                        <p>⏰ เวลา: {job.time || job.event_time}</p>
                        <p>💰 ค่าจ้าง: {job.budget || job.payment}</p>
                        {job.description && (
                          <p className="mt-2">📝 {job.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => navigate("/nearby-gigs")}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        ดูงานทั้งหมด
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
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