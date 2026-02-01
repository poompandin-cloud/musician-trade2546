import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Navbar = ({ userId }: { userId: string | null }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", userId)
          .single();

        if (!error && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleProfileClick = () => {
    if (userId) {
      navigate("/profile");
    } else {
      // ✅ ถ้ายังไม่ล็อกอิน ให้ไปหน้า Auth ที่เราเพิ่งสร้าง
      navigate("/auth"); 
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            snowguin
          </button>

          {/* ถ้าล็อกอินแล้วแสดงรูปโปรไฟล์ ถ้ายังไม่ล็อกอินแสดงปุ่มเข้าสู่ระบบ */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            ) : userId ? (
              <Avatar className="w-10 h-10 border-2 border-orange-500/20">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                  {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-sm font-medium text-orange-500 border border-orange-500 px-4 py-1.5 rounded-full hover:bg-orange-50">
                เข้าสู่ระบบ
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;