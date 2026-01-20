import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreditWidgetProps {
  userId: string | null;
}

const CreditWidget = ({ userId }: CreditWidgetProps) => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลเครดิต
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching credits:", error);
        } else if (data) {
          setCredits(data.credits || 0);
        } else {
          // ถ้ายังไม่มีโปรไฟล์ ให้ตั้งค่าเริ่มต้น
          setCredits(25);
        }
      } catch (err) {
        console.error("System Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).credits !== undefined) {
            setCredits((payload.new as any).credits);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // ไม่แสดง widget ถ้ายังไม่ login
  if (!userId || loading) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 pb-safe">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl shadow-2xl border-2 border-orange-400/30 px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300 hover:shadow-orange-500/50 transition-shadow max-w-[200px]">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="bg-white/20 p-1.5 sm:p-2 rounded-xl flex-shrink-0">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-xs font-medium text-orange-50/90 leading-tight whitespace-nowrap">
              เครดิตของคุณ
            </span>
            <span className="text-base sm:text-lg font-bold leading-tight whitespace-nowrap">
              {credits !== null ? credits : 0}
            </span>
          </div>
        </div>
        {/* Decorative glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-transparent rounded-2xl blur-xl -z-10" />
      </div>
    </div>
  );
};

export default CreditWidget;
