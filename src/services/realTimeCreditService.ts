import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface ProfileData {
  id: string;
  credits: number;
  last_credit_reset?: string;
}

// Global state สำหรับเครดิตเพื่อให้ทุกคอมโพเนนต์ใช้ข้อมูลเดียวกัน
let globalCreditState: {
  credits: number;
  listeners: Set<(credits: number) => void>;
  channel: any;
} = {
  credits: 0,
  listeners: new Set(),
  channel: null
};

// Hook สำหรับดึงข้อมูลเครดิตแบบ Real-time
export function useRealTimeCredits(userId: string | null) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // เพิ่ม listener ให้กับ global state
    const updateCredits = (newCredits: number) => {
      setCredits(newCredits);
    };
    
    globalCreditState.listeners.add(updateCredits);

    // ถ้ายังไม่มี channel ให้สร้างใหม่
    if (!globalCreditState.channel) {
      globalCreditState.channel = supabase
        .channel('credit-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
          },
          (payload) => {
            console.log('🔔 Credit update received:', payload);
            const newCredits = payload.new?.credits || 0;
            globalCreditState.credits = newCredits;
            
            // แจ้งทุก listeners ให้อัปเดต
            globalCreditState.listeners.forEach(listener => {
              listener(newCredits);
            });
          }
        )
        .subscribe();
    }

    // ดึงข้อมูลเครดิตครั้งแรก
    const fetchInitialCredits = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits') // ดึงแค่เครดิตพอ
          .eq('id', userId)
          .single(); // ใช้ single() สำหรับผู้ใช้คนเดียว

        if (error) {
          console.error('Error fetching credits:', error);
          setCredits(15); 
        } else if (data) {
          const creditAmount = data.credits || 0;
          setCredits(creditAmount);
          globalCreditState.credits = creditAmount;
          console.log('📊 Initial credits loaded:', creditAmount);
        } else {
          setCredits(5); // ถ้าหาไม่เจอจริงๆ ให้โชว์ 5 จะได้รู้ว่าหาไม่เจอ
        }
      } catch (error) {
        console.error('Error in fetchInitialCredits:', error);
        setCredits(15);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialCredits();

    // Cleanup
    return () => {
      globalCreditState.listeners.delete(updateCredits);
      
      // ถ้าไม่มี listener แล้วให้ unsubscribe channel
      if (globalCreditState.listeners.size === 0 && globalCreditState.channel) {
        globalCreditState.channel.unsubscribe();
        globalCreditState.channel = null;
      }
    };
  }, [userId]);

  return { credits, loading };
}

// ฟังก์ชันสำหรับ trigger การอัปเดตเครดิต (สำหรับใช้หลังจากหักเครดิต)
export function triggerCreditUpdate(userId: string) {
  // บังคับให้ Supabase ส่ง event โดยการทำการอัปเดตเล็กๆ (ถ้าจำเป็น)
  // หรือสามารถเรียก fetch ใหม่ได้
  console.log('🔄 Triggering credit update for user:', userId);
}

// ฟังก์ชันสำหรับ fetch ข้อมูลโปรไฟล์ใหม่ (Refetch Profile)
export async function refetchProfile(userId: string): Promise<ProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, credits, last_credit_reset')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error refetching profile:', error);
      return null;
    }

    const creditAmount = data?.credits || 0;
    globalCreditState.credits = creditAmount;
    
    // แจ้งทุก listeners ให้อัปเดต
    globalCreditState.listeners.forEach(listener => {
      listener(creditAmount);
    });

    return data;
  } catch (error) {
    console.error('Error in refetchProfile:', error);
    return null;
  }
}
