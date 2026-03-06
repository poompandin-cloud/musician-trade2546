import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CreditWidget from "./components/CreditWidget";
import { refetchProfile } from "./services/realTimeCreditService";
import MusicianSignup from "./components/MusicianSignup";
import AboutSection from "./components/AboutSection";
import SearchForm from "./components/SearchForm";
import NearbyGigs from "./components/NearbyGigs";
import MusicianSearch from "./pages/MusicianSearch";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import CreditDetailsPage from "./pages/CreditDetailsPage";
import LineCallback from "./pages/LineCallback";
import NotFound from "./pages/NotFound";
import JobDetail from "./pages/JobDetail"; // หรือ path ที่พี่เก็บไฟล์ไว้


const queryClient = new QueryClient();

const App = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCreditReset, setLastCreditReset] = useState<any>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      // ✅ เรียก fetchJobs หลังจากมี session แล้ว
      if (session) {
        fetchJobs();
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔍 App.tsx: Auth state changed:", { event: _event, session });
      setSession(session);
      if (session) {
        console.log("🔍 App.tsx: User logged in, fetching jobs...");
        fetchJobs();
      } else {
        console.log("🔍 App.tsx: User logged out");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ตรวจสอบการรีเซ็ตเครดิตล่าสุด
  const checkCreditReset = async () => {
    try {
      const response = await fetch('/api/reset-credits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastCreditReset(data.last_reset);
        console.log('Last credit reset:', data.last_reset);
      }
    } catch (error) {
      console.error('Error checking credit reset:', error);
    }
  };

  // ตรวจสอบว่าต้องรีเซ็ตเครดิตหรือไม่
  const shouldResetCredits = () => {
    if (!lastCreditReset) return false;
    
    const lastResetDate = new Date(lastCreditReset.reset_date);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const resetMonth = lastResetDate.getMonth();
    const resetYear = lastResetDate.getFullYear();
    
    // ถ้าเปลี่ยนเดือนแล้ว และยังไม่ได้รีเซ็ตในเดือนนี้
    return currentMonth !== resetMonth || currentYear !== resetYear;
  };

  // รีเซ็ตเครดิตอัตโนมัติถ้าจำเป็นต้อง
  const autoResetCredits = async () => {
    if (shouldResetCredits()) {
      try {
        const response = await fetch('/api/reset-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'reset_monthly_credits' }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Auto credit reset completed:', data);
          setLastCreditReset({ reset_date: new Date().toISOString() });
          refetchProfile(session?.user?.id); // รีเฟรชข้อมูล profile
        }
      } catch (error) {
        console.error('Error auto resetting credits:', error);
      }
    }
  }; 

  const fetchJobs = async () => {
    try {
      // Debug: Log current session
      console.log("Current session:", session?.user?.id);
      
      // ดึงงานทั้งหมด - ไม่มีการกรองใดๆ
      const userId = session?.user?.id;
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });
      
      console.log("All jobs query result:", { data, error, userId });
      
      if (error) {
        console.error("Error fetching jobs with join:", error);
        // Fallback: ดึงงานทั้งหมด - ไม่มีการกรอง
        const { data: jobsData, error: jobsError } = await (supabase as any)
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log("Fallback all jobs result:", { jobsData, jobsError });
        
        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
          return;
        }
        
        // ดึงข้อมูล profiles แยกสำหรับแต่ละ job
        if (jobsData && jobsData.length > 0) {
          const jobsWithProfiles = await Promise.all(
            jobsData.map(async (job: any) => {
              try {
                const { data: profile } = await (supabase as any)
                  .from('profiles')
                  .select('full_name, avatar_url')
                  .eq('id', job.user_id)
                  .single();
                
                return {
                  ...job,
                  profiles: profile || {}
                };
              } catch {
                return {
                  ...job,
                  profiles: {}
                };
              }
            })
          );
          setJobs(jobsWithProfiles);
        } else {
          setJobs([]);
        }
      } else {
        if (data) setJobs(data);
      }
    } catch (err) {
      console.error("System Error:", err);
    }
  };

  useEffect(() => {
    console.log("🔍 App.tsx: Initializing session check...");
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🔍 App.tsx: Initial session:", session);
      setSession(session);
      setIsLoading(false); // ✅ หยุด loading หลังตรวจสอบ session
      // ✅ เรียก fetchJobs หลังจากมี session แล้ว
      if (session) {
        fetchJobs();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("🔍 App.tsx: Auth state changed:", { event: _event, session });
      setSession(session);
      setIsLoading(false); // ✅ หยุด loading เมื่อมีการเปลี่ยนแปลง
      if (session) {
        console.log("🔍 App.tsx: User logged in, fetching jobs...");
        fetchJobs();
      } else {
        console.log("🔍 App.tsx: User logged out");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ฟังก์ชันเพิ่มประกาศงาน (ฉบับสะอาดและแม่นยำ)
  const addJob = async (newJob: any) => {
    console.log("🚀 เริ่มต้นกระบวนการประกาศงาน...", newJob);
    
    if (!session) throw new Error("กรุณาเข้าสู่ระบบก่อน");
    const userId = session?.user?.id;

    try {
      // 1. ดึงค่า credits ล่าสุดของผู้ใช้ออกมาจาก Supabase
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (pError) throw new Error("ไม่สามารถดึงข้อมูลเครดิตได้: " + pError.message);
      
      const currentCredits = profile?.credits || 0;
      console.log("🔍 เครดิตปัจจุบันใน DB:", currentCredits);

      // 2. ตรวจสอบว่าถ้ามีน้อยกว่า 5 เครดิต ให้แจ้งเตือน
      if (currentCredits < 5) {
        throw new Error(`เครดิตไม่พอ (ต้องการ 5 แต่คุณมี ${currentCredits})`);
      }

      // 3. หากพอ ให้ทำการบันทึกงานลงตาราง jobs
      const { data: insertedJob, error: insertError } = await (supabase as any)
        .from('jobs')
        .insert([{
          ...newJob,
          user_id: userId,
          status: "open",
          created_at: new Date().toISOString() // เปลี่ยนเป็น created_at ให้ตรงกับฐานข้อมูล
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      console.log("✅ บันทึกงานสำเร็จ ID:", insertedJob.id);

      // 3.5. ส่งการแจ้งเตือนงานใหม่ผ่าน LINE
      try {
        const notificationResponse = await fetch('/api/notify-new-job', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            jobData: {
              id: insertedJob.id,
              title: newJob.title,
              instrument: newJob.instrument,
              venue: newJob.location,
              province: newJob.province,
              date: newJob.date,
              time: newJob.time,
              budget: newJob.budget
            }
          }),
        });
        
        if (notificationResponse.ok) {
          const notificationResult = await notificationResponse.json();
          console.log("📱 ส่งการแจ้งเตือน LINE:", notificationResult);
        } else {
          console.log("⚠️ ไม่สามารถส่งการแจ้งเตือน LINE ได้:", await notificationResponse.text());
        }
      } catch (notificationError) {
        console.log("❌ เกิดข้อผิดพลาดในการส่งแจ้งเตือน LINE:", notificationError);
        // ไม่ต้อง throw error เพราะการส่งแจ้งเตือนไม่ควรทำให้การสร้างงานล้มเหลว
      }

      // 4. หลังจากบันทึกงานสำเร็จ ให้ทำการหักเครดิตออก 5
      const newBalance = currentCredits - 5;
      console.log("🔍 กำลังจะหักเครดิต:", { currentCredits, newBalance, userId });
      
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId)
        .select()
        .single();

      console.log("🔍 ผลการอัปเดตเครดิต:", { updateData, updateError });

      // 5. จัดการ Error: หากการหักเครดิตล้มเหลว ให้ทำการลบ (Rollback) งานที่เพิ่งสร้างทิ้ง
      if (updateError) {
        console.error("❌ หักเครดิตล้มเหลว:", updateError);
        // ลบงานที่เพิ่งสร้างทิ้งเพื่อป้องกันการลงงานฟรี
        await supabase.from('jobs').delete().eq('id', insertedJob.id);
        throw new Error("หักเครดิตไม่สำเร็จ: " + updateError.message);
      } else {
        console.log("✅ หักเครดิตสำเร็จ! ยอดคงเหลือ:", newBalance);
        
        // 6. Real-time Update: เมื่อหักเครดิตสำเร็จ ให้อัปเดตหน้าจอทันที
        console.log("🔄 กำลังอัปเดตหน้าจอทันที...");
        await refetchProfile(userId); // อัปเดต Credit Widget และหน้า Profile
        await fetchJobs();            // รีเฟรชรายการงานหน้าแรก
        console.log("✅ อัปเดตหน้าจอสำเร็จ!");
      }
       
    } catch (err: any) {
      console.error("❌ เกิดข้อผิดพลาดใน addJob:", err.message);
      throw err; // ส่ง Error ไปให้หน้า UI แสดง Alert
    }
  };

  const deleteJob = async (id: string) => {
    if (!id) return;

    const confirmDelete = window.confirm("คุณต้องการลบประกาศงานนี้ใช่หรือไม่?");
    if (!confirmDelete) return;

    try {
      setJobs((prevJobs) => prevJobs.filter(job => job.id !== id));

      const { error } = await (supabase as any)
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting:", error);
        alert("ลบในฐานข้อมูลไม่สำเร็จ (อาจเพราะไม่ใช่เจ้าของงาน)");
        await fetchJobs(); 
        return;
      }
    } catch (err) {
      console.error("System Error:", err);
      await fetchJobs();
    }
  };

  const activeJobs = jobs.filter(job => {
    if (!job.created_at) return true;
    const jobTime = new Date(job.created_at).getTime();
    const isRecent = (Date.now() - jobTime) < (7 * 24 * 60 * 60 * 1000); // ← เปลี่ยนเป็น 7 วัน (1 สัปดาห์)
    const isNotCalendarEntry = !job.is_calendar_entry; // ✅ กรองออก calendar entries
    return isRecent && isNotCalendarEntry;
  });

  // ✅ หาก isLoading เป็น true ให้แสดงหน้า Loading เปล่าๆ ก่อน
  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ShadcnToaster />
          <Toaster />
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลด...</p>
            </div>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // ✅ ถ้าไม่มี session ให้แสดงหน้า AuthPage (หน้าสีส้ม) เท่านั้น
  if (!session) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ShadcnToaster />
          <Toaster />
          <AuthPage />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // ✅ แสดงหน้าหลักทันทีเมื่อมี session ไม่ต้องรอ jobs
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ShadcnToaster />
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col overflow-x-hidden">
            <Navbar userId={session?.user?.id || null} />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index jobs={activeJobs} onAddJob={addJob} />} />
                
                <Route 
                  path="/profile" 
                  element={
                    session ? (
                      <ProfilePage currentUserId={session.user.id} onDeleteJob={deleteJob} />
                    ) : (
                      <Index jobs={activeJobs} onAddJob={addJob} /> 
                    )
                  } 
                />
                  
                  <Route 
                    path="/profile/:id" 
                    element={
                      session ? (
                        <ProfilePage currentUserId={session.user.id} onDeleteJob={deleteJob} />
                      ) : (
                        <Index jobs={activeJobs} onAddJob={addJob} /> 
                      )
                    } 
                  />

                  <Route 
                    path="/search" 
                    element={
                      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col items-center pt-10 overflow-x-hidden">
                        <div className="w-full max-w-md">
                          <button onClick={() => window.history.back()} className="mb-6 text-orange-500 font-bold">← ย้อนกลับ</button>
                          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-gray-900">หาคนแทนด่วน 🎵</h2>
                          <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-gray-100">
                            <SearchForm 
                              onBack={() => window.history.back()} 
                              onAddJob={addJob}
                              userId={session?.user?.id}
                            /> 
                          </div>
                        </div>
                      </div>
                    } 
                  />

                  <Route path="/nearby-gigs" element={<NearbyGigs jobs={activeJobs} onBack={() => window.history.back()} onDeleteJob={deleteJob} currentUserId={session?.user?.id} />} />
                  <Route path="/musicians" element={<MusicianSearch onBack={() => window.history.back()} />} />
                  <Route path="/my-applications" element={<MyApplicationsPage currentUserId={session?.user?.id || null} />} />
                  <Route path="/credits" element={<CreditDetailsPage />} />
                  <Route path="/join" element={<MusicianSignup onBack={() => window.history.back()} />} />
                  <Route path="/about" element={<AboutSection onBack={() => window.history.back()} />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/line-callback" element={<LineCallback />} />
                  // วางไว้ก่อนหน้า path="*" เหมือนเดิมครับ
<Route path="/job/:id" element={<Index jobs={activeJobs} onAddJob={addJob} />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              <Footer />
              <CreditWidget userId={session?.user?.id || null} />
            </div>
          </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;