import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import "./AuthPage.css";

const AuthPage = () => {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showLineBrowserWarning, setShowLineBrowserWarning] = useState(false);
  
  const { toast } = useToast();

  // ✅ ตรวจสอบ User Agent สำหรับ LINE In-App Browser
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isLineBrowser = userAgent.toLowerCase().includes('line/');
    
    if (isLineBrowser) {
      console.log('🔍 Detected LINE In-App Browser');
      
      // สำหรับ Android: พยายามเปิดใน Chrome
      if (userAgent.toLowerCase().includes('android')) {
        console.log('🔍 Android detected, trying to open in Chrome');
        window.location.href = 'googlechrome://navigate?url=' + encodeURIComponent(window.location.href);
      } 
      // สำหรับ iOS และทั่วไป: เพิ่ม parameter
      else {
        console.log('🔍 iOS or other detected, adding parameter');
        const currentUrl = new URL(window.location.href);
        if (!currentUrl.searchParams.has('openExternalBrowser')) {
          currentUrl.searchParams.set('openExternalBrowser', '1');
          window.location.href = currentUrl.toString();
        } else {
          // ถ้ามี parameter อยู่แล้ว แสดง UI แจ้งเตือน
          setShowLineBrowserWarning(true);
        }
      }
    }
  }, []);

  // ✅ ฟังก์ชันสำหรับปิด warning
  const closeLineBrowserWarning = () => {
    setShowLineBrowserWarning(false);
  };

  const handleAuth = async (e: React.FormEvent, type: 'signin' | 'signup') => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, 
          password, 
          options: { data: { full_name: fullName } },
        });

        if (error) throw error;

        toast({ title: "สมัครสมาชิกสำเร็จ!", description: "ยินดีต้อนรับ! บัญชีของคุณพร้อมใช้งานแล้ว" });

        setTimeout(() => window.location.href = "/", 1500);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;
        
        toast({ title: "เข้าสู่ระบบสำเร็จ!", description: "ยินดีต้อนรับกลับมา" });
        
        window.location.href = "/";
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: error.message || "กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      console.log(`🔍 Starting ${provider} OAuth...`);
      console.log("🔍 Current origin:", window.location.origin);
      console.log("🔍 Redirect URL:", window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider,
        options: {
          redirectTo: window.location.origin // ✅ ใช้ window.location.origin ชัดเจน
        }
      });
      
      console.log(`🔍 ${provider} OAuth Response:`, { data, error });
      
      if (error) {
        console.error(`❌ ${provider} OAuth Error:`, error);
        toast({ 
          variant: "destructive",
          title: "เข้าสู่ระบบไม่สำเร็จ", 
          description: error.message 
        });
      } else {
        console.log(`✅ ${provider} OAuth initiated successfully`);
      }
    } catch (error: any) {
      console.error(`❌ ${provider} OAuth Exception:`, error);
      toast({ 
        variant: "destructive",
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถเชื่อมต่อกับผู้ให้บริการได้" 
      });
    }
  };

  // ✅ เพิ่มฟังก์ชัน signInWithGoogle เฉพาะสำหรับ Google
  const signInWithGoogle = async () => {
    try {
      console.log("🔍 Starting Google OAuth...");
      console.log("🔍 Current origin:", window.location.origin);
      console.log("🔍 Redirect URL:", window.location.origin);
      
      const { data, error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin // ✅ ใช้ window.location.origin ชัดเจน
        }
      });
      
      console.log("🔍 OAuth Response:", { data, error });
      
      if (error) {
        console.error("❌ Google OAuth Error:", error);
        toast({ 
          variant: "destructive",
          title: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ", 
          description: error.message 
        });
      } else {
        console.log("✅ Google OAuth initiated successfully");
      }
    } catch (error: any) {
      console.error("❌ Google OAuth Exception:", error);
      toast({ 
        variant: "destructive",
        title: "เกิดข้อผิดพลาด", 
        description: "ไม่สามารถเชื่อมต่อกับ Google ได้" 
      });
    }
  };

  return (
    <div className="auth-body">
      {/* ✅ LINE Browser Warning Overlay */}
      {showLineBrowserWarning && (
        <div className="line-browser-warning-overlay">
          <div className="line-browser-warning-card">
            <div className="warning-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3>กรุณาเปิดในเบราว์เซอร์ภายนอก</h3>
            <p>
              ตอนนี้คุณกำลังใช้งานผ่าน LINE In-App Browser ซึ่งอาจทำให้บางฟีเจอร์ไม่ทำงานได้เต็มที่
            </p>
            <div className="instruction-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span className="step-text">กดปุ่ม <strong>...</strong> ที่มุมขวาบน</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span className="step-text">เลือก <strong>Open in Browser</strong></span>
              </div>
            </div>
            <button 
              className="close-warning-btn"
              onClick={closeLineBrowserWarning}
            >
              ฉันเข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      <div className={`container ${isActive ? "active" : ""}`} id="container">
        {/* Registration Form */}
        <div className="form-container sign-up">
          <form onSubmit={(e) => handleAuth(e, 'signup')}>
            <h1>สร้างบัญชีใหม่</h1>
            <input type="text" placeholder="Username" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">สร้างบัญชี</button>
            <p className="social-text">หรือสมัครสมาชิกด้วยแพลตฟอร์มอื่น</p>
            <div className="social-icons">
              <button type="button" className="social-btn google" onClick={signInWithGoogle}>
                <i className="fa-brands fa-google"></i>
                <span>สมัครด้วย Google</span>
              </button>
            </div>
          </form>
        </div>

        {/* Login Form */}
        <div className="form-container sign-in">
          <form onSubmit={(e) => handleAuth(e, 'signin')}>
            <h1>ล็อคอิน</h1>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <a href="#" className="forgot">ลืมรหัสผ่าน?</a>
            <button type="submit">ล็อคอิน</button>
            <p className="social-text">ล็อคอินด้วยแพลตฟอร์มอื่น</p>
            <div className="social-icons">
              <button type="button" className="social-btn google" onClick={signInWithGoogle}>
                <i className="fa-brands fa-google"></i>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            </div>
          </form>
        </div>

        {/* Toggle Panels */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>ยินดีต้อนรับนักดนตรี!</h1>
              <p>มีบัญชีอยู่แล้วใช่ไหม?</p>
              <button 
                className="toggle-btn" 
                type="button"
                onClick={() => setIsActive(false)}
                style={{ backgroundColor: 'transparent', color: 'white', border: '2px solid white', padding: '10px 30px', borderRadius: '20px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                เข้าสู่ระบบ
              </button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>สวัสดีนักดนตรีทุกคน!</h1>
              <p>มาร่วมเป็นส่วนหนึ่งกับชุมชนนักดนตรี เพื่อโอกาสในการรับงานที่มากขึ้น</p>
              <button 
                className="register-toggle-btn" 
                type="button"
                onClick={() => setIsActive(true)}
                style={{ backgroundColor: 'white', color: '#e67e22', border: 'none', padding: '10px 30px', borderRadius: '20px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                สมัครสมาชิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;