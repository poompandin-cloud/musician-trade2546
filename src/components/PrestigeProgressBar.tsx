import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Crown, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PrestigeProgressBarProps {
  currentPoints: number;
  maxPoints?: number;
  className?: string;
}

interface Milestone {
  score: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const PrestigeProgressBar: React.FC<PrestigeProgressBarProps> = ({
  currentPoints,
  maxPoints = 1000,
  className = ""
}) => {
  // Fixed milestones ตามที่กำหนด
  const milestones: Milestone[] = [
    {
      score: 100,
      label: "เริ่มต้น",
      icon: <Star className="w-3 h-3" />,
      color: "text-gray-500"
    },
    {
      score: 300,
      label: "กลางๆ",
      icon: <Trophy className="w-3 h-3" />,
      color: "text-blue-500"
    },
    {
      score: 600,
      label: "ยอดเยี่ยม",
      icon: <Crown className="w-3 h-3" />,
      color: "text-purple-500"
    },
    {
      score: 900,
      label: "คุณภาพ",
      icon: <Gem className="w-3 h-3" />,
      color: "text-orange-500"
    },
    {
      score: 1000,
      label: "เต็มหลอด",
      icon: <Trophy className="w-3 h-3" />,
      color: "text-yellow-500"
    }
  ];

  // คำนวณ % ของ progress (smooth progress ไม่ snap ตาม milestone)
  const progressPercentage = Math.min((currentPoints / maxPoints) * 100, 100);

  // หา milestone ปัจจุบันและถัดไป
  const currentMilestoneIndex = milestones.findIndex(m => currentPoints < m.score) - 1;
  const currentMilestone = currentMilestoneIndex >= 0 ? milestones[currentMilestoneIndex] : milestones[0];
  const nextMilestone = currentMilestoneIndex < milestones.length - 1 ? milestones[currentMilestoneIndex + 1] : null;

  // คำนวณระยะห่างระหว่าง milestones (UI ที่เท่ากัน)
  const getMilestonePosition = (score: number) => {
    return (score / maxPoints) * 100;
  };

  // กำหนดสีของ progress bar ตาม % ที่ได้
  const getProgressColor = () => {
    if (progressPercentage >= 90) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (progressPercentage >= 60) return "bg-gradient-to-r from-purple-400 to-purple-600";
    if (progressPercentage >= 30) return "bg-gradient-to-r from-blue-400 to-blue-600";
    return "bg-gradient-to-r from-gray-400 to-gray-600";
  };

  // คำนวณจำนวนแต้มที่เหลือถึง milestone ถัดไป
  const pointsToNextMilestone = nextMilestone 
    ? Math.max(0, nextMilestone.score - currentPoints)
    : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold">หลอดพลังบารมี</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-orange-600">
            {currentPoints.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">/ {maxPoints.toLocaleString()}</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative">
        {/* Main Progress Bar */}
        <div className="relative">
          <Progress 
            value={progressPercentage} 
            className="h-6"
            // Custom styling for gradient effect
          />
          <div 
            className={`absolute top-0 left-0 h-6 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Milestone Markers */}
        <div className="absolute top-0 left-0 w-full h-6 flex items-center">
          {milestones.map((milestone, index) => {
            const position = getMilestonePosition(milestone.score);
            const isReached = currentPoints >= milestone.score;
            const isCurrent = currentMilestone.score === milestone.score;
            
            return (
              <div
                key={milestone.score}
                className="absolute flex flex-col items-center"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                {/* Milestone Dot */}
                <div
                  className={`w-4 h-4 rounded-full border-2 border-background transition-all duration-300 ${
                    isReached 
                      ? 'bg-orange-500 shadow-lg shadow-orange-500/50' 
                      : 'bg-muted-foreground/30'
                  } ${isCurrent ? 'ring-2 ring-orange-300 ring-offset-2' : ''}`}
                />
                
                {/* Milestone Icon and Label */}
                <div className="flex flex-col items-center mt-2">
                  <div className={`${isReached ? milestone.color : 'text-muted-foreground/50'}`}>
                    {milestone.icon}
                  </div>
                  <span className={`text-xs mt-1 whitespace-nowrap ${
                    isReached ? 'font-medium text-foreground' : 'text-muted-foreground/50'
                  }`}>
                    {milestone.label}
                  </span>
                  <span className={`text-xs ${
                    isReached ? 'text-orange-600 font-bold' : 'text-muted-foreground/50'
                  }`}>
                    {milestone.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Information */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Badge 
            variant={currentPoints >= maxPoints ? "default" : "secondary"}
            className={currentPoints >= maxPoints ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            {currentPoints >= maxPoints ? "เต็มหลอด" : currentMilestone.label}
          </Badge>
          
          {pointsToNextMilestone > 0 && nextMilestone && (
            <span className="text-muted-foreground">
              อีก {pointsToNextMilestone.toLocaleString()} แต้มถึง "{nextMilestone.label}"
            </span>
          )}
        </div>
        
        <div className="text-muted-foreground">
          {progressPercentage.toFixed(1)}% เสร็จ
        </div>
      </div>

      {/* Achievement Message */}
      {currentPoints >= maxPoints && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <h4 className="font-bold text-yellow-800">สุดยอดนักดนตรี!</h4>
              <p className="text-sm text-yellow-700">
                คุณมีบารมีสูงสุดแล้ว เป็นที่ยอมรับในวงการดนตรี
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook สำหรับใช้ใน Profile Page
export const usePrestigeProgress = (userId: string) => {
  const [currentPoints, setCurrentPoints] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const fetchUserPoints = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('received_tokens')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCurrentPoints(data?.received_tokens || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUserPoints();
  }, [userId]);

  return {
    currentPoints,
    loading,
    refetch: fetchUserPoints
  };
};
