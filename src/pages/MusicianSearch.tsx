import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Trophy, Users, X, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

// รายชื่อจังหวัด
const provinces = [
  "กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "นครปฐม", "สมุทรสาคร", 
  "พระนครศรีอยุธยา", "สระบุรี", "ลพบุรี", "ชลบุรี (พัทยา)", "ระยอง", "จันทบุรี", 
  "เชียงใหม่", "เชียงราย", "พิษณุโลก", "นครสวรรค์", "ขอนแก่น", "นครราชสีมา", 
  "อุดรธานี", "ภูเก็ต", "สุราษฎร์ธานี", "สงขลา (หาดใหญ่)"
];

// รายชื่อเครื่องดนตรี
const instruments = [
  { value: "guitar-acoustic", label: "กีตาร์โปร่ง" },
  { value: "guitar-electric", label: "กีตาร์ไฟฟ้า" },
  { value: "keyboard-piano", label: "เปียโน" },
  { value: "keyboard-synth", label: "คีย์บอร์ด/ซินธิไซเซอร์" },
  { value: "drums-kit", label: "กลองชุด" },
  { value: "strings-violin", label: "ไวโอลิน" },
  { value: "vocal-lead", label: "นักร้องนำ" },
  { value: "vocal-backup", label: "นักร้องประสาน" },
  { value: "ukulele", label: "อูคูเลเล่" },
  { value: "harmonica", label: "หมอนิกา" },
  { value: "drums-electric", label: "กลองไฟฟ้า" },
];

