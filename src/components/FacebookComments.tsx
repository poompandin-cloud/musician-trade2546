import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  author_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url: string;
  };
}

interface FacebookCommentsProps {
  profileId: string;
}

const FacebookComments = ({ profileId }: FacebookCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // ดึงคอมเมนต์
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/comments-simple?profile_id=${profileId}`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // ส่งคอมเมนต์
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/comments-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: profileId,
          content: newComment.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewComment('');
        await fetchComments();
        
        toast({
          title: "ส่งคอมเมนต์สำเร็จ",
          description: "คอมเมนต์ของคุณถูกส่งแล้ว",
        });
      } else {
        toast({
          title: "ไม่สามารถส่งคอมเมนต์ได้",
          description: data.error || "กรุณาลองใหม่",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งคอมเมนต์ได้",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // จัดรูปแบบเวลาแบบ Facebook
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  useEffect(() => {
    fetchComments();
  }, [profileId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">กำลังโหลดคอมเมนต์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* หัวข้อคอมเมนต์ */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">คอมเมนต์</h3>
        <span className="text-sm text-gray-500">({comments.length})</span>
      </div>

      {/* ฟอร์มส่งคอมเมนต์ */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={null} />
            <AvatarFallback className="bg-blue-100 text-blue-600">
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="เขียนคอมเมนต์..."
              className="w-full min-h-[60px] p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              maxLength={1000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {newComment.length}/1000 ตัวอักษร
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
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

      {/* รายการคอมเมนต์ */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">ยังไม่มีคอมเมนต์</p>
            <p className="text-gray-400 text-sm mt-1">เป็นคนแรกที่คอมเมนต์!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.author?.avatar_url || null} />
                  <AvatarFallback className="bg-gray-100 text-gray-600">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {comment.author?.full_name || 'ผู้ใช้งาน'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>ถูกใจ</span>
                    </button>
                    <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                      ตอบกลับ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FacebookComments;
