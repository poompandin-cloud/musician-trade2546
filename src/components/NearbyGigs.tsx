import { ArrowLeft, MapPin, Timer, Phone, MessageCircle } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface NearbyGigsProps {
  jobs: any[];
  onBack: () => void;
  onDeleteJob: (id: string) => Promise<void>;
  currentUserId: string;
}

const NearbyGigs = ({ onBack, jobs, onDeleteJob, currentUserId }: NearbyGigsProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </header>

      <main className="container py-8 max-w-lg mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-center">งานคืนนี้ใกล้คุณ</h1>
        
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">ไม่มีประกาศงานในขณะนี้</p>
          ) : (
            jobs.map((gig) => {
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
                <div key={gig.id} className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                  
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

                  {/* ส่วนแสดงโปรไฟล์ผู้ประกาศ */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
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
                      <p className="text-xs text-muted-foreground">ผู้ประกาศงาน</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-orange-500">{gig.instrument}</h3>
                      <p className="font-medium text-gray-700 flex items-center gap-1 mt-1">📍 {gig.location}</p>
                    </div>
                    <div className="text-right ml-4">
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
                <div className="grid grid-cols-2 gap-3 mb-6">
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

                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                  รับงานนี้
                </Button>
              </div>
            );
          })
          )}
        </div>
      </main>
    </div>
  );
};

export default NearbyGigs;