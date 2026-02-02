import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, Calendar, CheckCircle, XCircle, Timer, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface JobApplication {
  id: string;
  job_id: string;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  jobs: {
    id: string;
    instrument: string;
    location: string;
    province: string;
    duration: string;
    budget: string;
    user_id: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

const MyApplicationsPage = ({ currentUserId }: { currentUserId: string | null }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');

  // Fetch applications
  const fetchApplications = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            instrument,
            location,
            province,
            duration,
            budget,
            user_id,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('applicant_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลการสมัครงานได้",
          variant: "destructive"
        });
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error("Error in fetchApplications:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Withdraw application
  const withdrawApplication = async (applicationId: string) => {
    const confirmWithdraw = window.confirm("คุณต้องการถอนการสมัครงานนี้ใช่หรือไม่?");
    if (!confirmWithdraw) return;

    try {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error("Error withdrawing application:", error);
        toast({
          title: "ถอนการสมัครไม่สำเร็จ",
          description: "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      toast({
        title: "ถอนการสมัครสำเร็จ",
        description: "คุณได้ถอนการสมัครงานนี้แล้ว"
      });
    } catch (error) {
      console.error("Error in withdrawApplication:", error);
      toast({
        title: "ถอนการสมัครไม่สำเร็จ",
        description: "เกิดข้อผิดพลาด กรุณาลองใหม่",
        variant: "destructive"
      });
    }
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'รอการยืนยัน', variant: 'secondary' as const, icon: Clock };
      case 'confirmed':
        return { label: 'ได้รับการยืนยัน', variant: 'default' as const, icon: CheckCircle };
      case 'rejected':
        return { label: 'ถูกปฏิเสธ', variant: 'destructive' as const, icon: XCircle };
      default:
        return { label: status, variant: 'secondary' as const, icon: Clock };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'วันนี้';
    if (diffDays === 1) return 'เมื่อวาน';
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} สัปดาห์ที่แล้ว`;
    return `${Math.floor(diffDays / 30)} เดือนที่แล้ว`;
  };

  useEffect(() => {
    fetchApplications();
  }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">กรุณาล็อกอินเพื่อดูการสมัครงานของคุณ</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-xl font-bold">การสมัครงานของฉัน</h1>
            <p className="text-sm text-muted-foreground">ติดตามสถานะการสมัครงานทั้งหมดของคุณ</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg">
          {[
            { key: 'all', label: 'ทั้งหมด', count: applications.length },
            { key: 'pending', label: 'รอการยืนยัน', count: applications.filter(a => a.status === 'pending').length },
            { key: 'confirmed', label: 'ได้รับการยืนยัน', count: applications.filter(a => a.status === 'confirmed').length },
            { key: 'rejected', label: 'ถูกปฏิเสธ', count: applications.filter(a => a.status === 'rejected').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {tab.count}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground mb-4">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'all' 
                    ? 'คุณยังไม่เคยสมัครงาน' 
                    : `ไม่มีการสมัคร${filter === 'pending' ? 'ที่รอการยืนยัน' : filter === 'confirmed' ? 'ที่ได้รับการยืนยัน' : 'ที่ถูกปฏิเสธ'}`
                  }
                </h3>
                <p className="text-sm">
                  {filter === 'all' 
                    ? 'ไปที่หน้า "หาคู่ประกาศงาน" เพื่อหางานที่สนใจ'
                    : 'ลองเปลี่ยนตัวกรองเพื่อดูรายการอื่นๆ'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const statusBadge = getStatusBadge(application.status);
              const job = application.jobs;
              
              return (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-orange-500">{job?.instrument}</h3>
                          <Badge variant={statusBadge.variant} className="flex items-center gap-1">
                            <statusBadge.icon className="w-3 h-3" />
                            {statusBadge.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{job?.location}, {job?.province}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            <span>{job?.duration || '-'}</span>
                          </div>
                          <span className="font-semibold text-foreground break-words text-sm sm:text-base">งบประมาณ: {job?.budget}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-2">
                          สมัครเมื่อ {formatDate(application.created_at)}
                        </p>
                        
                        {application.status === 'pending' && (
                          <Button
                            onClick={() => withdrawApplication(application.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-500 hover:bg-red-50"
                          >
                            ถอนการสมัคร
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={job?.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {job?.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <p className="font-medium text-sm">{job?.profiles?.full_name || 'ไม่ระบุชื่อ'}</p>
                        <p className="text-xs text-muted-foreground">เจ้าของงาน</p>
                      </div>
                      
                      {application.status === 'confirmed' && (
                        <div className="text-right">
                          <p className="text-xs text-green-600 font-medium">
                            สามารถติดต่อได้
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ติดต่อเพื่อนัดหมายละเอียด
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyApplicationsPage;
