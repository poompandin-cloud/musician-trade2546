import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export interface JobApplication {
  id: string;
  job_id: string;
  musician_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  applied_at: string;
  confirmed_at?: string;
  completed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

// 1. Request & Notify System
export class BookingService {
  // สมัครงาน (Musician กด "รับงานนี้")
  static async applyForJob(jobId: string, musicianId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // ตรวจสอบว่าเคยสมัครไปแล้วหรือไม่
      const { data: existingApplication } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('musician_id', musicianId)
        .single();

      if (existingApplication) {
        return { success: false, error: 'คุณได้สมัครงานนี้ไปแล้ว' };
      }

      // สร้าง record ใหม่ใน job_applications
      const { data: application, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          musician_id: musicianId,
          status: 'pending',
          applied_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // ดึงข้อมูล job และ musician เพื่อส่ง notification
      const { data: job } = await supabase
        .from('jobs')
        .select('title, user_id')
        .eq('id', jobId)
        .single();

      const { data: musician } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', musicianId)
        .single();

      if (job && musician) {
        // ส่ง Notification ไปหาเจ้าของงาน
        await this.createNotification({
          user_id: job.user_id,
          title: 'มีนักดนตรีสมัครงาน',
          message: `${musician.full_name} ได้สมัครงาน "${job.title}" ของคุณ`,
          type: 'info',
          metadata: {
            job_id: jobId,
            application_id: application.id,
            musician_id: musicianId
          }
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error applying for job:', error);
      return { success: false, error: 'ไม่สามารถสมัครงานได้ กรุณาลองใหม่' };
    }
  }

  // สร้าง Notification
  static async createNotification(notification: {
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // ดึงรายการ applications สำหรับเจ้าของงาน
  static async getJobApplications(jobId: string): Promise<JobApplication[]> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles!job_applications_musician_id_fkey (
            full_name,
            avatar_url,
            instruments,
            received_tokens
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting job applications:', error);
      return [];
    }
  }

  // ดึงรายการ notifications สำหรับผู้ใช้
  static async getUserNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // ทำเครื่องหมายว่าอ่านแล้ว
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // นับจำนวน notifications ที่ยังไม่ได้อ่าน
  static async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread notifications count:', error);
      return 0;
    }
  }
}

// Hook สำหรับใช้ใน React Components
export const useBookingNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [notificationsData, unreadData] = await Promise.all([
        BookingService.getUserNotifications(userId),
        BookingService.getUnreadNotificationsCount(userId)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    await BookingService.markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead
  };
};
