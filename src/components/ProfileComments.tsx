import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const COMMENTS_PER_PAGE = 10;

  // ฟังก์ชันไปหน้า login
  const handleLogin = () => {
    window.location.href = '/login';
  };

  // ฟังก์ชันไปหน้าโปรไฟล์ของคนคอมเมนต์
  const handleAuthorClick = (authorId: string) => {
    navigate(`/profile/${authorId}`);
  };

  // ดึงข้อมูลคอมเมนต์ (join กับตาราง profiles)
  const fetchComments = async (pageNum = 1, append = false) => {
    try {
      setIsLoading(true);
      
      const from = (pageNum - 1) * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;
      
      console.debug('Fetching comments for profile:', profileId);
      console.debug('Query range:', from, 'to', to);
      
      // ดึงข้อมูลคอมเมนต์พร้อมข้อมูลผู้เขียนจากตาราง profiles
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

      // จัดการข้อมูลที่ได้มา (ดึงข้อมูลจริงจากตาราง profiles)
      const commentsWithAuthors = (data || []).map(comment => ({
        ...comment,
        author: comment.author || null // ใช้ null แทน fallback จะจัดการใน UI
      }));

      if (append) {
        setComments(prev => [...prev, ...commentsWithAuthors]);
      } else {
        setComments(commentsWithAuthors);
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

  // ส่งคอมเมนต์ใหม่ (ตรงไปยัง Supabase)
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast({
        title: "กรุณากรอกข้อความ",
        description: "กรุณากรอกคอมเมนต์ก่อนส่ง",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // ตรวจสอบ session และดึง user ID จาก auth.getUser()
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error:', authError);
        toast({
          title: "กรุณาเข้าสู่ระบบ",
          description: "กรุณาล็อกอินก่อนคอมเมนต์",
          variant: "destructive",
        });
        return;
      }

      console.debug('Authenticated user:', {
        id: user.id,
        email: user.email,
        profileId,
        content: newComment.trim()
      });

      // ตรวจสอบว่า currentUserId ตรงกับ user.id จริงๆ
      if (currentUserId !== user.id) {
        console.error('User ID mismatch:', { currentUserId, authUserId: user.id });
        toast({
          title: "ข้อผิดพลาดการยืนยันตัวตน",
          description: "กรุณารีเฟรชหน้าและล็อกอินใหม่",
          variant: "destructive",
        });
        return;
      }

      // ส่งคอมเมนต์ตรงไปยัง Supabase (join กับตาราง profiles)
      const { data: commentData, error } = await supabase
        .from('profile_comments')
        .insert({
          profile_id: profileId,
          author_id: user.id, // ใช้ ID จาก auth.getUser() แทน currentUserId
          content: newComment.trim(),
        })
        .select(`
          *,
          author:profiles!author_id (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error inserting comment:', error);
        throw error;
      }

      console.debug('Comment inserted successfully:', commentData);

      // เพิ่มคอมเมนต์ใหม่ทันที (พร้อมข้อมูล author จริง)
      const newCommentWithAuthor = {
        ...commentData,
        author: commentData.author || null // ใช้ข้อมูลจริงจากตาราง profiles
      };

      setComments(prev => [newCommentWithAuthor, ...prev]);
      setNewComment('');

      toast({
        title: "ส่งคอมเมนต์สำเร็จ",
        description: "คอมเมนต์ของคุณได้ถูกเผยแพร่แล้ว",
        duration: 2000,
      });

    } catch (error) {
      console.error('Error submitting comment:', error);
      
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
      {currentUserId ? (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={null} />
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="เขียนคอมเมนต์..."
                className="min-h-[60px] resize-none border-gray-200 focus:border-blue-500 rounded-xl p-3 w-full text-sm"
                disabled={isSubmitting}
                maxLength={1000}
                style={{ resize: 'none' }}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/1000
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-1" />
                      ส่ง
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 mb-4">เข้าสู่ระบบเพื่อคอมเมนต์</p>
          <Button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-600 text-white">
            <LogIn className="w-4 h-4 mr-2" />
            เข้าสู่ระบบเพื่อคอมเมนต์
          </Button>
        </div>
      )}

      {/* รายการคอมเมนต์ - สไตล์ Facebook พร้อม Navigation */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            {/* Avatar คลิกได้ - ไปหน้าโปรไฟล์ */}
            <button
              onClick={() => handleAuthorClick(comment.author_id)}
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              title={`ไปหน้าโปรไฟล์ของ ${comment.author?.full_name || 'ผู้ใช้งานทั่วไป'}`}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={comment.author?.avatar_url || null} />
                <AvatarFallback className="bg-gray-200 text-gray-600">
                  {comment.author?.full_name?.charAt(0) || comment.author_id?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </button>
            
            <div className="flex-1">
              <div className="bg-gray-100 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-1">
                  {/* ชื่อคลิกได้ - ไปหน้าโปรไฟล์ */}
                  <button
                    onClick={() => handleAuthorClick(comment.author_id)}
                    className="font-medium text-gray-900 text-sm hover:underline cursor-pointer"
                    title={`ไปหน้าโปรไฟล์ของ ${comment.author?.full_name || 'ผู้ใช้งานทั่วไป'}`}
                  >
                    {comment.author?.full_name || 'ผู้ใช้งานทั่วไป'}
                  </button>
                  <span className="text-gray-500 text-xs ml-2">
                    {formatTimeAgo(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
              
              {/* ปุ่มลบคอมเมนต์ */}
              {(isOwner || currentUserId === comment.author_id) && (
                <Button
                  onClick={() => handleDeleteComment(comment.id, comment.author_id)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-red-500 hover:bg-red-50 mt-1 text-xs"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  ลบ
                </Button>
              )}
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
