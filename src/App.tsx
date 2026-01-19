import { useState, useEffect } from "react";
import { Auth } from '@supabase/auth-ui-react'; 
import { ThemeSupa } from '@supabase/auth-ui-shared'; 
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import NearbyGigs from "./components/NearbyGigs";
import SearchForm from "./components/SearchForm";
import MusicianSignup from "./components/MusicianSignup";
import AboutSection from "./components/AboutSection";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CreditWidget from "./components/CreditWidget";

const queryClient = new QueryClient();

const App = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null); 

  const fetchJobs = async () => {
    try {
      // ลอง join กับ profiles table โดยใช้ foreign key relationship
      // Supabase จะ join ผ่าน user_id ที่ reference ไปยัง profiles.id
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
      
      if (error) {
        console.error("Error fetching jobs with join:", error);
        // Fallback: ถ้า join ไม่ได้ ให้ดึงข้อมูลแยก (สำหรับกรณีที่ foreign key ยังไม่ได้ตั้งค่า)
        const { data: jobsData, error: jobsError } = await (supabase as any)
          .from('jobs')
          .select('*')
          .order('created_at', { ascending: false });
        
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchJobs();
    return () => subscription.unsubscribe();
  }, []);

  // ฟังก์ชันเพิ่มประกาศงาน (พร้อมเช็ค weekly quota และหักเครดิต)
  const addJob = async (newJob: any) => {
    if (!session) {
      throw new Error("กรุณาเข้าสู่ระบบก่อน");
    }

    const userId = session.user.id;

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
          user_id: userId 
        }])
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting job:", insertError);
        throw new Error("ไม่สามารถบันทึกงานได้");
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">เข้าสู่ระบบนักดนตรี 🎸</h2>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="default"
            providers={[]} 
          />
          <p className="mt-6 text-center text-sm text-gray-400 italic">
            * กรอก Email และตั้งรหัสผ่านเพื่อเริ่มต้นใช้งาน
          </p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Navbar userId={session?.user?.id || null} />
            <Routes>
              <Route path="/" element={<Index jobs={activeJobs} onAddJob={addJob} />} />
              
              <Route 
                path="/profile" 
                element={
                  <ProfilePage 
                    userId={session.user.id} 
                    onDeleteJob={deleteJob}
                  />
                } 
              />
              
              <Route 
                path="/nearby-gigs" 
                element={
                  <NearbyGigs 
                    jobs={activeJobs} 
                    onBack={() => window.history.back()} 
                    onDeleteJob={deleteJob}
                    currentUserId={session.user.id} 
                  />
                } 
              />

              <Route 
                path="/search" 
                element={
                  <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center pt-10">
                    <div className="w-full max-w-md">
                      <button onClick={() => window.history.back()} className="mb-6 text-orange-500 font-bold">← ย้อนกลับ</button>
                      <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">หาคนแทนด่วน 🎵</h2>
                      <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                        <SearchForm 
                          onBack={() => window.history.back()} 
                          onAddJob={addJob}
                          userId={session.user.id}
                        /> 
                      </div>
                    </div>
                  </div>
                } 
              />

              <Route path="/join" element={<MusicianSignup onBack={() => window.history.back()} />} />
              <Route path="/about" element={<AboutSection onBack={() => window.history.back()} />} />
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