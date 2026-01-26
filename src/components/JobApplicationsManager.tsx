import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { BookingService, JobApplication } from "@/services/bookingService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface JobApplicationsManagerProps {
  jobId: string;
  jobOwnerId: string;
  onApplicationUpdate?: () => void;
}

interface ApplicationWithProfile extends JobApplication {
  profiles: {
    full_name: string;
    avatar_url?: string;
    instruments?: string;
    received_tokens?: number;
  };
}

export const JobApplicationsManager: React.FC<JobApplicationsManagerProps> = ({
  jobId,
  jobOwnerId,
  onApplicationUpdate
}) => {
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ดึงรายการผู้สมัคร
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await BookingService.getJobApplications(jobId);
      setApplications(data as ApplicationWithProfile[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ยืนยันการเลือกนักดนตรี
  const handleConfirmMusician = async (applicationId: string, musicianId: string) => {
    setProcessingId(applicationId);
    try {
      // 1. อัปเดตสถานะ application เป็น accepted
      const { error: appError } = await supabase
        .from('job_applications')
        .update({
          status: 'accepted',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // 2. อัปเดต job เพื่อเลือก musician และปิดงาน
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          selected_musician_id: musicianId,
          status: 'closed'
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // 3. ปฏิเสธ applications อื่นๆ
      const { error: rejectError } = await supabase
        .from('job_applications')
        .update({
          status: 'rejected'
        })
        .eq('job_id', jobId)
        .neq('id', applicationId);

      if (rejectError) throw rejectError;

      // 4. ส่ง notification ให้นักดนตรีที่ถูกเลือก
      const selectedApplication = applications.find(app => app.id === applicationId);
      if (selectedApplication) {
        await BookingService.createNotification({
          user_id: musicianId,
          title: 'ยืนยันการรับงาน',
          message: 'คุณได้รับการเลือกสำหรับงานนี้ กรุณาติดต่อเจ้าของงาน',
          type: 'success',
          metadata: {
            job_id: jobId,
            application_id: applicationId
          }
        });
      }

      // 5. ส่ง notification ให้นักดนตรีที่ไม่ถูกเลือก
      const rejectedApplications = applications.filter(app => app.id !== applicationId);
      for (const app of rejectedApplications) {
        await BookingService.createNotification({
          user_id: app.musician_id,
          title: 'ผลการสมัครงาน',
          message: 'เสียใจด้วย คุณไม่ได้รับการเลือกสำหรับงานนี้',
          type: 'info',
          metadata: {
            job_id: jobId,
            application_id: app.id
          }
        });
      }

      toast({
        title: "ยืนยันสำเร็จ",
        description: "ได้เลือกนักดนตรีและปิดงานแล้ว"
      });

      // อัปเดตข้อมูลใหม่
      await fetchApplications();
      onApplicationUpdate?.();

    } catch (error) {
      console.error('Error confirming musician:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถยืนยันการเลือกนักดนตรีได้",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // ปฏิเสธนักดนตรี
  const handleRejectMusician = async (applicationId: string) => {
    setProcessingId(applicationId);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          status: 'rejected'
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "ปฏิเสธสำเร็จ",
        description: "ได้ปฏิเสธนักดนตรีคนนี้แล้ว"
      });

      await fetchApplications();

    } catch (error) {
      console.error('Error rejecting musician:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถปฏิเสธนักดนตรีได้",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive"
    } as const;

    const labels = {
      pending: "รอการยืนยัน",
      accepted: "ได้รับการเลือก",
      rejected: "ไม่ได้รับการเลือก"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">กำลังโหลด...</div>
        </CardContent>
      </Card>
    );
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            ยังไม่มีผู้สมัครงานนี้
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          ผู้สมัครงาน ({applications.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.map((application) => (
          <div
            key={application.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={application.profiles.avatar_url} />
                <AvatarFallback>
                  {application.profiles.full_name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{application.profiles.full_name}</h3>
                  {getStatusBadge(application.status)}
                </div>
                
                {application.profiles.instruments && (
                  <p className="text-sm text-muted-foreground">
                    เครื่องดนตรี: {application.profiles.instruments}
                  </p>
                )}
                
                {application.profiles.received_tokens !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">คะแนน:</span>
                    <span className={`text-xs font-medium ${
                      application.profiles.received_tokens >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {application.profiles.received_tokens > 0 ? '+' : ''}{application.profiles.received_tokens}
                    </span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  สมัครเมื่อ: {new Date(application.applied_at).toLocaleDateString('th-TH')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusIcon(application.status)}
              
              {application.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleConfirmMusician(application.id, application.musician_id)}
                    disabled={processingId === application.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === application.id ? 'กำลังดำเนินการ...' : 'เลือก'}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectMusician(application.id)}
                    disabled={processingId === application.id}
                  >
                    {processingId === application.id ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
