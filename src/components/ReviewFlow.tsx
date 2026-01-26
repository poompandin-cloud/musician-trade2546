import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Star, CheckCircle, Clock, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  end_time: string;
  status: string;
  selected_musician_id?: string;
  user_id: string;
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface ReviewFlowProps {
  currentUserId: string;
}

interface JobWithProfile extends Job {
  profiles?: Profile;
  applications?: Array<{
    id: string;
    musician_id: string;
    status: string;
    profiles?: Profile;
  }>;
}

export const ReviewFlow: React.FC<ReviewFlowProps> = ({ currentUserId }) => {
  const [jobsNeedingReview, setJobsNeedingReview] = useState<JobWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Record<string, {
    rating: number;
    comment: string;
  }>>({});

  // ดึงรายการงานที่ต้องการรีวิว
  const fetchJobsNeedingReview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles!jobs_user_id_fkey (
            full_name,
            avatar_url
          ),
          applications!inner (
            id,
            musician_id,
            status,
            profiles!job_applications_musician_id_fkey (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('status', 'completed')
        .lt('end_time', new Date().toISOString())
        .or(`user_id.eq.${currentUserId},selected_musician_id.eq.${currentUserId}`)
        .order('end_time', { ascending: false });

      if (error) throw error;
      setJobsNeedingReview(data || []);
    } catch (error) {
      console.error('Error fetching jobs needing review:', error);
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบว่าผู้ใช้สามารถรีวิวงานนี้ได้หรือไม่
  const canReviewJob = (job: JobWithProfile): boolean => {
    // เจ้าของงานสามารถรีวิวนักดนตรีได้
    if (job.user_id === currentUserId && job.selected_musician_id) {
      return true;
    }
    
    // นักดนตรีที่ถูกเลือกสามารถรีวิวเจ้าของงานได้
    if (job.selected_musician_id === currentUserId) {
      return true;
    }
    
    return false;
  };

  // หาคนที่จะรีวิว (reviewee)
  const getReviewee = (job: JobWithProfile): Profile | null => {
    if (job.user_id === currentUserId && job.selected_musician_id) {
      // เจ้าของงานรีวิวนักดนตรี
      const musicianApp = job.applications?.find(app => app.musician_id === job.selected_musician_id);
      return musicianApp?.profiles || null;
    } else if (job.selected_musician_id === currentUserId) {
      // นักดนตรีรีวิวเจ้าของงาน
      return job.profiles || null;
    }
    return null;
  };

  // คำนวณคะแนนที่จะได้/เสีย
  const calculatePointsChange = (rating: number): number => {
    switch (rating) {
      case 5: return +10;
      case 4: return +5;
      case 3: return +1;
      case 2:
      case 1: return -10;
      default: return 0;
    }
  };

  // ส่งรีวิว
  const handleSubmitReview = async (jobId: string, revieweeId: string) => {
    const review = reviewData[jobId];
    if (!review || !review.rating) {
      toast({
        title: "กรุณาให้คะแนน",
        description: "ต้องระบุคะแนนดาวก่อนส่งรีวิว",
        variant: "destructive"
      });
      return;
    }

    setSubmittingReview(jobId);
    try {
      const pointsChange = calculatePointsChange(review.rating);

      // สร้างรีวิว
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          job_id: jobId,
          reviewer_id: currentUserId,
          reviewee_id: revieweeId,
          rating: review.rating,
          comment: review.comment || '',
          points_change: pointsChange
        });

      if (reviewError) throw reviewError;

      // อัปเดตคะแนนของผู้ที่ถูกรีวิว
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          received_tokens: supabase.rpc('increment_tokens', {
            user_id: revieweeId,
            increment: pointsChange
          })
        })
        .eq('id', revieweeId);

      if (profileError) throw profileError;

      // ส่ง notification ให้ผู้ที่ถูกรีวิว
      await supabase
        .from('notifications')
        .insert({
          user_id: revieweeId,
          title: 'ได้รับรีวิวใหม่',
          message: `คุณได้รับรีวิว ${review.rating} ดาว ${pointsChange > 0 ? '+' : ''}${pointsChange} แต้ม`,
          type: pointsChange > 0 ? 'success' : 'warning',
          metadata: {
            type: 'review_received',
            job_id: jobId,
            rating: review.rating,
            points_change: pointsChange
          }
        });

      toast({
        title: "ส่งรีวิวสำเร็จ",
        description: `รีวิว ${review.rating} ดาว ${pointsChange > 0 ? '+' : ''}${pointsChange} แต้ม`
      });

      // ลบรีวิวที่ส่งไปแล้ว
      const newReviewData = { ...reviewData };
      delete newReviewData[jobId];
      setReviewData(newReviewData);

      // รีเฟรชรายการงาน
      await fetchJobsNeedingReview();

    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(null);
    }
  };

  // แสดงคะแนนดาว
  const renderStars = (rating: number, onChange: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  useEffect(() => {
    fetchJobsNeedingReview();
  }, [currentUserId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">กำลังโหลด...</div>
        </CardContent>
      </Card>
    );
  }

  if (jobsNeedingReview.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">ไม่มีรีวิวที่รอดำเนินการ</h3>
          <p className="text-muted-foreground">
            คุณได้ทำรีวิวทั้งหมดแล้ว
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-orange-500" />
        <h2 className="text-2xl font-bold">รีวิวงานที่สำเร็จ</h2>
        <Badge variant="secondary">{jobsNeedingReview.length}</Badge>
      </div>

      {jobsNeedingReview.map((job) => {
        const canReview = canReviewJob(job);
        const reviewee = getReviewee(job);
        const currentReview = reviewData[job.id];

        if (!canReview || !reviewee) return null;

        return (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{job.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      สิ้นสุด: {new Date(job.end_time).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  สำเร็จ
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* ข้อมูลคนที่จะรีวิว */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarImage src={reviewee.avatar_url} />
                  <AvatarFallback>
                    {reviewee.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{reviewee.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {job.user_id === currentUserId ? 'นักดนตรี' : 'เจ้าของงาน'}
                  </p>
                </div>
              </div>

              {/* ฟอร์มรีวิว */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    คะแนนความพึงพอใจ
                  </label>
                  {renderStars(currentReview?.rating || 0, (rating) => {
                    setReviewData(prev => ({
                      ...prev,
                      [job.id]: { ...prev[job.id], rating }
                    }));
                  })}
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentReview?.rating && (
                      <>
                        {currentReview.rating === 5 && '+10 แต้ม (สุดยอด)'}
                        {currentReview.rating === 4 && '+5 แต้ม (ดีมาก)'}
                        {currentReview.rating === 3 && '+1 แต้ม (พอใช้)'}
                        {(currentReview.rating === 2 || currentReview.rating === 1) && '-10 แต้ม (ไม่พอใจ)'}
                      </>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    ความคิดเห็น (ไม่บังคับ)
                  </label>
                  <Textarea
                    placeholder="แชท์ประสบการณ์การทำงานด้วย..."
                    value={currentReview?.comment || ''}
                    onChange={(e) => {
                      setReviewData(prev => ({
                        ...prev,
                        [job.id]: { ...prev[job.id], comment: e.target.value }
                      }));
                    }}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => handleSubmitReview(job.id, reviewee.id)}
                    disabled={!currentReview?.rating || submittingReview === job.id}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    {submittingReview === job.id ? 'กำลังส่ง...' : 'ส่งรีวิว'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
