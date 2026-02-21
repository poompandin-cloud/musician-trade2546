import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealTimeCredits } from "@/services/realTimeCreditService";
import { Badge } from "@/components/ui/badge";

interface CreditWidgetProps {
  userId: string | null;
}

const CreditWidget = ({ userId }: CreditWidgetProps) => {
  // ✅ ใช้ Real-time Credit Service แทน useCredits เดิม
  const { credits, loading } = useRealTimeCredits(userId);
  const navigate = useNavigate();

  // ไม่แสดง widget ถ้ายังไม่ login
  if (!userId || loading) {
    return null;
  }

  // ตรวจสอบว่าเครดิตต่ำกว่า 5 หรือไม่
  const isLowCredits = credits <= 5;

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 pb-safe">
      <div 
        className={`bg-gradient-to-br text-white rounded-2xl shadow-2xl border-2 px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300 hover:shadow-lg transition-shadow max-w-[220px] cursor-pointer ${
          isLowCredits 
            ? 'from-red-500 to-red-600 border-red-400/30 hover:shadow-red-500/50' 
            : 'from-orange-500 to-orange-600 border-orange-400/30 hover:shadow-orange-500/50'
        }`}
        onClick={() => navigate('/credits')}
      >
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="bg-white/20 p-1.5 sm:p-2 rounded-xl flex-shrink-0">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-xs font-medium text-white/90 leading-tight whitespace-nowrap">
                เครดิตของคุณ
              </span>
              {isLowCredits && (
                <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                  ต่ำ
                </Badge>
              )}
            </div>
            <span className="text-base sm:text-lg font-bold leading-tight whitespace-nowrap">
              {credits}
            </span>
            <span className="text-[9px] text-white/70 leading-tight">
              Real-time
            </span>
          </div>
        </div>
        
        {/* Low credits warning */}
        {isLowCredits && (
          <div className="mt-2 text-xs text-red-100 text-center bg-red-500/20 rounded-lg px-2 py-1">
            ⚠️ เครดิตเหลือน้อย
          </div>
        )}
        
        {/* Decorative glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-white/10 rounded-2xl blur-xl -z-10 ${
          isLowCredits ? 'animate-pulse' : ''
        }`} />
      </div>
    </div>
  );
};

export default CreditWidget;
