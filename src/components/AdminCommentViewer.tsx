import React, { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CommentWithIP {
  id: string;
  profile_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_ip: string;
  author_full_name: string | null;
  author_avatar_url: string | null;
}

interface AdminCommentViewerProps {
  profileId: string;
}

export const AdminCommentViewer: React.FC<AdminCommentViewerProps> = ({ profileId }) => {
  const [comments, setComments] = useState<CommentWithIP[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showIPs, setShowIPs] = useState(false);
  const { toast } = useToast();

  const fetchCommentsWithIP = async () => {
    try {
      setIsLoading(true);

      // ดึง session ปัจจุบัน
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "ไม่ได้ล็อกอิน",
          description: "กรุณาล็อกอินก่อนใช้งานฟังก์ชัน Admin",
          variant: "destructive",
        });
        return;
      }

      // เรียก API route สำหรับ Admin
      const response = await fetch(`/api/comments?profile_id=${profileId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          toast({
            title: "ไม่มีสิทธิ์",
            description: "คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูล Admin",
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.error || 'Failed to fetch admin data');
      }

      const result = await response.json();
      setComments(result.data || []);

      toast({
        title: "โหลดข้อมูลสำเร็จ",
        description: `ดึงข้อมูลคอมเมนต์พร้อม IP มา ${result.data?.length || 0} รายการ`,
        duration: 2000,
      });

    } catch (error) {
      console.error('Error fetching admin comments:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูล Admin ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'เมื่อกี้วินาที';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffInMinutes / 1440)} วันที่แล้ว`;
  };

  const getIPStatus = (ip: string) => {
    if (ip === 'unknown') return { color: 'bg-gray-500', text: 'Unknown' };
    
    // ตรวจสอบว่าเป็น IP ภายในหรือภายนอก
    const privateIPRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./,
      /^::1$/,
      /^localhost$/i
    ];
    
    const isPrivate = privateIPRanges.some(range => range.test(ip));
    
    if (isPrivate) {
      return { color: 'bg-blue-500', text: 'Internal' };
    } else {
      return { color: 'bg-green-500', text: 'External' };
    }
  };

  return (
    <Card className="mt-4 border-red-200">
      <CardHeader className="bg-red-50">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Shield className="w-5 h-5" />
          Admin Comment Viewer
          <Badge variant="outline" className="text-red-600 border-red-300">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            ดูคอมเมนต์พร้อม IP Address สำหรับการตรวจสอบความปลอดภัย
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIPs(!showIPs)}
              className="flex items-center gap-1"
            >
              {showIPs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showIPs ? 'ซ่อน IP' : 'แสดง IP'}
            </Button>
            <Button
              onClick={fetchCommentsWithIP}
              disabled={isLoading}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                'โหลดข้อมูล Admin'
              )}
            </Button>
          </div>
        </div>

        {comments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>ข้อมูลนี้เป็นความลับ กรุณาใช้ด้วยความระมัดระวัง (PDPA)</span>
            </div>
            
            {comments.map((comment) => {
              const ipStatus = getIPStatus(comment.author_ip);
              
              return (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.author_full_name || 'Unknown User'}
                      </span>
                      <Badge variant="outline" className={`${ipStatus.color} text-white text-xs`}>
                        {ipStatus.text}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  
                  {showIPs && (
                    <div className="bg-red-50 rounded p-2 border border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-red-700">IP Address:</span>
                        <code className="text-xs bg-red-100 px-2 py-1 rounded text-red-800">
                          {comment.author_ip}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {comments.length === 0 && !isLoading && (
          <div className="text-center py-4 text-gray-500">
            <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">ยังไม่มีข้อมูลคอมเมนต์</p>
            <p className="text-xs">กด "โหลดข้อมูล Admin" เพื่อดูข้อมูลพร้อม IP</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
