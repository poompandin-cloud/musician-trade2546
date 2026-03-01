import React, { useState } from 'react';
import { MessageCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
      
      // สร้าง LINE Login URL
      const lineClientId = import.meta.env.VITE_LINE_CLIENT_ID;
      
      // Debug logging
      console.log('🔍 LINE Client ID:', lineClientId);
      console.log('🔍 Available env vars:', Object.keys(import.meta.env).filter(key => key.includes('LINE')));
      
      // ตรวจสอบว่ามี Client ID หรือไม่
      if (!lineClientId || lineClientId === 'undefined' || lineClientId.trim() === '') {
        setIsLoading(false);
        toast({
          title: "การตั้งค่าไม่ถูกต้อง",
          description: "ไม่พบ LINE Client ID กรุณาตรวจสอบไฟล์ .env และรีสตาร์ทเซิร์ฟเวอร์",
          variant: "destructive",
        });
        return;
      }
      
      const redirectUri = `${window.location.origin}/line-callback`;
      const state = Math.random().toString(36).substring(7); // สร้าง random state
      
      const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
        `response_type=code&` +
        `client_id=${lineClientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `scope=openid%20profile%20email`;
      
      console.log('🔍 LINE Auth URL:', lineAuthUrl);
      
      // เปิดหน้าต่าง LINE Login
      const popup = window.open(
        lineAuthUrl,
        'line-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // รอการตอบกลับจาก popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
        }
      }, 1000);
      
      // รอรับข้อมูลจาก popup (ผ่าน postMessage)
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'LINE_LOGIN_SUCCESS') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          
          // เรียก API อัปเดต line_user_id
          await updateLineUserId(event.data.lineUserId);
        } else if (event.data.type === 'LINE_LOGIN_ERROR') {
          clearInterval(checkClosed);
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setIsLoading(false);
          
          toast({
            title: "เชื่อมต่อ LINE ไม่สำเร็จ",
            description: event.data.error || "กรุณาลองใหม่อีกครั้ง",
            variant: "destructive",
          });
        }
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่",
        variant: "destructive",
      });
    }
  };

  const updateLineUserId = async (lineUserId: string) => {
    try {
      const response = await fetch('/api/update-line-user-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineUserId }),
      });
      
      if (response.ok) {
        onConnectSuccess(lineUserId);
        setIsLoading(false);
        
        toast({
          title: "เชื่อมต่อ LINE สำเร็จ!",
          description: "คุณจะได้รับการแจ้งเตือนเมื่อมีงานใหม่",
          duration: 3000,
        });
      } else {
        throw new Error('ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูล LINE ได้ กรุณาลองใหม่",
        variant: "destructive",
      });
    }
  };

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
