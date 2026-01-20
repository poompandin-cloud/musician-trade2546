-- ========================================
-- Notifications Table for Real-time Alerts
-- ========================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'job_application', 'job_confirmed', 'review_received'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID, -- job_id or application_id or review_id
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can only read their own notifications
CREATE POLICY "Users can read their own notifications" ON notifications
    FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Policy 2: Users can insert notifications for others (system notifications)
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Policy 4: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- Trigger Functions for Automatic Notifications
-- ========================================

-- Function to create notification when someone applies for a job
CREATE OR REPLACE FUNCTION create_job_application_notification()
RETURNS TRIGGER AS $$
DECLARE
    job_owner_id UUID;
    job_title TEXT;
BEGIN
    -- Get job owner and title
    SELECT user_id, instrument INTO job_owner_id, job_title
    FROM jobs 
    WHERE id = NEW.job_id;
    
    -- Create notification for job owner
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (
        job_owner_id,
        'job_application',
        'มีผู้สมัครงานใหม่',
        'มีคนสมัครงาน ' || job_title || ' ของคุณแล้ว',
        NEW.job_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when job application is confirmed
CREATE OR REPLACE FUNCTION create_job_confirmed_notification()
RETURNS TRIGGER AS $$
DECLARE
    applicant_id UUID;
    job_title TEXT;
BEGIN
    -- Get applicant and job title
    SELECT applicant_id, instrument INTO applicant_id, job_title
    FROM job_applications ja
    JOIN jobs j ON ja.job_id = j.id
    WHERE ja.id = NEW.id;
    
    -- Create notification for applicant
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (
        applicant_id,
        'job_confirmed',
        'การสมัครงานได้รับการยืนยัน',
        'การสมัครงาน ' || job_title || ' ของคุณได้รับการยืนยันแล้ว',
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when review is received
CREATE OR REPLACE FUNCTION create_review_notification()
RETURNS TRIGGER AS $$
DECLARE
    reviewee_id UUID;
    job_title TEXT;
BEGIN
    -- Get reviewee and job title
    SELECT reviewee_id, instrument INTO reviewee_id, job_title
    FROM reviews r
    JOIN jobs j ON r.job_id = j.id
    WHERE r.id = NEW.id;
    
    -- Create notification for reviewee
    INSERT INTO notifications (user_id, type, title, message, related_id)
    VALUES (
        reviewee_id,
        'review_received',
        'ได้รับรีวิวใหม่',
        'คุณได้รับรีวิวสำหรับงาน ' || job_title,
        NEW.id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Triggers
-- ========================================

-- Trigger for job application notifications
CREATE TRIGGER job_application_trigger
    AFTER INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_job_application_notification();

-- Trigger for job confirmation notifications
CREATE TRIGGER job_confirmed_trigger
    AFTER UPDATE ON job_applications
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed')
    EXECUTE FUNCTION create_job_confirmed_notification();

-- Trigger for review notifications
CREATE TRIGGER review_notification_trigger
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION create_review_notification();

-- ========================================
-- Helper Functions for Frontend
-- ========================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM notifications 
        WHERE user_id = p_user_id 
        AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent notifications
CREATE OR REPLACE FUNCTION get_recent_notifications(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title TEXT,
    message TEXT,
    related_id UUID,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.related_id,
        n.is_read,
        n.created_at
    FROM notifications n
    WHERE n.user_id = p_user_id
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Test Queries
-- ========================================

-- Test notification creation
-- INSERT INTO notifications (user_id, type, title, message, related_id)
-- VALUES ('your-user-id', 'job_application', 'Test notification', 'This is a test', 'test-id');

-- Test unread count
-- SELECT get_unread_notification_count('your-user-id');

-- Test mark as read
-- SELECT mark_notifications_read('your-user-id');

-- Test recent notifications
-- SELECT * FROM get_recent_notifications('your-user-id', 5);

-- ========================================
-- Real-time Setup Instructions
-- ========================================

/*
To enable real-time notifications in your React app:

1. Create a notifications table in Supabase
2. Set up RLS policies (included in this file)
3. Create triggers for automatic notifications
4. In your React component:

```javascript
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Initial load
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
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [userId]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .rpc('get_recent_notifications', { p_user_id: userId, p_limit: 20 });
    
    setNotifications(data || []);
    
    const { data: countData } = await supabase
      .rpc('get_unread_notification_count', { p_user_id: userId });
    
    setUnreadCount(countData || 0);
  };

  const markAsRead = async () => {
    await supabase.rpc('mark_notifications_read', { p_user_id: userId });
    setUnreadCount(0);
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, is_read: true }))
    );
  };

  return { notifications, unreadCount, markAsRead, fetchNotifications };
};
```

5. Create NotificationBell component:

```javascript
const NotificationBell = ({ userId }) => {
  const { notifications, unreadCount, markAsRead } = useNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button className="relative p-2">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAsRead}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                ทำเครื่องอ่านทั้งหมด
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">ไม่มีการแจ้งเตือน</p>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  className={`p-4 border-b hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.created_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```
*/
