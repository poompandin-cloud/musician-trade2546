import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: () => Promise<void>;
  markSingleAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export const useNotifications = (userId: string | null): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Get recent notifications
      const { data: notifData, error: notifError } = await supabase
        .rpc('get_recent_notifications', { 
          p_user_id: userId, 
          p_limit: 50 
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
    if (!userId) return;

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
    if (!userId) return;

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

  // Refresh notifications
  const refreshNotifications = async () => {
    await fetchNotifications();
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

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markSingleAsRead,
    deleteNotification,
    refreshNotifications
  };
};
