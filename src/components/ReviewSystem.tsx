import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquare, User } from "lucide-react";

interface ReviewSystemProps {
  jobId: string;
  reviewerId: string;
  revieweeId: string;
  reviewType: 'musician_to_owner' | 'owner_to_musician';
  revieweeName: string;
  onComplete?: () => void;
}

const ReviewSystem = ({ 
  jobId, 
  reviewerId, 
  revieweeId, 
  reviewType, 
  revieweeName, 
  onComplete 
}: ReviewSystemProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // คำนวณคะแนนจาก rating
  const calculatePoints = (rating: number): number => {
    switch (rating) {
      case 5: return 10;  // ดีมาก (5 ดาว): +10
      case 4: return 5;   // ดี (4 ดาว): +5
      case 3: return 1;   // ปกติ (3 ดาว): +1
      case 2: return -5;  // พอใช้ (2 ดาว): -5
      case 1: return -10; // แย่มาก (1 ดาว): -10
      default: return 0;
    }
  };

  // ส่งรีวิว
  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "กรุณาให้คะแนน",
        description: "ต้องให้คะแนนอย่างน้อย 1 ดาว",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const pointsChange = calculatePoints(rating);
      
      const { data, error } = await (supabase as any)
        .from("reviews")
        .insert({
          job_id: jobId,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          rating: rating,
          points_change: pointsChange,
          comment: comment.trim() || null,
          review_type: reviewType
        })
        .select()
        .single();

      if (error) {
        console.error("Review error:", error);
        
        // ตรวจสอบว่าเป็นการรีวิวซ้ำหรือไม่
        if (error.message?.includes("duplicate key")) {
          toast({
            title: "รีวิวซ้ำ",
            description: "คุณได้รีวิวผู้ใช้นี้สำหรับงานนี้แล้ว",
            variant: "destructive"
          });
        } else {
          toast({
            title: "รีวิวไม่สำเร็จ",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      // แสดงข้อความตามคะแนน
      let message = "";
      if (pointsChange > 0) {
        message = `รีวิวสำเร็จ! ${revieweeName} ได้รับ +${pointsChange} แต้มบารมี`;
      } else {
        message = `รีวิวสำเร็จ! ${revieweeName} ถูกหัก ${Math.abs(pointsChange)} แต้มบารมี`;
      }

      toast({
        title: "ส่งรีวิวสำเร็จ",
        description: message
      });

      // รีเซ็ตฟอร์ม
      setRating(0);
      setComment("");
      setShowReviewForm(false);

      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      console.error("System error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewTitle = reviewType === 'musician_to_owner' 
    ? `รีวิวเจ้าของงาน: ${revieweeName}`
    : `รีวิวนักดนตรี: ${revieweeName}`;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          {reviewTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showReviewForm ? (
          <Button 
            onClick={() => setShowReviewForm(true)}
            className="w-full"
            variant="outline"
          >
            เริ่มรีวิว
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Rating Stars */}
            <div>
              <label className="block text-sm font-medium mb-2">คะแนนรีวิว</label>
              <div className="flex gap-1 sm:gap-2 justify-center sm:justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-colors"
                  >
                    <Star 
                      className={`w-6 h-6 sm:w-8 sm:h-8 ${
                        star <= rating 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300 hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>แย่มาก</span>
                <span className="hidden sm:inline">ปานกลาง</span>
                <span>ดีมาก</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-2">ความคิดเห็น (ไม่จำเป็น)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="แชร์ประสบการณ์การทำงานด้วยกัน..."
                className="w-full p-3 border border-input rounded-xl resize-none h-24 outline-none focus:ring-2 focus:ring-orange-500"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {comment.length}/500 ตัวอักษร
              </p>
            </div>

            {/* Points Preview */}
            {rating > 0 && (
              <div className="p-3 bg-muted rounded-xl">
                <p className="text-sm text-center">
                  คะแนนที่จะได้รับ: 
                  <span className={`font-bold ml-1 ${
                    calculatePoints(rating) > 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {calculatePoints(rating) > 0 ? "+" : ""}{calculatePoints(rating)} แต้ม
                  </span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleSubmitReview}
                disabled={isSubmitting || rating === 0}
                className="w-full sm:flex-1"
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งรีวิว"}
              </Button>
              <Button
                onClick={() => {
                  setShowReviewForm(false);
                  setRating(0);
                  setComment("");
                }}
                variant="outline"
                disabled={isSubmitting}
                className="w-full sm:flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewSystem;
