import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

const Navbar = ({ userId }: { userId: string | null }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
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

  const handleProfileClick = () => {
    if (userId) {
      navigate("/profile");
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate("/")}
            className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            snowguin
          </button>

          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="โปรไฟล์"
          >
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            ) : (
              <Avatar className="w-10 h-10 border-2 border-orange-500/20 hover:border-orange-500/50 transition-colors">
                <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="bg-orange-100 text-orange-600 font-semibold">
                  {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
