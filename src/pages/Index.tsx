import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Search, ClipboardList, LayoutList, FileText,Users,Info,UserSearch, Phone, Music, Plus } from "lucide-react";
import MenuCard from "../components/MenuCard"; 
import HuskyAnimation from '@/components/ui/HuskyAnimation';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";


const Index = ({ jobs, onAddJob }: { jobs: any[], onAddJob: (job: any) => void }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const jobRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [fetchedJob, setFetchedJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user ID for accept button logic
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // ฟังก์ชันตรวจสอบการ login ก่อนหานักดนตรี
  const handleFindMusiciansClick = () => {
    if (!currentUserId) {
      toast({
        title: "กรุณาเข้าสู่ระบบก่อนหานักดนตรี",
        description: "เข้าสู่ระบบเพื่อค้นหานักดนตรีมืออาชีพ",
        variant: "destructive",
        action: (
          <Button onClick={() => navigate("/auth")} className="bg-blue-600 hover:bg-blue-700">
            เข้าสู่ระบบ
          </Button>
        ),
      });
      return;
    }
    // ถ้า login แล้วให้ไปหน้าหานักดนตรีแทน
    navigate("/find-musicians");
  };

  // Helper functions for date/time formatting
  const formatThaiDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'เมื่อสักครู่';
    if (diffHours < 24) return `${diffHours} ชม.`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} วัน`;
  };

  // JobCard component inline
  const JobCard = ({ job, currentUserId }: { job: any; currentUserId?: string }) => {
    const openLineChat = () => {
      const lineId = job.line_id || job.lineid; // เช็คชื่อคอลัมน์ให้ถูก
      if (lineId && lineId !== 'ไม่บอกครับ' && lineId !== '-') {
        window.open('https://line.me/ti/p/~' + lineId, '_blank');
      } else {
        alert('เจ้าของงานไม่ได้ระบุไอดีไลน์ไว้ครับ');
      }
    };

    const handlePhoneCall = (phone?: string) => {
      if (!phone || phone.trim() === '') {
        alert('ไม่มีเบอร์โทรศัพท์ติดต่อ');
        return;
      }
      
      // เปิดแอปโทรศัพท์
      window.open(`tel:${phone}`, '_blank');
    };

    return (
      <Card id={`job-card-${job.id}`} className="hover:shadow-lg transition-shadow">
        <div className={`relative p-5 rounded-3xl bg-card border shadow-sm ${
          job.user_id === currentUserId ? 'border-orange-200 bg-orange-50/30' : 'border-border'
        }`}>
          
          {/* --- มุมขวาบน: ข้อมูลเวลา --- */}
          <div className="absolute top-5 right-5 text-right pointer-events-none">
            <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-orange-600 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatThaiDate(job.date || job.event_date)}</span>
            </div>
            <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(job.created_at)}</span>
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-start mb-2 gap-2">
            {job.user_id === currentUserId && (
              <span className="text-[10px] font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                ประกาศของคุณ
              </span>
            )}
          </div>

          {/* ส่วนหัว: ข้อมูลผู้โพสต์ */}
          <button 
            onClick={() => navigate(`/profile/${job.user_id}`)} 
            className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50 hover:opacity-80 transition-opacity w-full text-left"
          >
            <Avatar className="w-10 h-10 border border-orange-100">
              <AvatarImage src={job.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-orange-100 text-orange-600">
                {job.profiles?.full_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {job.profiles?.full_name || 'ไม่ระบุชื่อ'}
              </p>
              <p className="text-[10px] text-muted-foreground">คลิกดูโปรไฟล์</p>
            </div>
          </button>

          {/* ส่วนเนื้อหา */}
          <div className="mb-4">
            <div className="flex items-center mb-1">
              <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                จังหวัด {job.province || "ไม่ระบุ"}
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {job.title || 'หางานดนตรี'}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>📍 {job.location || job.venue}</p>
              <p>🗓️ {job.date || job.event_date}</p>
              
              {/* เวลาที่เล่น */}
              {job.duration && (
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>เวลาที่เล่น เริ่ม {job.duration}</span>
                </p>
              )}
              
              {/* เวลาเริ่มงาน */}
              {job.event_time && (
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>เวลาเริ่มงาน {job.event_time}</span>
                </p>
              )}
              
              <p>💰 {job.budget || job.payment}</p>
              
              {/* เครื่องดนตรี */}
              {job.instrument && (
                <p className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>เครื่องดนตรี: {job.instrument}</span>
                </p>
              )}
              
              {/* เบอร์โทร */}
              {job.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>เบอร์โทร: {job.phone}</span>
                </p>
              )}
            </div>
            {job.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {job.description}
              </p>
            )}
          </div>

          {/* ปุ่มติดต่อ */}
          {job.user_id !== currentUserId && (
            <div className="flex gap-2 mt-4">
              {/* ปุ่ม LINE */}
              <Button
                onClick={() => {
                  if (!currentUserId) {
                    toast({
                      title: "กรุณาเข้าสู่ระบบก่อนติดต่อ",
                      description: "เข้าสู่ระบบเพื่อติดต่อผู้ประกาศงาน",
                      variant: "destructive",
                      action: (
                        <Button onClick={() => navigate("/auth")} className="bg-blue-600 hover:bg-blue-700">
                          เข้าสู่ระบบ
                        </Button>
                      ),
                    });
                    return;
                  }
                  openLineChat();
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.5 6L12 10.5 8.5 8 11 5.5 12 6.5l1-1L15.5 8zM12 13.5L8.5 16 6 13.5l1-1 1 1 3.5-3.5 1 1 1-1L18 15.5l-2.5 2.5L12 13.5z"/>
                </svg>
                ติดต่อทาง LINE
              </Button>
              
              {/* ปุ่มโทรศัพท์ */}
              {job.phone && (
                <Button
                  onClick={() => {
                    if (!currentUserId) {
                      toast({
                        title: "กรุณาเข้าสู่ระบบก่อนติดต่อ",
                        description: "เข้าสู่ระบบเพื่อติดต่อผู้ประกาศงาน",
                        variant: "destructive",
                        action: (
                          <Button onClick={() => navigate("/auth")} className="bg-blue-600 hover:bg-blue-700">
                            เข้าสู่ระบบ
                          </Button>
                        ),
                      });
                      return;
                    }
                    handlePhoneCall(job.phone);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Fetch งานจาก Supabase ถ้าไม่พบใน jobs array
  useEffect(() => {
    const fetchJobById = async () => {
      if (!id) return;
      
      // 1. เช็คก่อนว่ามีใน jobs แล้วหรือยัง
      const existingJob = jobs.find(job => String(job.id) === String(id));
      if (existingJob) {
        console.log('🎯 มีงานใน jobs แล้ว:', existingJob.title);
        return;
      }
      
      // 2. ถ้าไม่มี ให้ fetch จาก Supabase
      console.log('🔍 ไม่พบงานใน jobs กำลัง fetch จาก Supabase ID:', id);
      setLoading(true);
      
      try {
        const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();
        
        if (error) {
          console.error('❌ Supabase fetch error:', error);
          setFetchedJob(null);
        } else if (data) {
          console.log('✅ Fetch job สำเร็จ:', data.title);
          setFetchedJob(data);
        } else {
          console.warn('⚠️ ไม่พบงานใน Supabase ID:', id);
          setFetchedJob(null);
        }
      } catch (err) {
        console.error('❌ Fetch job error:', err);
        setFetchedJob(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobById();
  }, [id, jobs]);

  // ตรวจสอบและ auto-scroll ไปที่งานที่ต้องการ
  useEffect(() => {
    if (!id) return;
    
    // 1. เช็คข้อมูล jobs ว่าโหลดมาหรือยัง
    if (jobs.length > 0) {
      // 2. เทียบ ID โดยแปลงเป็น String เพื่อป้องกัน Type mismatch
      const targetJob = jobs.find(job => String(job.id) === String(id));
      
      if (targetJob) {
        console.log('🎯 เจอละ! กำลังเลื่อนไปที่งาน:', targetJob.title);
        
        // 3. รอจังหวะ Render นิดนึง
        const scrollTimer = setTimeout(() => {
          const jobElement = jobRefs.current[id];
          if (jobElement) {
            jobElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // เพิ่มลูกเล่น Highlight ให้ User รู้ว่างานไหน
            jobElement.classList.add('ring-4', 'ring-orange-500', 'ring-offset-2', 'transition-all');
            setTimeout(() => {
              jobElement.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-2');
            }, 3000);
          } else {
            console.error('❌ หา Element ในหน้าจอไม่เจอ (ลืมใส่ ref หรือเปล่า?)');
          }
        }, 500); // เพิ่มเป็น 500ms เพื่อความชัวร์
        
        return () => clearTimeout(scrollTimer);
      } else {
        console.warn('⚠️ มี ID ใน URL แต่หาในรายการ jobs ไม่เจอ รอ fetch จาก Supabase');
      }
    }
    
    // 4. ถ้ามี fetchedJob ให้ scroll ไปที่งานนั้น
    if (fetchedJob) {
      const scrollTimer = setTimeout(() => {
        const jobElement = jobRefs.current[id];
        if (jobElement) {
          jobElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // เพิ่มลูกเล่น Highlight
          jobElement.classList.add('ring-4', 'ring-orange-500', 'ring-offset-2', 'transition-all');
          setTimeout(() => {
            jobElement.classList.remove('ring-4', 'ring-orange-500', 'ring-offset-2');
          }, 3000);
        }
      }, 500);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [id, jobs, fetchedJob]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* ถ้ามี ID แสดงเฉพาะงานที่ค้นหา */}
      {id ? (
        <>
          {/* แสดงเฉพาะส่วนงานที่ค้นหา */}
          <div className="w-full max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              📍 งานที่คุณค้นหาอยู่ที่นี่
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-500">กำลังโหลดข้อมูลงาน...</p>
              </div>
            ) : (
              <>
                {jobs.length > 0 && jobs.find(job => String(job.id) === String(id)) ? (
                  jobs
                    .filter(job => String(job.id) === String(id))
                    .map(job => (
                      <div
                        key={job.id}
                        ref={(el) => { jobRefs.current[job.id] = el; }}
                      >
                        <JobCard job={job} currentUserId={currentUserId} />
                      </div>
                    ))
            ) : fetchedJob ? (
                  <div
                    key={fetchedJob.id}
                    ref={(el) => { jobRefs.current[fetchedJob.id] = el; }}
                  >
                    <JobCard job={fetchedJob} currentUserId={currentUserId} />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">ไม่พบงานที่ค้นหา</p>
                    <button
                      onClick={() => navigate("/")}
                      className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
                    >
                      กลับหน้าแรก
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <>
          {/* แสดงหน้าแรกปกติ (Hero Section + Menu) */}
          {/* 1. Header ส่วนหัวข้อ */}
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
              onClick={handleFindMusiciansClick}
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

          {/* 3. Husky Animation */}
          <div className="mt-12 opacity-90">
            <HuskyAnimation />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;