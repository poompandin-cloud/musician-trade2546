import { useState, useEffect } from "react";
import { Bell, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Get recent notifications
      const { data: notifData, error: notifError } = await supabase
        .rpc('get_recent_notifications', { 
          p_user_id: userId, 
          p_limit: 20 
        });
      
      if (notifError) {
        console.error("Error fetching notifications:", notifError);
        return;
      }

      setNotifications(notifData || []);

      // Get unread count
      const { data: countData, error: countError } = await supabase
        .rpc('get_unread_notification_count', { 
          p_user_id: userId 
        });
      
      if (countError) {
        console.error("Error fetching unread count:", countError);
        return;
      }

      setUnreadCount(countData || 0);
    } catch (error) {
      console.error("Error in fetchNotifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAsRead = async () => {
    if (!userId || unreadCount === 0) return;

    try {
      const { error } = await supabase.rpc('mark_notifications_read', { 
        p_user_id: userId 
      });

      if (error) {
        console.error("Error marking notifications as read:", error);
        return;
      }

      // Update local state
      setUnreadCount(0);
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error("Error in markAsRead:", error);
    }
  };

  // Mark single notification as read
  const markSingleAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error in markSingleAsRead:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
      
      // Update unread count if it was unread
      const notif = notifications.find(n => n.id === notificationId);
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error in deleteNotification:", error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_application':
        return '👥';
      case 'job_confirmed':
        return '✅';
      case 'review_received':
        return '⭐';
      default:
        return '🔔';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อกี้วี่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    return `${diffDays} วันที่แล้ว`;
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    fetchNotifications();

    // Real-time subscription
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          console.log('New notification:', payload.new);
          setNotifications(prev => [payload.new as Notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-bell-container')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  if (!userId) {
    return null;
  }

  return (
    <div className="notification-bell-container relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        title="การแจ้งเตือน"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <Button
                onClick={markAsRead}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 h-8 px-3"
              >
                <Check className="w-3 h-3 mr-1" />
                อ่านทั้งหมด
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                กำลังโหลด...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notif.is_read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {notif.title}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(notif.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {!notif.is_read && (
                        <button
                          onClick={() => markSingleAsRead(notif.id)}
                          className="text-blue-500 hover:text-blue-600 text-xs"
                          title="ทำเครื่องอ่าน"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-gray-400 hover:text-red-500 text-xs"
                        title="ลบการแจ้งเตือน"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
              <Button
                onClick={() => window.location.href = '/notifications'}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
              >
                ดูการแจ้งเตือนทั้งหมด
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
