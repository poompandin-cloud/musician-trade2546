import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import MyApplicationsPage from "./pages/MyApplicationsPage";
import MusicianSearch from "./pages/MusicianSearch";
import NearbyGigs from "./components/NearbyGigs";
import SearchForm from "./components/SearchForm";
import MusicianSignup from "./components/MusicianSignup";
import AboutSection from "./components/AboutSection";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CreditWidget from "./components/CreditWidget";
import AuthPage from "./pages/AuthPage"; // Import เข้ามาด้วย

const queryClient = new QueryClient();

const App = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true); // ✅ ใช้เพียง loading state เดียว 

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

  // ฟังก์ชันเพิ่มประกาศงาน (พร้อมเช็ค weekly quota และหักเครดิต)
  const addJob = async (newJob: any) => {
    if (!session) {
      throw new Error("กรุณาเข้าสู่ระบบก่อน");
    }

    const userId = session?.user?.id;

    try {
      // 1. เช็ค Weekly Quota: นับงานใน 7 วันล่าสุด
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentJobs, error: quotaError } = await (supabase as any)
        .from('jobs')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (quotaError) {
        console.error("Error checking quota:", quotaError);
        throw new Error("ไม่สามารถตรวจสอบโควตาการลงงานได้");
      }

      const jobCount = recentJobs?.length || 0;
      if (jobCount >= 5) {
        throw new Error("คุณใช้สิทธิ์ลงงานฟรีครบ 5 ครั้งในสัปดาห์นี้แล้ว");
      }

      // 2. เช็ค Credits: ตรวจสอบว่าเครดิตเพียงพอหรือไม่
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("ไม่สามารถตรวจสอบเครดิตได้");
      }

      const currentCredits = profile?.credits || 0;
      if (currentCredits < 5) {
        throw new Error("เครดิตไม่เพียงพอ (ต้องการ 5 เครดิต)");
      }

      // 3. บันทึกงานใหม่
      const { data: insertedJob, error: insertError } = await (supabase as any)
        .from('jobs')
        .insert([{
          instrument: newJob.instrument,
          date: newJob.date,
          location: newJob.location,
          province: newJob.province,
          duration: newJob.duration,
          budget: newJob.budget,
          phone: newJob.phone,     
          lineId: newJob.lineId,   
          status: newJob.status || "open", // ใช้ค่าที่ส่งมาหรือค่าเริ่มต้น
          user_id: userId 
        }])
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting job:", insertError);
        console.error("Full insert error details:", JSON.stringify(insertError, null, 2));
        
        // ส่ง error ที่ละเอียดกลับไปให้ SearchForm แสดง
        let errorMessage = "ไม่สามารถบันทึกงานได้";
        
        if (insertError.message) {
          if (insertError.message.includes("column") || insertError.message.includes("does not exist")) {
            errorMessage = `คอลัมน์ในตารางไม่ถูกต้อง: ${insertError.message}`;
          } else if (insertError.message.includes("permission") || insertError.message.includes("unauthorized") || insertError.message.includes("403")) {
            errorMessage = "คุณไม่มีสิทธิ์ในการเพิ่มงาน กรุณาตรวจสอบ RLS Policy";
          } else if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
            errorMessage = "มีข้อมูลซ้ำในระบบ";
          } else if (insertError.message.includes("foreign key")) {
            errorMessage = "ข้อมูลผู้ใช้ไม่ถูกต้อง";
          } else {
            errorMessage = insertError.message;
          }
        }
        
        throw new Error(errorMessage);
      }

      // 4. หักเครดิต 5 เครดิต
      const { error: creditError } = await (supabase as any)
        .from('profiles')
        .update({ credits: currentCredits - 5 })
        .eq('id', userId);

      if (creditError) {
        console.error("Error deducting credits:", creditError);
        // ถ้าหักเครดิตไม่สำเร็จ ให้ลบงานที่เพิ่มไปด้วย
        if (insertedJob?.id) {
          await (supabase as any).from('jobs').delete().eq('id', insertedJob.id);
        }
        throw new Error("ไม่สามารถหักเครดิตได้ กรุณาลองใหม่อีกครั้ง");
      }

      // 5. บันทึกการหักเครดิตใน credit_logs
      const { error: logError } = await (supabase as any)
        .from('credit_logs')
        .insert([{
          user_id: userId,
          amount: -5,
          action_type: 'spent',
          description: `หักเครดิตจากการลงประกาศงาน: ${newJob.instrument}`,
        }]);

      if (logError) {
        console.error("Error logging credit:", logError);
        // ไม่ throw error เพราะงานบันทึกสำเร็จแล้ว แค่ log ไม่สำเร็จ
      }

      // 6. Refresh jobs list
      await fetchJobs();
      
    } catch (err: any) {
      console.error("Submission Error:", err);
      // Throw error เพื่อให้ SearchForm แสดง error message
      throw err;
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
    return (Date.now() - jobTime) < (3 * 24 * 60 * 60 * 1000);
  });

  // ✅ หาก isLoading เป็น true ให้แสดงหน้า Loading เปล่าๆ ก่อน
  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
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
          <Toaster />
          <Sonner />
          <AuthPage />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // ✅ แสดงหน้าหลักทันทีเมื่อมี session ไม่ต้องรอ jobs
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col overflow-x-hidden">
            <Navbar userId={session?.user?.id || null} />
            
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

              // ✅ แบบใหม่: ใครก็เข้าได้ (แต่ตอนกดบันทึกงาน ระบบจะถาม login อีกทีตามที่คุณเขียนไว้)
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
              <Route path="/join" element={<MusicianSignup onBack={() => window.history.back()} />} />
              <Route path="/about" element={<AboutSection onBack={() => window.history.back()} />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <Footer />
            <CreditWidget userId={session?.user?.id || null} />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;