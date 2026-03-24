import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Navbar = ({ userId }: { userId: string | null }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // ตรวจสอบว่าผู้ใช้มีรูปโปรไฟล์หรือไม่
  const hasProfilePicture = profile?.avatar_url && profile.avatar_url !== null && profile.avatar_url.trim() !== "";
  const shouldShowProfileCTA = userId && !loading && !hasProfilePicture;

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
      navigate("/auth"); 
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
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
            หาคนแทน
          </button>

          {/* ถ้าล็อกอินแล้วแสดงรูปโปรไฟล์ Dropdown ถ้ายังไม่ล็อกอินแสดงปุ่มเข้าสู่ระบบ */}
          <div className="flex items-center gap-4">
            {/* Call to Action สำหรับกรอกโปรไฟล์ */}
            {shouldShowProfileCTA && (
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-1 text-orange-500 hover:text-orange-600 transition-all duration-300 animate-pulse hover:animate-none group"
              >
                <span className="text-sm font-medium">
                  กรอกโปรไฟล์ของคุณ
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            )}

            {loading ? (
              <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            ) : userId ? (
              /* Logged in - Show Avatar with Dropdown */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="w-10 h-10 border-2 border-orange-500/20">
                      <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                        {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    โปรไฟล์ของฉัน
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Not logged in - Show Login Button */
              <Button
                onClick={() => navigate("/auth")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full shadow-sm transition-all hover:shadow-md"
              >
                เข้าสู่ระบบ
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;