const MusicianSearch = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedInstrument, setSelectedInstrument] = useState("");
  const [allMusicians, setAllMusicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลนักดนตรีทั้งหมดเมื่อ component mount และทุกครั้งที่หน้าจอแสดงผล
  useEffect(() => {
    fetchAllMusicians();
    
    // เพิ่มการ refresh ทุก 30 วินาทีเพื่อให้มั่นใจว่าข้อมูลเป็นปัจจุบัน
    const interval = setInterval(() => {
      fetchAllMusicians();
    }, 30000); // 30 วินาที
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array = ทำงานเฉพาะตอน mount

  const fetchAllMusicians = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลนักดนตรีทั้งหมด รวมจำนวน Like ทั้งหมด (All-time)
      console.log("🔍 Fetching musicians with all-time likes...");
      
      // ใช้ Direct Query แทน RPC function เพื่อความน่าเชื่อถือ
      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, avatar_url, prestige_points, credits, province, instruments")
        .not("full_name", "is", null);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setAllMusicians([]);
        return;
      }

      console.log("👥 Profiles fetched:", profilesData?.length || 0);

      // ดึงจำนวน Like ทั้งหมดสำหรับแต่ละ profile (All-time)
      const { data: likesData, error: likesError } = await (supabase as any)
        .from("profile_likes")
        .select("profile_id");

      if (likesError) {
        console.error("Error fetching likes:", likesError);
      }

      console.log("❤️ All-time likes fetched:", likesData?.length || 0);

      // นับจำนวน Like สำหรับแต่ละ profile
      const likeCounts: { [key: string]: number } = {};
      (likesData || []).forEach(like => {
        const profileId = like.profile_id;
        likeCounts[profileId] = (likeCounts[profileId] || 0) + 1;
      });

      console.log("📊 All-time like counts:", likeCounts);

      // รวมข้อมูล profiles กับจำนวน likes
      const musiciansWithLikes = (profilesData || []).map(profile => ({
        ...profile,
        total_likes: likeCounts[profile.id] || 0
      }));

      console.log("🎵 Musicians with all-time likes:", musiciansWithLikes.map(m => ({ 
        name: m.full_name, 
        likes: m.total_likes 
      })));

      // เรียงลำดับตาม total_likes จากมากไปน้อย (All-time high scores)
      musiciansWithLikes.sort((a, b) => {
        const totalLikesA = a.total_likes || 0;
        const totalLikesB = b.total_likes || 0;
        
        // ถ้ามี total_likes ทั้งคู่ ให้เรียงตาม total_likes
        if (totalLikesA > 0 || totalLikesB > 0) {
          return totalLikesB - totalLikesA;
        }
        
        // Fallback: ใช้ prestige_points หรือ credits
        const tokensA = a.prestige_points || a.credits || 100;
        const tokensB = b.prestige_points || b.credits || 100;
        return tokensB - tokensA;
      });

      console.log("🏆 Final all-time ranking:", musiciansWithLikes.map(m => ({ 
        name: m.full_name, 
        likes: m.total_likes 
      })));

      setAllMusicians(musiciansWithLikes);
      
    } catch (err) {
      console.error("System Error:", err);
      setAllMusicians([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter และเรียงลำดับนักดนตรีตาม search term, province และ instrument
  const filteredMusicians = useMemo(() => {
    let filtered = [...allMusicians];

    // Filter ตาม search term
    if (searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((musician) =>
        musician.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter ตามจังหวัด
    if (selectedProvince) {
      filtered = filtered.filter((musician) =>
        musician.province === selectedProvince
      );
    }

    // Filter ตามเครื่องดนตรี
    if (selectedInstrument) {
      filtered = filtered.filter((musician) => {
        const musicianInstruments = musician.instruments;
        if (!musicianInstruments) return false;
        
        // ถ้าเป็น string ให้แปลงเป็น array
        const instrumentsArray = Array.isArray(musicianInstruments) 
          ? musicianInstruments 
          : musicianInstruments.split(',').map((s: string) => s.trim());
        
        // ตรวจสอบว่ามีเครื่องดนตรีที่เลือกหรือไม่
        return instrumentsArray.includes(selectedInstrument);
      });
    }

    // เรียงลำดับตาม total_likes จากมากไปน้อย (All-time high scores)
    filtered.sort((a, b) => {
      const totalLikesA = a.total_likes || 0;
      const totalLikesB = b.total_likes || 0;
      return totalLikesB - totalLikesA; // Descending (มากไปน้อย)
    });

    return filtered;
  }, [allMusicians, searchTerm, selectedProvince, selectedInstrument]);

  const handleMusicianClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับ</span>
          </button>
        </div>
      </header>

      <main className="container py-6 md:py-8 max-w-2xl mx-auto px-4">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">ค้นหานักดนตรีใกล้คุณ</h1>
          <p className="text-muted-foreground text-sm md:text-base">ค้นหาและดูโปรไฟล์นักดนตรีทั้งหมด</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="ค้นหาชื่อนักดนตรี..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 h-12 md:h-14 rounded-2xl text-base md:text-lg w-full"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Province Filter */}
          <div className="relative">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full h-12 rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
            >
              <option value="">เลือกจังหวัด...</option>
              {provinces.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
          </div>

          {/* Instrument Filter */}
          <div className="relative">
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="w-full h-12 rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
            >
              <option value="">เลือกเครื่องดนตรี...</option>
              {instruments.map((instrument) => (
                <option key={instrument.value} value={instrument.value}>
                  {instrument.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(selectedProvince || selectedInstrument) && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                setSelectedProvince("");
                setSelectedInstrument("");
              }}
              className="flex items-center gap-2 px-4 py-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              <X className="w-4 h-4" />
              ล้างตัวกรอง
            </button>
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground px-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              พบ {filteredMusicians.length} คน
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAllMusicians()}
                className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4 transform rotate-180" />
                รีเฟรช
              </button>
              {searchTerm.trim().length > 0 && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-orange-500 hover:text-orange-600 font-medium"
                >
                  ล้างการค้นหา
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {!loading && filteredMusicians.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-muted rounded-3xl p-8 border border-border max-w-md mx-auto">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">
                {searchTerm.trim().length > 0
                  ? "ไม่พบนักดนตรีที่ค้นหา"
                  : "ยังไม่มีนักดนตรีในระบบ"}
              </p>
            </div>
          </div>
        )}

        {!loading && filteredMusicians.length > 0 && (
          <div className="space-y-3 pb-4">
            {filteredMusicians.map((musician, index) => {
              const totalLikes = musician.total_likes || 0;
              return (
                <Card
                  key={musician.id}
                  className="hover:bg-accent transition-colors cursor-pointer border-border hover:border-orange-200"
                  onClick={() => navigate(`/profile/${musician.id}`)}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-3 md:gap-4">
                      {/* Ranking Badge */}
                      <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-sm md:text-base shadow-lg">
                        {index + 1}
                      </div>
                      
                      {/* Avatar */}
                      <Avatar className="w-12 h-12 md:w-14 md:h-14 border-2 border-orange-200 flex-shrink-0">
                        <AvatarImage src={musician.avatar_url || undefined} alt={musician.full_name} />
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-lg md:text-xl font-semibold">
                          {musician.full_name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate text-base md:text-lg">
                          {musician.full_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-muted-foreground">
                            ได้รับถูกใจทั้งหมด: {totalLikes.toLocaleString()} ครั้ง
                          </span>
                        </div>
                      </div>
                      
                      {/* Arrow */}
                      <ArrowLeft className="w-5 h-5 text-muted-foreground transform rotate-180 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MusicianSearch;
