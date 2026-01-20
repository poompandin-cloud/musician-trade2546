import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, User, Phone, MessageCircle } from "lucide-react";

interface JobApplicationsProps {
  jobId: string;
  currentUserId: string;
  onApplicationUpdate?: () => void;
}

interface Application {
  id: string;
  applicant_id: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  applied_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

const JobApplications = ({ jobId, currentUserId, onApplicationUpdate }: JobApplicationsProps) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // ดึงรายการผู้สมัคร
  const fetchApplications = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("job_applications")
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
      } else {
        setApplications(data || []);
      }
    } catch (error) {
      console.error("System error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ยืนยันผู้สมัคร
  const handleConfirmApplication = async (applicationId: string, applicantId: string) => {
    setProcessing(applicationId);
    
    try {
      // อัปเดตสถานะการสมัคร
      const { error: appError } = await (supabase as any)
        .from("job_applications")
        .update({ 
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          contact_shared: true 
        })
        .eq("id", applicationId);

      if (appError) {
        console.error("Error confirming application:", appError);
        toast({
          title: "ยืนยันไม่สำเร็จ",
          description: appError.message,
          variant: "destructive"
        });
        return;
      }

      // อัปเดตสถานะงานเป็น closed
      const { error: jobError } = await (supabase as any)
        .from("jobs")
        .update({ 
          status: "closed",
          confirmed_applicant_id: applicantId
        })
        .eq("id", jobId);

      if (jobError) {
        console.error("Error updating job status:", jobError);
        toast({
          title: "อัปเดตสถานะงานไม่สำเร็จ",
          description: jobError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "ยืนยันสำเร็จ!",
        description: "ได้เลือกผู้สมัครและปิดประกาศงานแล้ว"
      });

      // สร้างการแจ้งเตือนให้ผู้สมัคร
      try {
        await (supabase as any)
          .from("notifications")
          .insert({
            user_id: applicantId,
            type: "job_confirmed",
            title: "การสมัครงานได้รับการยืนยัน",
            message: `คุณได้รับการยืนยันให้ทำงาน`,
            data: {
              job_id: jobId
            },
            read: false
          });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // ไม่ต้องแสดง error ต่อ user ถ้า notification ล้มเหลว
      }

      // รีเฟรชข้อมูล
      await fetchApplications();
      if (onApplicationUpdate) {
        onApplicationUpdate();
      }

    } catch (error) {
      console.error("System error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  // ปฏิเสธผู้สมัคร
  const handleRejectApplication = async (applicationId: string) => {
    setProcessing(applicationId);
    
    try {
      const { error } = await (supabase as any)
        .from("job_applications")
        .update({ status: "rejected" })
        .eq("id", applicationId);

      if (error) {
        console.error("Error rejecting application:", error);
        toast({
          title: "ปฏิเสธไม่สำเร็จ",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "ปฏิเสธสำเร็จ"
      });

      await fetchApplications();

    } catch (error) {
      console.error("System error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาลองใหม่",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  if (loading) {
    return <div className="text-center py-4">กำลังโหลด...</div>;
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>ยังไม่มีผู้สมัครงานนี้</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">ผู้สมัคร ({applications.length})</h3>
      
      {applications.map((application) => (
        <Card key={application.id} className="border-l-4 border-l-orange-500">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
                  <AvatarImage src={application.profiles.avatar_url || undefined} />
                  <AvatarFallback className="text-sm sm:text-base">
                    {application.profiles.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">{application.profiles.full_name || "ไม่ระบุชื่อ"}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    สมัครเมื่อ {new Date(application.applied_at).toLocaleDateString("th-TH")}
                  </p>
                  
                  {/* แสดงสถานะ */}
                  <div className="flex items-center gap-1 mt-1">
                    {application.status === 'pending' && (
                      <>
                        <Clock className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600">รอการยืนยัน</span>
                      </>
                    )}
                    {application.status === 'confirmed' && (
                      <>
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">ยืนยันแล้ว</span>
                      </>
                    )}
                    {application.status === 'rejected' && (
                      <>
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-600">ถูกปฏิเสธ</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* ปุ่มดำเนินการ (เฉพาะ pending) */}
              {application.status === 'pending' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => handleConfirmApplication(application.id, application.applicant_id)}
                    disabled={processing === application.id}
                    className="bg-green-500 hover:bg-green-600 flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    {processing === application.id ? "..." : "ยืนยัน"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectApplication(application.id)}
                    disabled={processing === application.id}
                    className="border-red-200 text-red-600 hover:bg-red-50 flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    {processing === application.id ? "..." : "ปฏิเสธ"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default JobApplications;
