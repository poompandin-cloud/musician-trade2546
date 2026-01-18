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
import NearbyGigs from "./components/NearbyGigs";
import SearchForm from "./components/SearchForm";
import MusicianSignup from "./components/MusicianSignup";
import AboutSection from "./components/AboutSection";

const queryClient = new QueryClient();

const App = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null); 

  const fetchJobs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setJobs(data);
      if (error) console.error("Error fetching jobs:", error);
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

  // ฟังก์ชันเพิ่มประกาศงาน (แก้ไขจุดนี้เพื่อให้บันทึก phone และ lineId ได้จริง)
  const addJob = async (newJob: any) => {
    if (!session) return; 

    try {
      const { error } = await (supabase as any)
        .from('jobs')
        .insert([{
          instrument: newJob.instrument,
          date: newJob.date,
          // time: newJob.time, // หากใน DB ไม่มีคอลัมน์นี้ ข้อมูลจะถูกข้ามไป
          location: newJob.location,
          province: newJob.province,
          duration: newJob.duration,
          budget: newJob.budget,
          // แก้ไขจาก contact เป็น phone และ lineId ตามชื่อคอลัมน์ใน Supabase ของคุณ
          phone: newJob.phone,     
          lineId: newJob.lineId,   
          user_id: session.user.id 
        }]);
      if (!error) await fetchJobs();
    } catch (err) {
      console.error("Submission Error:", err);
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
          <Routes>
            <Route path="/" element={<Index jobs={activeJobs} onAddJob={addJob} />} />
            
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
                      <SearchForm onBack={() => window.history.back()} onAddJob={addJob} /> 
                    </div>
                  </div>
                </div>
              } 
            />

            <Route path="/join" element={<MusicianSignup onBack={() => window.history.back()} />} />
            <Route path="/about" element={<AboutSection onBack={() => window.history.back()} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;