import { useState, useMemo } from "react";
import { ArrowLeft, MapPin, Timer, Phone, MessageCircle, Filter, ChevronDown, X, Users, ExternalLink, AlertCircle, Calendar, Clock } from "lucide-react"; 
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NearbyGigsProps {
  jobs: any[];
  onBack: () => void;
  onDeleteJob: (id: string) => Promise<void>;
  currentUserId: string;
}

// 1. ฟังก์ชันคำนวณเวลาแบบละเอียด (นาที + ชั่วโมง)
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  
  const minutes = Math.floor(diffInSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} วันที่แล้ว`;
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours} ชม. ${remainingMinutes} นาทีที่แล้ว` : `${hours} ชม.ที่แล้ว`;
  }
  return `${minutes} นาทีที่แล้ว`;
};

// 2. ฟังก์ชันจัดรูปแบบวันที่งานไทย (เช่น 22 ม.ค. 69)
const formatThaiDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็น พ.ศ.
  return `${day} ${month} ${year}`;
};

// 3. ฟังก์ชันสร้างลิงก์ Line
const createLineLink = (lineId: string) => {
  if (!lineId) return null;
  
  // ถ้าเป็น URL อยู่แล้ว ให้ใช้ค่านั้นเลย
  if (lineId.includes('line.me')) {
    return lineId;
  }
  
  // ถ้าเป็น ID ธรรมดา ให้สร้างลิงก์
  // กรณีมี @ นำหน้า (เช่น @121jhulh)
  if (lineId.startsWith('@')) {
    return `https://line.me/ti/p/${lineId}`;
  }
  
  // กรณีไม่มี @ (เช่น poppypoom)
  return `https://line.me/ti/p/~${lineId}`;
};

