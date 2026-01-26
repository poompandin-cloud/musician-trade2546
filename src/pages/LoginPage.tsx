import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AuthForm from '@/components/ui/AuthForm';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Handle sign up
  const handleSignUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชีของคุณ",
      });

    } catch (error: any) {
      toast({
        title: "สมัครสมาชิกไม่สำเร็จ",
        description: error.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sign in
  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับกลับมา!",
      });

    } catch (error: any) {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle social login (Google, Facebook, GitHub)
  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;

    } catch (error: any) {
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: error.message || "ไม่สามารถเข้าสู่ระบบด้วยบัญชีนี้ได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">หาคนเล่นแทน</h1>
          <h2 className="text-3xl font-bold text-orange-500">ดนตรีกลางคืน</h2>
          <p className="text-gray-500 mt-2">แบบด่วน ทันที 🎵</p>
        </div>
        
        <AuthForm 
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
          onSocialLogin={handleSocialLogin}
          loading={loading}
        />
        
        <p className="mt-6 text-center text-sm text-gray-400 italic">
          * กรอก Email และตั้งรหัสผ่านเพื่อเริ่มต้นใช้งาน
        </p>
      </div>
    </div>
  );
};

export default LoginPage;