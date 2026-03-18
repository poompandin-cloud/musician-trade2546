import React, { useState } from 'react';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LineConnectButtonProps {
  lineUserId: string | null;
  onConnectSuccess: (lineUserId: string) => void;
}

export const LineConnectButton: React.FC<LineConnectButtonProps> = ({ 
  lineUserId, 
  onConnectSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLineConnect = async () => {
    try {
      setIsLoading(true);
      
      // ใช้ Supabase OAuth สำหรับ LINE Login
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'line',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error('LINE OAuth Error:', error);
        toast({
          title: "เชื่อมต่อ LINE ไม่สำเร็จ",
          description: error.message,
          variant: "destructive",
        });
      } else {
        console.log('LINE OAuth initiated successfully');
        toast({
          title: "กำลังเชื่อมต่อ LINE",
          description: "กรุณาทำตามขั้นตอนในแอป LINE",
        });
      }
      
    } catch (error) {
      console.error('Error connecting to LINE:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ถ้าเชื่อมต่อแล้ว แสดงสถานะ
  if (lineUserId) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="text-green-700 font-medium">✅ เชื่อมต่อ LINE เรียบร้อยแล้ว</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLineConnect}
      disabled={isLoading}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>กำลังเชื่อมต่อ...</span>
        </>
      ) : (
        <>
          <MessageCircle className="w-5 h-5" />
          <span>เชื่อมต่อ LINE รับแจ้งเตือนงาน</span>
        </>
      )}
    </Button>
  );
};
