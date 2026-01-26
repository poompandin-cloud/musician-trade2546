import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, Users, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingService } from "@/services/bookingService";
import { toast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  description: string;
  venue: string;
  province: string;
  event_date: string;
  event_time: string;
  duration: string;
  payment: number;
  required_musicians: number;
  status: 'open' | 'closed' | 'completed';
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface JobFeedProps {
  currentUserId?: string;
  onJobUpdate?: () => void;
}

export const JobFeed: React.FC<JobFeedProps> = ({ 
  currentUserId, 
  onJobUpdate 
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // ดึงรายการงานที่เปิดรับสมัครเท่านั้น
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          profiles!jobs_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('status', 'open') // เฉพาะงานที่เปิดรับสมัคร
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการงานได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // สมัครงาน
  const handleApplyJob = async (jobId: string) => {
    if (!currentUserId) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "ต้องเข้าสู่ระบบก่อนสมัครงาน",
        variant: "destructive"
      });
      return;
    }

    setApplyingJobId(jobId);
    try {
      const result = await BookingService.applyForJob(jobId, currentUserId);
      
      if (result.success) {
        toast({
          title: "สมัครงานสำเร็จ",
          description: "ได้ส่งใบสมัครไปยังเจ้าของงานแล้ว"
        });
        
        // อัปเดตรายการงาน
        await fetchJobs();
        onJobUpdate?.();
      } else {
        toast({
          title: "ไม่สามารถสมัครงานได้",
          description: result.error || "กรุณาลองใหม่",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสมัครงานได้ กรุณาลองใหม่",
        variant: "destructive"
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  // ตรวจสอบว่าผู้ใช้สมัครงานนี้ไปแล้วหรือไม่
  const hasUserApplied = async (jobId: string): Promise<boolean> => {
    if (!currentUserId) return false;
    
    try {
      const { data } = await supabase
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('musician_id', currentUserId)
        .single();
      
      return !!data;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} วันที่แล้ว`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">ไม่มีงานที่เปิดรับสมัคร</h3>
          <p className="text-muted-foreground">
            ไม่มีประกาศงานที่เปิดรับสมัครในขณะนี้
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">งานที่เปิดรับสมัคร</h2>
        <Badge variant="secondary">{jobs.length} งาน</Badge>
      </div>
      
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{job.profiles?.full_name || 'ไม่ระบุชื่อ'}</span>
                  <span>•</span>
                  <span>{formatTimeAgo(job.created_at)}</span>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                เปิดรับสมัคร
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-muted-foreground line-clamp-2">
              {job.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{job.venue}</p>
                  <p className="text-xs text-muted-foreground">{job.province}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{formatEventDate(job.event_date)}</p>
                  <p className="text-xs text-muted-foreground">{job.event_time}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{job.duration}</p>
                  <p className="text-xs text-muted-foreground">ระยะเวลา</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">
                  ฿{job.payment.toLocaleString()}
                </span>
                <p className="text-xs text-muted-foreground">
                  ต้องการ {job.required_musicians} คน
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={() => handleApplyJob(job.id)}
                disabled={applyingJobId === job.id || !currentUserId}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {applyingJobId === job.id ? 'กำลังสมัคร...' : 'รับงานนี้'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
