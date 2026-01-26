import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export interface CreditResetLog {
  id: string;
  reset_date: string;
  total_users_reset: number;
  created_at: string;
  notes?: string;
}

export class CreditService {
  // ดึงข้อมูลเครดิตปัจจุบันของผู้ใช้
  static async getUserCredits(userId: string): Promise<{ credit_balance: number; last_reset?: string }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credit_balance, last_credit_reset')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return {
        credit_balance: data?.credit_balance || 15,
        last_reset: data?.last_credit_reset
      };
    } catch (error) {
      console.error('Error fetching user credits:', error);
      return { credit_balance: 15 };
    }
  }

  // ตรวจสอบว่ามีการรีเซ็ตเครดิตในสัปดาห์นี้หรือไม่
  static async checkWeeklyReset(userId: string): Promise<{ hasReset: boolean; message?: string }> {
    try {
      const { last_reset } = await this.getUserCredits(userId);
      
      if (!last_reset) {
        return { hasReset: false };
      }

      const lastResetDate = new Date(last_reset);
      const today = new Date();
      const daysSinceReset = Math.floor((today.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // ถ้าผ่านมาไม่เกิน 7 วัน แสดงว่าเคยรีเซ็ตในสัปดาห์นี้
      if (daysSinceReset <= 7) {
        return { 
          hasReset: true,
          message: "เครดิตของคุณถูกรีเซ็ตเป็น 15 สำหรับสัปดาห์นี้แล้ว"
        };
      }

      return { hasReset: false };
    } catch (error) {
      console.error('Error checking weekly reset:', error);
      return { hasReset: false };
    }
  }

  // หักเครดิตเมื่อประกาศงาน
  static async deductCredits(userId: string, amount: number = 1): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      // ตรวจสอบเครดิตปัจจุบัน
      const { credit_balance } = await this.getUserCredits(userId);
      
      if (credit_balance < amount) {
        return { 
          success: false, 
          error: `เครดิตไม่เพียงพอ คุณมี ${credit_balance} เครดิต ต้องการ ${amount} เครดิต` 
        };
      }

      // หักเครดิต
      const { data, error } = await supabase
        .from('profiles')
        .update({ credit_balance: credit_balance - amount })
        .eq('id', userId)
        .select('credit_balance')
        .single();

      if (error) throw error;

      return { 
        success: true, 
        newBalance: data.credit_balance 
      };
    } catch (error) {
      console.error('Error deducting credits:', error);
      return { 
        success: false, 
        error: 'ไม่สามารถหักเครดิตได้ กรุณาลองใหม่' 
      };
    }
  }

  // ดึงประวัติการรีเซ็ตเครดิต
  static async getResetHistory(limit: number = 5): Promise<CreditResetLog[]> {
    try {
      const { data, error } = await supabase
        .from('credit_reset_logs')
        .select('*')
        .order('reset_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reset history:', error);
      return [];
    }
  }

  // สร้าง notification เมื่อเครดิตถูกรีเซ็ต
  static async createCreditResetNotification(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'รีเซ็ตเครดิตประจำสัปดาห์',
          message: 'เครดิตของคุณถูกรีเซ็ตเป็น 15 สำหรับสัปดาห์นี้แล้ว',
          type: 'success',
          metadata: {
            type: 'credit_reset',
            new_balance: 15
          }
        });
    } catch (error) {
      console.error('Error creating credit reset notification:', error);
    }
  }
}

// Hook สำหรับใช้ใน React Components
export const useCredits = (userId: string) => {
  const [credits, setCredits] = useState(15);
  const [loading, setLoading] = useState(false);
  const [lastReset, setLastReset] = useState<string | undefined>();

  const fetchCredits = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { credit_balance, last_reset } = await CreditService.getUserCredits(userId);
      setCredits(credit_balance);
      setLastReset(last_reset);

      // ตรวจสอบว่ามีการรีเซ็ตในสัปดาห์นี้หรือไม่
      const { hasReset } = await CreditService.checkWeeklyReset(userId);
      if (hasReset && last_reset) {
        // แสดง notification ถ้ายังไม่เคยแสดง
        const notificationKey = `credit_reset_${last_reset}`;
        if (!localStorage.getItem(notificationKey)) {
          toast({
            title: "รีเซ็ตเครดิตประจำสัปดาห์",
            description: "เครดิตของคุณถูกรีเซ็ตเป็น 15 สำหรับสัปดาห์นี้แล้ว",
          });
          localStorage.setItem(notificationKey, 'shown');
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const deductCredits = async (amount: number = 1) => {
    if (!userId) return { success: false };
    
    const result = await CreditService.deductCredits(userId, amount);
    
    if (result.success && result.newBalance !== undefined) {
      setCredits(result.newBalance);
      toast({
        title: "หักเครดิตสำเร็จ",
        description: `เหลือเครดิต ${result.newBalance} เครดิต`,
      });
    } else {
      toast({
        title: "ไม่สามารถหักเครดิตได้",
        description: result.error,
        variant: "destructive"
      });
    }
    
    return result;
  };

  useEffect(() => {
    if (userId) {
      fetchCredits();
    }
  }, [userId]);

  return {
    credits,
    loading,
    lastReset,
    fetchCredits,
    deductCredits
  };
};