const NearbyGigs = ({ onBack, jobs, onDeleteJob, currentUserId }: NearbyGigsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ jobId: string; lineId: string } | null>(null);
  const [showLinePopup, setShowLinePopup] = useState<{ lineId: string } | null>(null);

  const availableProvinces = useMemo(() => {
    const provinces = new Set<string>();
    jobs.forEach((job) => { if (job.province) provinces.add(job.province); });
    return Array.from(provinces).sort();
  }, [jobs]);

 const filteredJobs = useMemo(() => {
    let filtered = jobs.filter(job => !job.job_type || job.job_type !== 'calendar');
    if (currentUserId) {
      filtered = filtered.filter((job) => job.user_id === currentUserId || job.status === 'open');
    } else {
      filtered = filtered.filter((job) => job.status === 'open');
    }
    if (selectedProvince) {
      filtered = filtered.filter((job) => job.province === selectedProvince);
    }
    filtered.sort((a, b) => {
      const isAOwner = a.user_id === currentUserId;
      const isBOwner = b.user_id === currentUserId;
      if (isAOwner && !isBOwner) return -1;
      if (!isAOwner && isBOwner) return 1;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    return filtered;
  }, [jobs, currentUserId, selectedProvince]);

  const handleProvinceSelect = (province: string | null) => {
    setSelectedProvince(province);
    setIsFilterOpen(false);
  };

  const handleClearFilter = () => {
    setSelectedProvince(null);
    setIsFilterOpen(false);
  };

  const handleAcceptJob = async (jobId: string, lineId: string) => {
    setShowLinePopup({ lineId });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </header>

      <main className="container py-8 max-w-lg mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">งานที่ประกาศ</h1>
          
          {availableProvinces.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <button className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-2xl border-2 border-orange-400/30 px-4 py-2.5 backdrop-blur-sm hover:shadow-orange-500/50 transition-all active:scale-[0.98] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold">{selectedProvince || "กรองจังหวัด"}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="space-y-1">
                  <button onClick={() => handleProvinceSelect(null)} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-accent">
                    ทั้งหมด ({jobs.length})
                  </button>
                  {availableProvinces.map((province) => (
                    <button key={province} onClick={() => handleProvinceSelect(province)} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-accent flex justify-between">
                      <span>{province}</span>
                      <span className="text-xs text-muted-foreground">({jobs.filter(j => j.province === province).length})</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">ไม่มีประกาศงานในขณะนี้</p>
            </div>
          ) : (
            filteredJobs.map((gig) => {
              let profile = Array.isArray(gig.profiles) ? gig.profiles[0] : gig.profiles || {};
              const posterName = profile.full_name || "ผู้ใช้";
              const posterAvatar = profile.avatar_url || null;

              return (
                <div key={gig.id} className={`relative p-5 rounded-3xl bg-card border shadow-sm ${
                  gig.user_id === currentUserId ? 'border-orange-200 bg-orange-50/30' : 'border-border'
                }`}>
                  
                  {/* --- มุมขวาบน: ข้อมูลเวลา (เพิ่มใหม่) --- */}
                  <div className="absolute top-5 right-5 text-right pointer-events-none">
                    <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-orange-600 mb-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatThaiDate(gig.date)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(gig.created_at)}</span>
                    </div>
                  </div>

                  {/* Badge & Delete */}
                  <div className="flex justify-start mb-2 gap-2">
                    {gig.user_id === currentUserId && (
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        ประกาศของคุณ
                      </span>
                    )}
                  </div>

{/* 1. ส่วนหัว: ข้อมูลผู้โพสต์ (เรียบง่าย ไม่ทับเวลา) */}
<button onClick={() => navigate(`/profile/${gig.user_id}`)} className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50 hover:opacity-80 transition-opacity w-full text-left">
  <Avatar className="w-10 h-10 border border-orange-100">
    <AvatarImage src={posterAvatar || undefined} />
    <AvatarFallback className="bg-orange-100 text-orange-600">{posterName.charAt(0)}</AvatarFallback>
  </Avatar>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-foreground truncate">{posterName}</p>
    <p className="text-[10px] text-muted-foreground">คลิกดูโปรไฟล์</p>
  </div>
</button>

{/* 2. ส่วนเนื้อหา: จังหวัด และเครื่องดนตรี */}
<div className="mb-4">
  {/* บรรทัดจังหวัด */}
  <div className="flex items-center mb-1">
    <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
      จังหวัด {gig.province || "ไม่ระบุ"}
    </span>
  </div>

  {/* บรรทัดเครื่องดนตรี */}
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-xl font-bold text-orange-500 leading-tight">{gig.instrument}</h3>
  </div>

  {/* บรรทัดสถานที่ */}
  <p className="font-medium text-gray-700 flex items-start gap-1 text-sm break-words mb-4">
    <span className="flex-shrink-0">📍</span> {gig.location}
  </p>

  {/* --- 3. ส่วนตรงกลาง: แสดงเวลาที่เล่น (duration) --- */}
  {gig.duration && (
    <div className="flex items-center gap-2 mb-4 p-3 bg-orange-50 rounded-xl border border-dashed border-orange-100">
      <div className="p-1.5 bg-orange rounded-lg shadow-sm">
        <Clock className="w-4 h-4 text-orange-500" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-orange-600">เวลาที่เล่น</span>
        <span className="text-sm font-semibold text-gray-700">{gig.duration}</span>
      </div>
    </div>
  )}
</div>



{/* 3. ส่วนงบประมาณ: ดีไซน์ใหม่แบบ Card เพื่อความชัดเจน */}
<div className="flex justify-between items-center mb-6 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
  <span className="text-xs font-bold text-orange-600">💰 ค่าจ้าง / งบประมาณ</span>
  <span className="text-2xl font-black text-gray-900 leading-none">{gig.budget}</span>
</div>

{/* --- ส่วนที่เพิ่มใหม่: หมายเหตุเพิ่มเติม --- */}
{gig.additional_notes && gig.additional_notes.trim() !== "" && (
  <div className="mt-3 mb-4 p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r-xl">
    <p className="text-[11px] font-bold text-orange-600 mb-1 flex items-center gap-1">
      📝 หมายเหตุเพิ่มเติม:
    </p>
    <p className="text-xs text-black-700 whitespace-pre-wrap leading-relaxed">
      {gig.additional_notes}
    </p>
  </div>
)}

{/* 4. ปุ่มติดต่อ (Phone/Line) */}
<div className="grid grid-cols-2 gap-3 mb-6">
  <a href={gig.phone ? `tel:${gig.phone}` : "#"} className="flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-700 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
    <Phone className="w-4 h-4" />
    <span className="text-[11px] font-bold truncate">{gig.phone || "ไม่มีเบอร์"}</span>
  </a>
  
  {/* ปุ่มติดต่อ Line - แก้ไขให้สามารถคลิกเปิดแอป Line ได้ */}
  {(() => {
    const lineLink = createLineLink(gig.lineId);
    if (lineLink) {
      return (
        <a 
          href={lineLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-700 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-[11px] font-bold truncate">ทัก Line</span>
        </a>
      );
    } else {
      return (
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-gray-50 text-gray-400 rounded-xl border border-gray-100">
          <MessageCircle className="w-4 h-4" />
          <span className="text-[11px] font-bold truncate">ไม่ระบุ Line</span>
        </div>
      );
    }
  })()}
</div>

{/* 5. ปุ่มรับงาน: แก้ไข Logic เพื่อไม่ให้ปุ่มซ้อนกัน */}
{gig.user_id !== currentUserId && (
  <Button
    onClick={() => gig.status === 'open' ? handleAcceptJob(gig.id, gig.lineId) : null}
    disabled={gig.status === 'closed'}
    className={`w-full font-bold py-6 text-lg rounded-2xl shadow-md ${
      gig.status === 'closed' 
        ? "bg-gray-400 text-white" 
        : "bg-orange-500 hover:bg-orange-600 text-white"
    }`}
  >
    {gig.status === 'closed' ? "ปิดรับสมัครแล้ว" : "รับงานนี้"}
  </Button>
)}


                  {gig.user_id === currentUserId && (
                    <div className="mt-4 pt-4 border-t border-dashed flex justify-center">
                      <button onClick={() => setShowConfirmDialog({ jobId: gig.id, lineId: gig.lineId })} className="text-red-500 text-xs font-bold hover:underline">
                        ลบประกาศงานนี้
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Dialogs คงเดิม */}
      {showLinePopup && (
        <Dialog open={!!showLinePopup} onOpenChange={() => setShowLinePopup(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>ทักไลน์หาเจ้าของงาน</DialogTitle></DialogHeader>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-sm mb-2">LINE ID: <span className="font-bold text-lg">{showLinePopup.lineId}</span></p>
              <Button onClick={() => { window.open(`https://line.me/ti/p/~${showLinePopup.lineId}`, '_blank'); setShowLinePopup(null); }} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <ExternalLink className="w-4 h-4 mr-2" /> เปิดแอป LINE
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showConfirmDialog && (
        <Dialog open={!!showConfirmDialog} onOpenChange={() => setShowConfirmDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>ยืนยันการลบ</DialogTitle></DialogHeader>
            <p className="text-sm text-gray-600">คุณแน่ใจหรือไม่ว่าต้องการลบประกาศงานนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(null)} className="flex-1">ยกเลิก</Button>
              <Button onClick={() => { onDeleteJob(showConfirmDialog.jobId); setShowConfirmDialog(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white">ยืนยันลบ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default NearbyGigs;