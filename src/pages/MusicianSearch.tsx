import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Trophy, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const MusicianSearch = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [allMusicians, setAllMusicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลนักดนตรีทั้งหมดเมื่อ component mount
  useEffect(() => {
    fetchAllMusicians();
  }, []);

  const fetchAllMusicians = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลนักดนตรีทั้งหมด เรียงตาม prestige_points (แต้มความมืออาชีพ) จากมากไปน้อย
      // ถ้ายังไม่มี prestige_points ให้ใช้ credits แทน หรือใช้ 100 (ค่าเริ่มต้น)
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, avatar_url, prestige_points, credits")
        .not("full_name", "is", null)
        .order("prestige_points", { ascending: false, nullsFirst: false })
        .order("credits", { ascending: false, nullsFirst: false });

      if (error) {
        console.error("Error fetching musicians:", error);
      } else {
        setAllMusicians(data || []);
      }
    } catch (err) {
      console.error("System Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter และเรียงลำดับนักดนตรีตาม search term
  const filteredMusicians = useMemo(() => {
    let filtered = [...allMusicians];

    // Filter ตาม search term
    if (searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((musician) =>
        musician.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // เรียงลำดับตาม prestige_points (หรือ credits) จากมากไปน้อย
    filtered.sort((a, b) => {
      const tokensA = a.prestige_points || a.credits || 100;
      const tokensB = b.prestige_points || b.credits || 100;
      return tokensB - tokensA; // Descending (มากไปน้อย)
    });

    return filtered;
  }, [allMusicians, searchTerm]);

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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">ค้นหานักดนตรี</h1>
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
            autoFocus
          />
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground px-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              พบ {filteredMusicians.length} คน
            </span>
            {searchTerm.trim().length > 0 && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                ล้างการค้นหา
              </button>
            )}
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
              const tokens = musician.prestige_points || musician.credits || 100;
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
                          <Trophy className="w-3 h-3 md:w-4 md:h-4 text-orange-500 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-muted-foreground">
                            แต้มความมืออาชีพ: {tokens.toLocaleString()}
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
