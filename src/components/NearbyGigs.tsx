import { useState, useMemo } from "react";
import { ArrowLeft, MapPin, Timer, Phone, MessageCircle, Filter, ChevronDown, X, Users, ExternalLink, AlertCircle } from "lucide-react"; 
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
import BookingButton from "@/components/BookingButton";
import JobApplications from "@/components/JobApplications";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NearbyGigsProps {
  jobs: any[];
  onBack: () => void;
  onDeleteJob: (id: string) => Promise<void>;
  currentUserId: string;
}

const NearbyGigs = ({ onBack, jobs, onDeleteJob, currentUserId }: NearbyGigsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showApplications, setShowApplications] = useState<{ [key: string]: boolean }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ jobId: string; lineId: string } | null>(null);
  const [showLinePopup, setShowLinePopup] = useState<{ lineId: string } | null>(null);

  // Debug: Log received jobs and current user
  console.log("NearbyGigs received jobs:", jobs.length, jobs);
  console.log("Current user ID:", currentUserId);
  
  // Debug: Check if user's own jobs are in the list
  const userJobs = jobs.filter(job => job.user_id === currentUserId);
  console.log("User's own jobs:", userJobs.length, userJobs);

  // ดึงรายการจังหวัดที่มีงานจริง (เรียงตามตัวอักษร)
  const availableProvinces = useMemo(() => {
    const provinces = new Set<string>();
    jobs.forEach((job) => {
      if (job.province) {
        provinces.add(job.province);
      }
    });
    return Array.from(provinces).sort();
  }, [jobs]);

  // Filter jobs: แสดงทุกงานสำหรับเจ้าของ, แสดงเฉพาะงานเปิดสำหรับคนอื่น
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];
    
    // ถ้ามี currentUserId: แสดงทุกงานของตัวเอง + งานเปิดของคนอื่น
    if (currentUserId) {
      filtered = filtered.filter((job) => {
        // แสดงทุกงานของตัวเอง (ไม่ว่าสถานะจะเป็นอะไร)
        if (job.user_id === currentUserId) {
          return true;
        }
        // แสดงเฉพาะงานเปิดของคนอื่น
        return job.status === 'open';
      });
    } else {
      // ถ้าไม่ได้ล็อกอิน: แสดงเฉพาะงานเปิด
      filtered = filtered.filter((job) => job.status === 'open');
    }
    
    // กรองตามจังหวัดที่เลือก
    if (selectedProvince) {
      filtered = filtered.filter((job) => job.province === selectedProvince);
    }
    
    // เรียงลำดับ: งานที่เพิ่งประกาศใหม่ล่าสุด (created_at) แสดงอยู่บนสุดเสมอ
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime(); // ใหม่สุดอยู่บนสุด
    });
    
    return filtered;
  }, [jobs, currentUserId, selectedProvince]);
  
  // Debug: Check filtered jobs
  console.log("Filtered jobs count:", filteredJobs.length);

  const handleProvinceSelect = (province: string | null) => {
    setSelectedProvince(province);
    setIsFilterOpen(false);
  };

  const handleClearFilter = () => {
    setSelectedProvince(null);
    setIsFilterOpen(false);
  };

  const toggleApplications = (jobId: string) => {
    setShowApplications(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const handleApplicationUpdate = () => {
    // Refresh the component to update job statuses
    setRefreshKey(prev => prev + 1);
  };

  // Simplified job management functions
  const handleAcceptJob = async (jobId: string, lineId: string) => {
    // Show popup with LINE link instead of direct application
    setShowLinePopup({ lineId });
  };

  const handleCloseJob = async (jobId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("jobs")
        .update({ status: "closed" })
        .eq("id", jobId);

      if (error) {
        console.error("Error closing job:", error);
        toast({ 
          title: "เกิดข้อผิดพลาด", 
          description: "ไม่สามารถปิดงานได้",
          variant: "destructive" 
        });
        return;
      }

      toast({ 
        title: "ปิดงานสำเร็จ!", 
        description: "งานนี้ถูกปิดแล้ว" 
      });

      // Refresh jobs list
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("System error:", err);
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "กรุณาลองใหม่",
        variant: "destructive" 
      });
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    // Only allow closing jobs, not reopening
    if (currentStatus === 'closed') {
      toast({ 
        title: "ไม่สามารถเปิดงานอีกครั้ง", 
        description: "เมื่องานปิดแล้วแล้วไม่สามารถเปิดใหม่อีกครั้ง",
        variant: "destructive" 
      });
      return;
    }
    
    // Add confirmation popup
    const confirmClose = window.confirm("คุณต้องการปิดรับสมัครงานนี้ใช่หรือไม่?");
    if (!confirmClose) return;
    
    const newStatus = 'closed';
    
    try {
      const { error } = await (supabase as any)
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) {
        console.error("Error closing job:", error);
        toast({ 
          title: "เกิดข้อผิดพลาด", 
          description: "ไม่สามารถปิดงานได้",
          variant: "destructive" 
        });
        return;
      }

      toast({ 
        title: "ปิดงานสำเร็จ!", 
        description: "งานนี้ปิดรับสมัครแล้ว และจะแสดงในหน้าหลัก" 
      });

      // Refresh jobs list to update UI
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("System error:", err);
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "กรุณาลองใหม่",
        variant: "destructive" 
      });
    }
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
          <h1 className="text-xl sm:text-2xl font-bold">งานคืนนี้ใกล้คุณ</h1>
          
          {/* Filter Button */}
          {availableProvinces.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <button className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-2xl border-2 border-orange-400/30 px-4 py-2.5 backdrop-blur-sm hover:shadow-orange-500/50 transition-all active:scale-[0.98] flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    <Filter className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {selectedProvince || "กรองจังหวัด"}
                  </span>
                  {selectedProvince && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearFilter();
                      }}
                      className="ml-1 p-0.5 rounded-full hover:bg-white/20 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                  {/* Decorative glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent rounded-2xl blur-xl -z-10" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="space-y-1">
                  <button
                    onClick={() => handleProvinceSelect(null)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors ${
                      !selectedProvince
                        ? "bg-orange-100 text-orange-700 font-semibold"
                        : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>ทั้งหมด ({jobs.length})</span>
                    </div>
                  </button>
                  {availableProvinces.map((province) => {
                    const count = jobs.filter((j) => j.province === province).length;
                    return (
                      <button
                        key={province}
                        onClick={() => handleProvinceSelect(province)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl transition-colors ${
                          selectedProvince === province
                            ? "bg-orange-100 text-orange-700 font-semibold"
                            : "hover:bg-accent text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{province}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">({count})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-muted rounded-3xl p-8 border border-border">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">
                  {selectedProvince 
                    ? `ยังไม่มีงานในจังหวัด${selectedProvince}` 
                    : "ไม่มีประกาศงานในขณะนี้"}
                </p>
                {selectedProvince && (
                  <button
                    onClick={handleClearFilter}
                    className="mt-4 text-sm text-orange-500 hover:text-orange-600 font-semibold"
                  >
                    ดูงานทั้งหมด
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredJobs.map((gig) => {
              // ดึงข้อมูลโปรไฟล์จาก join query
              // รองรับทั้งกรณีที่ profiles เป็น object หรือ array (ถ้า join หลาย row)
              let profile: { full_name?: string | null; avatar_url?: string | null } = {};
              if (Array.isArray(gig.profiles)) {
                profile = gig.profiles[0] || {};
              } else if (gig.profiles && typeof gig.profiles === 'object') {
                profile = gig.profiles;
              }
              
              const posterName = profile.full_name || "ผู้ใช้";
              const posterAvatar = profile.avatar_url || null;

              return (
                <div key={gig.id} className={`relative p-5 rounded-3xl bg-card border shadow-sm ${
                  gig.user_id === currentUserId 
                    ? 'border-orange-200 bg-orange-50/30' 
                    : 'border-border'
                }`}>
                  
                  {/* Badge for owner's jobs */}
                  {gig.user_id === currentUserId && (
                    <div className="flex justify-end mb-2">
                      <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        ประกาศของคุณ
                      </span>
                    </div>
                  )}

                  {gig.user_id === currentUserId && (
                    <div className="flex justify-end mb-2">
                      <button 
                        onClick={() => onDeleteJob(gig.id)}
                        className="text-red-500 text-[10px] font-bold bg-red-50 px-3 py-1 rounded-full border border-red-100"
                      >
                        ลบประกาศนี้
                      </button>
                    </div>
                  )}

                  {/* ส่วนแสดงโปรไฟล์ผู้ประกาศ - คลิกได้เพื่อดูโปรไฟล์ */}
                  <button
                    onClick={() => navigate(`/profile/${gig.user_id}`)}
                    className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50 hover:opacity-80 transition-opacity w-full text-left"
                  >
                    <Avatar className="w-12 h-12 border-2 border-orange-200">
                      <AvatarImage src={posterAvatar || undefined} alt={posterName} />
                      <AvatarFallback className="bg-orange-100 text-orange-600">
                        {posterName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {posterName}
                      </p>
                      <p className="text-xs text-muted-foreground">ผู้ประกาศงาน - คลิกเพื่อดูโปรไฟล์</p>
                    </div>
                  </button>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-orange-500">{gig.instrument}</h3>
                      <p className="font-medium text-gray-700 flex items-center gap-1 mt-1 break-words">📍 {gig.location}</p>
                    </div>
                    <div className="text-right sm:ml-4">
                      <span className="text-xl font-bold text-gray-900">{gig.budget}</span>
                      <p className="text-[10px] text-muted-foreground uppercase">งบประมาณ</p>
                    </div>
                  </div>

                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-orange-500" />
                    <span className="text-foreground font-semibold">{gig.duration || "-"}</span> 
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-foreground font-semibold">{gig.province}</span> 
                  </div>
                </div>

                {/* ส่วนแสดงช่องทางติดต่อ - ใช้ชื่อตัวแปรให้ตรงกับข้อมูลที่ไหลมาจาก Supabase */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <a 
                    href={gig.phone ? `tel:${gig.phone}` : "#"}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-green-50 text-green-700 rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-[11px] font-bold">โทร: {gig.phone || "ไม่มีเบอร์"}</span>
                  </a>

                  <div className="flex items-center justify-center gap-2 py-2.5 px-3 bg-green-50 text-green-700 rounded-xl border border-green-100">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase">LINE: {gig.lineId || "ไม่มีไอดี"}</span>
                  </div>
                </div>

                {/* Closed Job Warning Overlay */}
                {gig.status === 'closed' && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-90 rounded-2xl flex items-center justify-center z-10">
                    <div className="text-center text-white p-4">
                      <div className="text-2xl font-bold mb-2">⚠️</div>
                      <div className="text-lg font-semibold">งานนี้ปิดรับแล้ว</div>
                    </div>
                  </div>
                )}

                {/* Simplified Booking Button */}
                {gig.user_id !== currentUserId && (
                  <Button
                    onClick={() => gig.status === 'open' ? handleAcceptJob(gig.id, gig.lineId) : null}
                    disabled={gig.status === 'closed'}
                    className={`w-full font-bold py-3 ${
                      gig.status === 'closed' 
                        ? "bg-gray-400 cursor-not-allowed text-white" 
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    {gig.status === 'closed' ? "ปิดรับสมัครแล้ว" : "รับงานนี้"}
                  </Button>
                )}

                {/* Simplified Job Management for Job Owners */}
                {gig.user_id === currentUserId && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold">จัดการงานของคุณ</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowConfirmDialog({ jobId: gig.id, lineId: gig.lineId })}
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          ลบประกาศงาน
                        </Button>
                        {gig.status === 'open' && (
                          <Button
                            onClick={() => handleToggleJobStatus(gig.id, gig.status)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            ปิดรับสมัครงานนี้
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <Dialog open={!!showConfirmDialog} onOpenChange={() => setShowConfirmDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ยืนยันการลบประกาศงาน</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    คุณต้องการลบประกาศงานนี้ใช่หรือไม่?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    การดำเนินการนี้ไม่สามารถยกเลิกได้
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <h4 className="font-semibold text-sm mb-2">รายละเอียด:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">หมายเลขที่:</span> {showConfirmDialog.jobId}</p>
                  <p><span className="font-medium">LINE ID:</span> {showConfirmDialog.lineId || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  if (showConfirmDialog) {
                    onDeleteJob(showConfirmDialog.jobId);
                    setShowConfirmDialog(null);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                ยืนยันลบ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* LINE Popup Dialog */}
      {showLinePopup && (
        <Dialog open={!!showLinePopup} onOpenChange={() => setShowLinePopup(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>สนใจงานนี้?</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    ทักไลน์หาเจ้าของงานได้เลย!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    คลิกปุ่มด้านล่างเพื่อเปิดแอป LINE
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                <h4 className="font-semibold text-sm mb-2">ข้อมูลติดต่อ:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">LINE ID:</span> {showLinePopup.lineId || 'ไม่ระบุ'}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowLinePopup(null)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={() => {
                  if (showLinePopup.lineId) {
                    window.open(`https://line.me/ti/p/~${showLinePopup.lineId}`, '_blank');
                  }
                  setShowLinePopup(null);
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                เปิดแอป LINE
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default NearbyGigs;