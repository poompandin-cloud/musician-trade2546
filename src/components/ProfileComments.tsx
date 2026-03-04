import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Comment {
  id: string;
  author_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ProfileCommentsProps {
  profileId: string;
  isOwner: boolean;
  currentUserId?: string | null;
}

export const ProfileComments: React.FC<ProfileCommentsProps> = ({ 
  profileId, 
  isOwner, 
  currentUserId 
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const COMMENTS_PER_PAGE = 10;

  // ดึงข้อมูลคอมเมนต์
  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      
      const from = (pageNum - 1) * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;
      
      console.debug('Fetching comments for profile:', profileId);
      console.debug('Query range:', from, 'to', to);
      
      const { data, error } = await supabase
        .from('profile_comments')
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            avatar_url
          )
        `)
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .range(from, to);

      console.debug('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error fetching comments:', error);
        throw error;
      }

      if (append) {
        setComments(prev => [...prev, ...(data || [])]);
      } else {
        setComments(data || []);
      }

      // ตรวจสอบว่ามีข้อมูลเพิ่มเติมหรือไม่
      setHasMore((data?.length || 0) === COMMENTS_PER_PAGE);

    } catch (error) {
      console.error('Error fetching comments:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถโหลดคอมเมนต์ได้: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // โหลดคอมเมนต์ครั้งแรก
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchComments(1, false);
  }, [profileId]);

  // โหลดเพิ่มเติมเมื่อ scroll ถึงด้านล่าง
  const loadMoreComments = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage, true);
    }
  };

  // ส่งคอมเมนต์ใหม่ (ผ่าน API Route)
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId) {
      toast({
        title: "กรุณากรอกข้อความ",
        description: "กรุณากรอกคอมเมนต์ก่อนส่ง",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // ตรวจสอบ session ก่อนส่ง
      const { data: session } = await supabase.auth.getSession();
      console.debug('Session data:', session);
      console.debug('Current user ID:', currentUserId);
      console.debug('Profile ID target:', profileId);
      console.debug('Profile ID type:', typeof profileId);
      console.debug('User ID type:', typeof currentUserId);

      // ตรวจสอบว่าเป็น UUID ที่ถูกต้อง
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(profileId)) {
        console.error('Invalid profileId format in frontend:', profileId);
        toast({
          title: "ข้อผิดพลาด",
          description: "รูปแบบข้อมูลโปรไฟล์ไม่ถูกต้อง",
          variant: "destructive",
        });
        return;
      }

      if (!uuidRegex.test(currentUserId)) {
        console.error('Invalid currentUserId format in frontend:', currentUserId);
        toast({
          title: "ข้อผิดพลาด",
          description: "รูปแบบข้อมูลผู้ใช้ไม่ถูกต้อง",
          variant: "destructive",
        });
        return;
      }

      // ส่งไปยัง API route ที่จัดการ IP Address
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.session?.access_token}`,
        },
        body: JSON.stringify({
          profile_id: profileId,
          content: newComment.trim(),
        }),
      });

      const result = await response.json();
      console.debug('API response:', { status: response.status, result });

      if (!response.ok) {
        console.error('API Error Response:', { 
          status: response.status, 
          statusText: response.statusText,
          result 
        });
        
        if (result.code === 'RATE_LIMIT_EXCEEDED') {
          toast({
            title: "ส่งคอมเมนต์ได้เร็วเกินไป",
            description: "คุณสามารถส่งคอมเมนต์ได้สูงสุด 3 รายการใน 1 นาที",
            variant: "destructive",
          });
          return;
        }
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // เพิ่มคอมเมนต์ใหม่ลงใน list
      setComments(prev => [result.comment, ...prev]);
      setNewComment('');

      toast({
        title: "ส่งคอมเมนต์สำเร็จ",
        description: "คอมเมนต์ของคุณได้ถูกเผยแพร่แล้ว",
        duration: 2000,
      });

    } catch (error) {
      console.error('Error submitting comment:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถส่งคอมเมนต์ได้: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ลบคอมเมนต์
  const handleDeleteComment = async (commentId: string, authorId: string) => {
    // ตรวจสอบสิทธิ์: เจ้าของโปรไฟล์ หรือ เจ้าของคอมเมนต์
    if (!isOwner && currentUserId !== authorId) {
      toast({
        title: "ไม่มีสิทธิ์ลบ",
        description: "คุณไม่สามารถลบคอมเมนต์นี้ได้",
        variant: "destructive",
      });
      return;
    }

    const confirmDelete = window.confirm("คุณต้องการลบคอมเมนต์นี้ใช่หรือไม่?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('profile_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // ลบคอมเมนต์ออกจาก list
      setComments(prev => prev.filter(comment => comment.id !== commentId));

      toast({
        title: "ลบคอมเมนต์สำเร็จ",
        description: "คอมเมนต์ได้ถูกลบแล้ว",
        duration: 2000,
      });

    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบคอมเมนต์ได้ กรุณาลองใหม่",
        variant: "destructive",
      });
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

  return (
    <div className="space-y-4">
      {/* ส่วนเพิ่มคอมเมนต์ใหม่ */}
      {currentUserId && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={null} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="เขียนคอมเมนต์..."
                className="min-h-[80px] resize-none border-gray-200 focus:border-orange-500"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/500 ตัวอักษร
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      ส่งคอมเมนต์
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* รายการคอมเมนต์ */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.author?.avatar_url || null} />
                <AvatarFallback>
                  {comment.author?.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">
                      {comment.author?.full_name || 'ผู้ใช้งาน'}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  
                  {/* ปุ่มลบคอมเมนต์ */}
                  {(isOwner || currentUserId === comment.author_id) && (
                    <Button
                      onClick={() => handleDeleteComment(comment.id, comment.author_id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* ปุ่มโหลดเพิ่มเติม */}
        {hasMore && (
          <div className="text-center">
            <Button
              onClick={loadMoreComments}
              variant="outline"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-transparent" />
              ) : (
                'โหลดคอมเมนต์เพิ่มเติม'
              )}
            </Button>
          </div>
        )}

        {/* ไม่มีคอมเมนต์ */}
        {!isLoading && comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>ยังไม่มีคอมเมนต์</p>
            <p className="text-sm">เป็นคนแรกที่คอมเมนต์!</p>
          </div>
        )}
      </div>
    </div>
  );
};
