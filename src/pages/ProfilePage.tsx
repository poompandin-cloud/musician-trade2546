import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Phone, MessageCircle, Camera, Trash2, MapPin, Timer, Share2, Video, Plus, X, Star, LogOut, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRealTimeCredits } from "@/services/realTimeCreditService";
import HuskyAnimation from '@/components/ui/HuskyAnimation';
import SearchForm from '@/components/SearchForm';
import DemoWrapper from '@/components/DemoWrapper';
import { ContinuousCalendar } from '@/components/ContinuousCalendar';
import { JobModal } from '@/components/JobModal';
import { Maximize2 } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  line_id: string | null;
  avatar_url: string | null;
  credits: number;
  received_tokens?: number;
  prestige_points?: number;
  video_urls?: string[] | null;
  instruments?: string[] | null
  province?: string | null;
}

interface Job {
  id: string;
  instrument: string;
  location: string;
  province: string;
  duration: string;
  budget: string;
  created_at: string;
  status?: 'open' | 'closed' | null;
  confirmed_applicant_id?: string | null;
  jobs?: {
    instrument: string;
    location: string;
    province: string;
    duration: string;
    budget: string;
  };
  applicant_id?: string;
}

// เพิ่ม interface สำหรับงานในปฏิทิน
interface CalendarJob {
  id: string;
  title: string;
  starttime: string; // ✅ เปลี่ยนเป็นตัวเล็กให้ตรงกับ Database
  endtime: string;   // ✅ เปลี่ยนเป็นตัวเล็กให้ตรงกับ Database
  location: string;
  date: string; // format: "DD/MM/YYYY"
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
  reviewer_id?: string;
}

const ProfilePage = ({ currentUserId, onDeleteJob }: { currentUserId: string; onDeleteJob: (id: string) => Promise<void> }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { toast, dismiss } = useToast();
  
  // รายการเครื่องดนตรีสำหรับ dropdown
  const instruments = [
    { value: "guitar-acoustic", label: "กีตาร์โปร่ง" },
    { value: "guitar-electric", label: "กีตาร์ไฟฟ้า" },
    { value: "bass", label: "เบส" },
    { value: "drums-kit", label: "กลองชุด" },
    { value: "keyboard-piano", label: "เปียโน" },
    { value: "keyboard-synth", label: "คีย์บอร์ด/ซินธิไซเซอร์" },
    { value: "vocal-lead", label: "นักร้องนำ" },
    { value: "vocal-backup", label: "นักร้องประสาน" },
    { value: "saxophone", label: "แซกโซโฟน" },
    { value: "violin", label: "ไวโอลิน" },
    { value: "trumpet", label: "ทรัมเป็ต" },
    { value: "flute", label: "ฟลุต" },
    { value: "ukulele", label: "อูคูเลเล่" }, // ✅ เพิ่มอูคูเลเล่
    { value: "harmonica", label: "หมอนิกา" }, // ✅ เพิ่มหมอนิกา
    { value: "drum-electric", label: "กลองไฟฟ้า" }, // ✅ เพิ่มกลองไฟฟ้า
    { value: "acoustic-guitar", label: "กีตาร์อะคูสติก" }, // ✅ แก้ไขคำสะกด
  ];

  // State สำหรับจัดการเครื่องดนตรีที่เลือก
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);

  // รายการจังหวัด
  const provinces = [
    "กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "นครปฐม", "สมุทรสาคร", 
    "พระนครศรีอยุธยา", "สระบุรี", "ลพบุรี", "ชลบุรี (พัทยา)", "ระยอง", "จันทบุรี", 
    "เชียงใหม่", "เชียงราย", "พิษณุโลก", "นครสวรรค์", "ขอนแก่น", "นครราชสีมา", 
    "อุดรธานี", "ภูเก็ต", "สุราษฎร์ธานี", "สงขลา (หาดใหญ่)"
  ];
  
  // userId คือ id ของโปรไฟล์ที่กำลังดู (จาก URL หรือ currentUserId)
  const profileUserId = id || currentUserId;
  const isOwner = profileUserId === currentUserId;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [confirmedApplications, setConfirmedApplications] = useState<Job[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  
  // เพิ่ม state สำหรับงานในปฏิทิน
  const [calendarJobs, setCalendarJobs] = useState<CalendarJob[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [editingJob, setEditingJob] = useState<CalendarJob[]>([]);
  const [isFullscreenCalendar, setIsFullscreenCalendar] = useState(false); // เพิ่ม state สำหรับ fullscreen calendar
  
  // ดึงข้อมูลงานจาก Supabase สำหรับเจ้าของโปรไฟล์
  const fetchCalendarJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', profileUserId)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Error fetching calendar jobs:', error);
        setCalendarJobs([]);
      } else {
        // ✅ แปลงข้อมูลจาก DB ให้ตรงกับ interface CalendarJob
        const transformedData = (data || []).map(job => ({
          id: job.id,
          title: job.instrument, // ✅ แปลงจาก instrument เป็น title
          starttime: job.time,   // ✅ แปลงจาก time เป็น starttime
          endtime: job.time,    // ✅ ใช้ time เดียวกัน
          location: job.location || '',
          date: job.date,
        }));
        
        setCalendarJobs(transformedData);
      }
    } catch (err) {
      console.error('Error:', err);
      setCalendarJobs([]);
    }
  };

  useEffect(() => {
    // ดึงข้อมูลงานจาก Supabase สำหรับเจ้าของโปรไฟล์เสมอ
    fetchCalendarJobs();
  }, [profileUserId]);
  
  // ฟังก์ชันสำหรับจัดการงานในปฏิทิน
  const handleDateClick = (day: number, month: number, year: number) => {
    const dateStr = `${day}/${month + 1}/${year}`;
    setSelectedDate(dateStr);
    
    // ตรวจสอบสิทธิ์ของผู้ใช้
    if (!isOwner) {
      // ✅ ถ้าไม่ใช่เจ้าของโปรไฟล์ ให้เปิด Modal แบบ Read-only และแสดงเฉพาะออกมาเป็นแถบสีฟ้าอย่างเดียว
      const jobsOnDate = calendarJobs.filter(job => job.date === dateStr);
      setEditingJob(jobsOnDate);
      setIsModalOpen(true);
    } else {
      // ✅ ถ้าเป็นเจ้าของ ทำงานปกติ
      const jobsOnDate = calendarJobs.filter(job => job.date === dateStr);
      
      // เปิด Modal พร้อมข้อมูลเก่า แต่ไม่ว่างานเก่าจะหายไป
      setEditingJob(jobsOnDate);
      setIsModalOpen(true);
    }
  };

 const handleSaveJob = async (jobs: CalendarJob[]) => {
    if (!isOwner) return;

    try {
      // 1. ส่งข้อมูลไปที่ 'jobs' ตามโครงสร้าง DB ใหม่
      for (const job of jobs) {
        // ✅ ห้ามส่งฟิลด์ id เด็ดขาดถ้าเป็นงานใหม่
        const isTempJob = job.id.startsWith('temp_');
        
        // ✅ สร้าง Object สำหรับบันทึก โดยไม่รวม id ถ้าเป็นงานใหม่
        const jobData = {
          // ✅ ห้ามส่ง id ถ้าเป็นงานใหม่ให้ Identity column ทำงาน
          ...(isTempJob ? {} : { id: job.id }),
          // ✅ คอลัมน์ตามโครงสร้าง DB ใหม่
          user_id: profileUserId,
          instrument: job.title, // ✅ เปลี่ยนจาก title เป็น instrument
          time: job.starttime,   // ✅ เปลี่ยนจาก starttime เป็น time
          date: job.date,
          job_type: 'calendar', // ✅ เพิ่ม job_type เพื่อป้องกันการแสดงผลปนกับงานประกาศ
          lineId: '', // ✅ เพิ่มคอลัมน์ lineId
          status: 'active', // ✅ เพิ่มคอลัมน์ status
        };

        console.log('กำลังบันทึกข้อมูล:', jobData); // Debug log

        const { error } = await supabase
          .from('jobs')
          .upsert(jobData);

        if (error) {
          console.error('Supabase Error:', error); // ✅ Log แบบละเอียด
          throw error;
        }
      }

      // ✅ หลัง .upsert() สำเร็จ เรียก fetchCalendarJobs() ทันที
      await fetchCalendarJobs();

      setIsModalOpen(false); // ปิดหน้าต่างบันทึก
      console.log("บันทึกสำเร็จและ Sync เรียบร้อย!");

    } catch (err) {
      console.error('Error saving job:', err);
      console.error('Error details:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      });
      alert(`บันทึกลงฐานข้อมูลไม่สำเร็จ: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteCalendarJob = async (jobId: string) => {
    if (!isOwner) {
      return; // ไม่ให้ลบถ้าไม่ใช่เจ้าของ
    }
    
    setCalendarJobs(prev => prev.filter(job => job.id !== jobId));
    setEditingJob(prev => prev.filter(job => job.id !== jobId));
    
    // ลบข้อมูลจาก Supabase
    try {
      const { error } = await supabase
        .from('jobs') // ✅ ต้องเป็น 'jobs'
        .delete()
        .eq('id', jobId);
        
      if (error) {
        console.error('Error deleting job:', error);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };
  
  // ✅ ใช้ Real-time Credits สำหรับเจ้าของโปรไฟล์เท่านั้น
  const { credits: realTimeCredits } = useRealTimeCredits(isOwner ? currentUserId : null);
  
  const [formData, setFormData] = useState({
    full_name: "",
phone: "",
line_id: "",
instruments: "",
province: "",
});

  const [videoInput, setVideoInput] = useState("");
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // ฟังก์ชันสำหรับจัดการเครื่องดนตรี
  const handleInstrumentSelect = (instrumentValue: string) => {
    console.log("handleInstrumentSelect called with:", instrumentValue); // ✅ Debug log
    console.log("Current selectedInstruments:", selectedInstruments); // ✅ Debug log
    
    // ✅ เช็คว่าค่านั้นมีอยู่ใน Array หรือยัง
    if (!selectedInstruments.includes(instrumentValue)) {
      // ✅ ถ้ายังไม่มีให้ push เข้าไปใน State
      const newSelectedInstruments = [...selectedInstruments, instrumentValue];
      console.log("New selectedInstruments:", newSelectedInstruments); // ✅ Debug log
      setSelectedInstruments(newSelectedInstruments);
      
      // ✅ Sync กับ Profile - อัปเดต formData ให้ตรงกับ selectedInstruments
      const instrumentsString = newSelectedInstruments.join(',');
      setFormData(prev => ({
        ...prev,
        instruments: instrumentsString
      }));
      
      // ✅ อัปเดต profile state ทันที
      if (profile) {
        setProfile({
          ...profile,
          instruments: newSelectedInstruments // ✅ ใช้ array ไม่ใช่ string
        });
      }
      
      console.log("เลือกเครื่องดนตรี:", getInstrumentLabel(instrumentValue));
      console.log("รายการทั้งหมด:", newSelectedInstruments.map(getInstrumentLabel));
      console.log("String สำหรับบันทึก:", instrumentsString);
      
    } else {
      console.log("เครื่องดนตรีนี้เลือกแล้ว:", getInstrumentLabel(instrumentValue));
    }
    // ✅ ไม่ต้องปิด dropdown เพราะใช้ select element
    // setShowInstrumentDropdown(false);
  };

  const handleInstrumentRemove = (instrumentValue: string) => {
    // การลบข้อมูล - ลบออกจากรายการ
    const newSelectedInstruments = selectedInstruments.filter(inst => inst !== instrumentValue);
    setSelectedInstruments(newSelectedInstruments);
    
    // Sync กับ Profile - อัปเดต formData และ profile state
    const instrumentsString = newSelectedInstruments.join(',');
    setFormData(prev => ({
      ...prev,
      instruments: instrumentsString
    }));
    
    // อัปเดต profile state ทันที
    if (profile) {
      setProfile({
        ...profile,
        instruments: newSelectedInstruments // ✅ ใช้ array ไม่ใช่ string
      });
    }
    
    console.log("ลบเครื่องดนตรี:", getInstrumentLabel(instrumentValue));
    console.log("รายการที่เหลือ:", newSelectedInstruments.map(getInstrumentLabel));
    console.log("String สำหรับบันทึก:", instrumentsString);
  };

  const getInstrumentLabel = (value: string) => {
    const instrument = instruments.find(inst => inst.value === value);
    return instrument ? instrument.label : value;
  };

  // แปลง selectedInstruments เป็น string สำหรับบันทึก
  const instrumentsToString = () => {
    return selectedInstruments.join(',');
  };

  // แปลง string จาก DB เป็น array เมื่อโหลดข้อมูล
  const stringToInstruments = (instrumentsStr: string) => {
    if (!instrumentsStr) return [];
    return instrumentsStr.split(',').filter(inst => inst.trim());
  };

  // โหลดข้อมูลโปรไฟล์
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", profileUserId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching profile:", error);
          toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้", variant: "destructive" });
        } else if (data) {
          setProfile(data);
          setFormData({
  full_name: data.full_name || "",
  phone: data.phone || "",
  line_id: data.line_id || "",
  instruments: Array.isArray(data.instruments) ? data.instruments.join(',') : (data.instruments || ""), // ✅ รองรับทั้ง array และ string
  province: data.province || "",
});
          // ✅ โหลดเครื่องดนตรีที่เลือกจาก DB
          const instrumentsArray = Array.isArray(data.instruments) 
            ? data.instruments 
            : stringToInstruments(data.instruments || "");
          setSelectedInstruments(instrumentsArray);
        } else {
          // ถ้ายังไม่มีโปรไฟล์ และเป็นเจ้าของ ให้สร้างใหม่
          if (isOwner) {
            const { data: newProfile, error: insertError } = await (supabase as any)
              .from("profiles")
              .insert([{ id: profileUserId, credits: 25 }])
              .select()
              .single();

            if (!insertError && newProfile) {
              setProfile(newProfile);
            }
          }
        }
      } catch (err) {
        console.error("System Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (profileUserId) {
      fetchProfile();
      if (isOwner) {
        fetchMyJobs();
        fetchConfirmedApplications();
        fetchReceivedReviews();
      }
    }
  }, [profileUserId, isOwner]);

  // ปิด dropdown เมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showInstrumentDropdown) {
        setShowInstrumentDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInstrumentDropdown]);

  // โหลดงานที่ผู้ใช้ลงประกาศเอง
  const fetchMyJobs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("jobs")
        .select("*")
        .eq("user_id", profileUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error);
      } else if (data) {
        setMyJobs(data);
      }
    } catch (err) {
      console.error("System Error:", err);
    }
  };

  // ฟังก์ชันแชร์โปรไฟล์
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${profileUserId}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.full_name || 'โปรไฟล์'} - snowguin`,
        text: `ดูโปรไฟล์ของ ${profile?.full_name || 'นักดนตรี'}`,
        url: profileUrl,
      }).catch((err) => console.error("Error sharing:", err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(profileUrl);
      toast({ title: "คัดลอกลิงก์แล้ว", description: "ลิงก์โปรไฟล์ถูกคัดลอกไปยังคลิปบอร์ดแล้ว" });
    }
  };

  // เพิ่มวิดีโอ (อัปโหลดไฟล์)
  const handleAddVideo = async () => {
    if (!videoFile) {
      toast({ title: "กรุณาเลือกไฟล์วิดีโอ", variant: "destructive" });
      return;
    }

    // ตรวจสอบขนาดไฟล์ (จำกัด 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (videoFile.size > maxSize) {
      toast({ 
        title: "ไฟล์ใหญ่เกินไป", 
        description: "สามารถอัปโหลดวิดีโอได้สูงสุด 50MB เท่านั้น", 
        variant: "destructive" 
      });
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
    if (!allowedTypes.includes(videoFile.type)) {
      toast({ 
        title: "ประเภทไฟล์ไม่รองรับ", 
        description: "รองรับไฟล์วิดีโอ: MP4, AVI, MOV, WMV, WebM", 
        variant: "destructive" 
      });
      return;
    }

    // ดึง video_urls จาก profile
    let currentVideos: string[] = [];
    if (Array.isArray(profile?.video_urls)) {
      currentVideos = profile.video_urls;
    } else if (profile?.video_urls) {
      try {
        currentVideos = Array.isArray(profile.video_urls) ? profile.video_urls : [];
      } catch {
        currentVideos = [];
      }
    }

    // ตรวจสอบจำนวนวิดีโอปัจจุบัน (จำกัด 3 คลิป)
    if (currentVideos.length >= 3) {
      toast({ 
        title: "เพิ่มวิดีโอไม่ได้", 
        description: "สามารถเพิ่มวิดีโอได้สูงสุด 3 คลิปเท่านั้น", 
        variant: "destructive" 
      });
      return;
    }

    setUploadingVideo(true);
    try {
     // --- แก้ไขในฟังก์ชัน handleAddVideo ---

// 1. สร้างชื่อไฟล์ใหม่เพื่อรองรับภาษาไทย (ใส่ไว้ก่อนบรรทัด .upload)
const fileExt = videoFile.name.split('.').pop();
const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
// ตัด ${profileUserId}/ ออก ให้เหลือแค่ชื่อไฟล์เพียวๆ
const fullPath = `${fileName}`;
// 2. ปรับการอัปโหลดให้ใช้ fullPath
const { data: uploadData, error: uploadError } = await (supabase as any)
  .storage
  .from('profile-videos')
  .upload(fullPath, videoFile, { // <-- เปลี่ยนจากชื่อไฟล์เดิม เป็น fullPath
    contentType: videoFile.type,
    upsert: false
  });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({ title: "อัปโหลดไม่สำเร็จ", variant: "destructive" });
        return;
      }

      // 1. ดึง Public URL ของไฟล์ที่เพิ่งอัปโหลด
    // ✅ ให้พี่ลองเปลี่ยนเป็นแบบนี้ (ลบ fullPath ออกแล้วใส่แค่ fileName):
// ใช้ fileName ไปเลยตรงๆ
const { data: urlData } = supabase.storage
  .from('profile-videos')
  .getPublicUrl(fileName);
      // 2. รับค่า URL มา (ประกาศแค่ครั้งเดียวพอ!)
      const videoUrl = urlData.publicUrl;
      
      // 3. เตรียมรายการวิดีโอใหม่ โดยเอาของใหม่ไปต่อท้ายของเดิม
      const newVideos = [...(profile?.video_urls || []), videoUrl];

      // 4. อัปเดตข้อมูลลง Database (ตาราง profiles)
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ video_urls: newVideos })
        .eq("id", profileUserId);

      // 5. เช็คผลลัพธ์
      if (updateError) {
        console.error("Error updating videos:", updateError);
        throw updateError;
      } else {
        // อัปโหลดสำเร็จ -> อัปเดต State หน้าจอให้วิดีโอเด้งขึ้นมาทันที
        toast({ title: "อัปโหลดวิดีโอสำเร็จ" });
        
        if (profile) {
          setProfile({ ...profile, video_urls: newVideos as any });
        }
        
        // ล้างสถานะการเลือกไฟล์และการเปิดช่อง Input
        setVideoFile(null);
        setShowVideoInput(false);
      }
    } catch (err) {
      console.error("System Error:", err);
      toast({ 
        title: "อัปโหลดวิดีโอไม่สำเร็จ", 
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive" 
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  // ลบวิดีโอ
  const handleRemoveVideo = async (index: number) => {
    // ดึง video_urls จาก profile
    // ดึง video_urls จาก profile (รองรับทั้ง string[] และ JSONB)
    let currentVideos: string[] = [];
    if (Array.isArray(profile?.video_urls)) {
      currentVideos = profile.video_urls;
    } else if (profile?.video_urls) {
      try {
        currentVideos = Array.isArray(profile.video_urls) ? profile.video_urls : [];
      } catch {
        currentVideos = [];
      }
    }

    const newVideos = currentVideos.filter((_, i) => i !== index);

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ video_urls: newVideos })
        .eq("id", profileUserId);

      if (error) {
        console.error("Error removing video:", error);
        let errorMessage = "ลบวิดีโอไม่สำเร็จ";
        
        // ตรวจสอบประเภทของ error และแสดงข้อความที่เหมาะสม
        if (error.code === '23505') {
          errorMessage = "ข้อมูลซ้ำกันหรือเกินขีดจำกัด";
        } else if (error.code === '23514') {
          errorMessage = "ข้อมูลไม่ถูกต้องตามรูปแบบ";
        } else if (error.code === '42501') {
          errorMessage = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้";
        } else if (error.code === '42703') {
          errorMessage = "ไม่พบคอลัมน์ 'video_urls' กรุณาติดต่อผู้ดูและรัน migration";
        } else if (error.message && error.message.includes('column "video_urls" does not exist')) {
          errorMessage = "ฐานข้อมูลยังไม่พร้อม กรุณารัน migration ใน Supabase";
        } else if (error.message) {
          errorMessage = `เกิดข้อผิดพลาด: ${error.message}`;
        }
        
        toast({ 
          title: errorMessage, 
          description: error.code === '42703' ? "กรุณาติดต่อผู้ดูและรัน SQL: supabase/add_video_urls_column.sql" : "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive" 
        });
      } else {
        toast({ title: "ลบวิดีโอสำเร็จ" });
        setProfile({ ...profile!, video_urls: newVideos as any });
      }
    } catch (err) {
      console.error("System Error:", err);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // แปลง YouTube URL เป็น embed URL (ปรับปรุง regex ให้ครบถ้วน)
  const getEmbedUrl = (url: string) => {
    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11,})(?:[&?].*)?$/;
    const match = url.match(youtubeRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    // Facebook video - ใช้ original URL
    return url;
  };

  // ฟังก์ชันสำหรับคำนวณระดับ prestige (1,000 แต้มเต็ม)
  const getPrestigeLevel = (points: number = 100) => {
    // แบ่งเป็น 4 ระดับ ตามขีดที่กำหนด
    if (points >= 900) return { level: "คุณภาพ", color: "bg-purple-500", textColor: "text-purple-600", progress: (points / 1000) * 100 };
    if (points >= 600) return { level: "ยอดเยี่ยม", color: "bg-blue-500", textColor: "text-blue-600", progress: (points / 1000) * 100 };
    if (points >= 300) return { level: "กลางๆ", color: "bg-green-500", textColor: "text-green-600", progress: (points / 1000) * 100 };
    if (points >= 100) return { level: "เริ่มต้น", color: "bg-orange-500", textColor: "text-orange-600", progress: (points / 1000) * 100 };
    return { level: "เริ่มต้น", color: "bg-orange-500", textColor: "text-orange-600", progress: (points / 1000) * 100 };
  };

  // คำนวณตำแหน่งของ milestones (แบ่งเป็น 4 ช่วงเท่าๆ กัน)
  const milestones = [
    { points: 100, label: "เริ่มต้น", position: 10 },   // 10% (100/1000)
    { points: 300, label: "กลางๆ", position: 30 },     // 30% (300/1000)
    { points: 600, label: "ยอดเยี่ยม", position: 60 }, // 60% (600/1000)
    { points: 900, label: "คุณภาพ", position: 90 }     // 90% (900/1000)
  ];

  // อัปโหลดรูปโปรไฟล์
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "ไฟล์ใหญ่เกินไป", 
        description: `ขนาดไฟล์: ${(file.size / 1024 / 1024).toFixed(2)} MB (สูงสุด 5MB)`, 
        variant: "destructive" 
      });
      return;
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!file.type.startsWith("image/") || !allowedTypes.includes(file.type)) {
      toast({ 
        title: "รูปแบบไฟล์ไม่ถูกต้อง", 
        description: `รองรับเฉพาะ: JPG, PNG, WebP, GIF (ไฟล์ปัจจุบัน: ${file.type || 'ไม่ทราบ'})`, 
        variant: "destructive" 
      });
      return;
    }

    // ตรวจสอบว่าเป็นเจ้าของโปรไฟล์หรือไม่
    if (!isOwner) {
      toast({ 
        title: "ไม่มีสิทธิ์", 
        description: "คุณสามารถอัปโหลดรูปโปรไฟล์ของตัวเองเท่านั้น", 
        variant: "destructive" 
      });
      return;
    }

    setUploading(true);

    try {
     // 1. สร้างชื่อไฟล์ใหม่ โดยใช้เวลาปัจจุบัน (Timestamp) มาทำเป็นชื่อ
// วิธีนี้จะช่วยให้ชื่อไฟล์เป็นภาษาอังกฤษเสมอ แม้ไฟล์ต้นฉบับจะเป็นภาษาไทยครับ
// 1. สร้างชื่อไฟล์ใหม่ให้เป็นภาษาอังกฤษ/ตัวเลขเสมอ (แก้ปัญหาภาษาไทย)
const fileExt = videoFile.name.split('.').pop();
const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
const fullPath = `${profileUserId}/${fileName}`; // ใช้ตัวแปรนี้ตอน .upload()
// 2. ตอนอัปโหลด ใช้ cleanFileName แทนชื่อเดิม
const { data: uploadData, error: uploadError } = await (supabase as any)
  .storage
  .from('profile-videos')
  .upload(fullPath, videoFile, {
    contentType: videoFile.type,
    upsert: false
  });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        
        // แปลง error message ให้ละเอียดขึ้น (ยังคงตรวจสอบ error ทั่วไป)
        let errorMessage = "ไม่ทราบสาเหตุ";
        let errorTitle = "อัปโหลดไม่สำเร็จ";

        if (uploadError.message) {
          errorMessage = uploadError.message;
          
          // ตรวจสอบประเภท error จาก message
          if (uploadError.message.includes("policy") || uploadError.message.includes("permission") || uploadError.message.includes("denied")) {
            errorTitle = "ไม่มีสิทธิ์อัปโหลด";
            errorMessage = "RLS Policy ปฏิเสธการอัปโหลด กรุณาตรวจสอบ Policy ใน Supabase Storage";
          } else if (uploadError.message.includes("size") || uploadError.message.includes("too large")) {
            errorTitle = "ไฟล์ใหญ่เกินไป";
            errorMessage = "ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกรูปภาพที่เล็กกว่า";
          } else if (uploadError.message.includes("network") || uploadError.message.includes("timeout")) {
            errorTitle = "เชื่อมต่อไม่สำเร็จ";
            errorMessage = "เกิดปัญหากับเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต";
          }
        }

        toast({ 
          title: errorTitle, 
          description: errorMessage, 
          variant: "destructive" 
        });
        setUploading(false);
        return;
      }

      // ดึง public URL
      // 2. ตอนสั่ง getPublicUrl (บรรทัดที่ 758 ที่พี่ติด Error)
// ให้เปลี่ยนจาก filePath เป็น fullPath ตามที่เราตั้งชื่อไว้ข้างบนครับ
const { data: urlData } = supabase.storage
  .from("avatars") // หรือ "profile-videos" ตามที่พี่ใช้งาน
  .getPublicUrl(fullPath); // เปลี่ยนตรงนี้ให้เป็น fullPath ครับพี่!
      if (!urlData?.publicUrl) {
        toast({ 
          title: "ไม่สามารถสร้าง URL", 
          description: "อัปโหลดไฟล์สำเร็จ แต่ไม่สามารถสร้าง URL ได้", 
          variant: "destructive" 
        });
        setUploading(false);
        return;
      }

      const publicUrl = urlData.publicUrl;

      // อัปเดต avatar_url ใน profiles
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profileUserId);

      if (updateError) {
        console.error("Update error details:", updateError);
        
        let errorMessage = "ไม่ทราบสาเหตุ";
        if (updateError.message) {
          errorMessage = updateError.message;
          
          if (updateError.message.includes("policy") || updateError.message.includes("permission")) {
            errorMessage = "RLS Policy ปฏิเสธการอัปเดต กรุณาตรวจสอบ Policy ในตาราง profiles";
          }
        }

        toast({ 
          title: "อัปเดตไม่สำเร็จ", 
          description: `อัปโหลดไฟล์สำเร็จ แต่ไม่สามารถบันทึก URL: ${errorMessage}`, 
          variant: "destructive" 
        });
      } else {
        // อัปโหลดสำเร็จ - ล้าง error toast ที่อาจแสดงอยู่
        dismiss(); // ล้าง toast ทั้งหมด
        
        toast({ 
          title: "อัปโหลดสำเร็จ", 
          description: "อัปเดตรูปโปรไฟล์แล้ว" 
        });
        
        // อัปเดต state
        if (profile) {
          setProfile({ ...profile, avatar_url: publicUrl });
        }
      }
    } catch (err: any) {
      console.error("System Error details:", err);
      
      let errorMessage = "เกิดข้อผิดพลาดที่ไม่คาดคิด";
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  // ฟังก์ชันสำหรับจัดการเครื่องดนตรี
  const handleAddInstrument = (instrument: { value: string; label: string }) => {
    console.log("Adding instrument:", instrument);
    console.log("Current instruments before:", formData.instruments);
    
   if (!formData.instruments.includes(instrument.value)) {
  const newInstruments = formData.instruments
    ? `${formData.instruments}, ${instrument.value}`
    : instrument.value;

  console.log("New instruments string:", newInstruments);
  setFormData({ ...formData, instruments: newInstruments });
} else {
  console.log("Instrument already exists:", instrument.value);
}
setShowInstrumentDropdown(false);
};


  // ฟังก์ชันสำหรับเพิ่มเครื่องดนตรีแบบพิมพ์เอง
  const handleAddCustomInstrument = (instrumentName: string) => {
    console.log("Adding custom instrument:", instrumentName);
    console.log("Current instruments before:", formData.instruments);
    
    if (!formData.instruments.includes(instrumentName)) {
  const newInstruments = formData.instruments
    ? `${formData.instruments}, ${instrumentName}`
    : instrumentName;

  console.log("New instruments string:", newInstruments);
  setFormData({ ...formData, instruments: newInstruments });
} else {
  console.log("Instrument already exists:", instrumentName);
}
};


  // ฟังก์ชันสำหรับจัดการการพิมพ์เครื่องดนตรี (แบบอัตโนมัติ)
  const handleInstrumentInputChange = (value: string) => {
    // แยกคำด้วย comma หรือ space และเพิ่มเครื่องดนตรีอัตโนมัติ
    const trimmedValue = value.trim();
    if (trimmedValue.includes(',') || trimmedValue.includes(' ')) {
      const newInstrument = trimmedValue.replace(/[, ]+/g, '').trim();
      if (newInstrument) {
        handleAddCustomInstrument(newInstrument);
      }
    }
  };

  const handleRemoveInstrument = (instrumentValue: string) => {
    console.log("Removing instrument:", instrumentValue);
    console.log("Current instruments before:", formData.instruments);
    
    const newInstruments = formData.instruments
  .split(",")
  .map(inst => inst.trim())
  .filter(inst => inst !== instrumentValue)
  .join(", ");

console.log("New instruments after removal:", newInstruments);

    
    setFormData({ 
  ...formData, 
  instruments: newInstruments
});
};


  // บันทึกข้อมูลโปรไฟล์
  const handleSave = async () => {
    setSaving(true);

    try {
      // ✅ ตรวจสอบการบันทึก - แปลง Array เป็น String ให้ถูกต้อง
      const instrumentsString = instrumentsToString();
      console.log("กำลังบันทึกเครื่องดนตรี:", selectedInstruments.map(getInstrumentLabel));
      console.log("String ที่จะบันทึก:", instrumentsString);

      const updateData = {
        full_name: formData.full_name || null,
        phone: formData.phone || null,
        line_id: formData.line_id || null,
        instruments: instrumentsString, // ✅ แปลง array เป็น string คั่นด้วย comma
        province: formData.province || null,
        updated_at: new Date().toISOString(),
      };

      console.log("Saving profile data:", updateData);

      const { data, error } = await (supabase as any)
        .from("profiles")
        .update(updateData)
        .eq("id", profileUserId)
        .select();

      if (error) {
        console.error("Update error details:", error);
        
        // ตรวจสอบประเภทของ error และแสดงข้อความที่เหมาะสม
        let errorMessage = error.message || "ไม่สามารถบันทึกข้อมูลได้";
        let errorTitle = "บันทึกไม่สำเร็จ";
        
        if (error.message?.includes('column "instruments" does not exist')) {
          errorMessage = "ไม่พบคอลัมน์ 'instruments' กรุณารัน SQL Migration: supabase/add_instruments_province_to_profiles.sql";
        } else if (error.message?.includes('column "province" does not exist')) {
          errorMessage = "ไม่พบคอลัมน์ 'province' กรุณารัน SQL Migration: supabase/add_instruments_province_to_profiles.sql";
        } else if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
          errorMessage = "ไม่มีสิทธิ์ในการแก้ไขข้อมูลโปรไฟล์นี้";
        }
        
        toast({ 
          title: errorTitle, 
          description: errorMessage, 
          variant: "destructive" 
        });
      } else {
        console.log("Profile updated successfully:", data);
        toast({ 
          title: "บันทึกสำเร็จ", 
          description: "อัปเดตข้อมูลโปรไฟล์แล้ว" 
        });
        
        // อัปเดต state
        if (profile) {
         setProfile({
  ...profile,
  ...updateData,
  instruments: updateData.instruments
    ? updateData.instruments.split(",").map(i => i.trim())
    : [],
});
}

      }
    } catch (err) {
      console.error("System Error:", err);
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  // ลบงาน
  const handleDeleteJob = async (jobId: string) => {
    const confirmDelete = window.confirm("คุณต้องการลบประกาศงานนี้ใช่หรือไม่?");
    if (!confirmDelete) return;

    try {
      await onDeleteJob(jobId);
      await fetchMyJobs();
      toast({ title: "ลบสำเร็จ", description: "ลบประกาศงานแล้ว" });
    } catch (err) {
      console.error("Delete error:", err);
      toast({ title: "ลบไม่สำเร็จ", variant: "destructive" });
    }
  };

  // ยืนยันการทำงานสำเร็จ
  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    // Only allow closing jobs, not reopening
    if (currentStatus === 'closed') {
      toast({ 
        title: "ไม่สามารถเปิดงานอีกครั้ง", 
        description: "เมื่องานปิดแล้วแล้วไม่สามารถเปิดใหม่อีกครั้ง",
        variant: "destructive" 
      });
      return;
    }
    
    const newStatus = 'closed';
    const confirmMessage = "คุณต้องการปิดรับงานนี้ใช่หรือไม่?";
    
    const confirmComplete = window.confirm(confirmMessage);
    if (!confirmComplete) return;

    try {
      // อัปเดตสถานะงาน
      const { error } = await (supabase as any)
        .from("jobs")
        .update({ 
          status: newStatus
        })
        .eq("id", jobId);

      if (error) {
        console.error("Error updating job status:", error);
        // ตรวจสอบว่า error เกี่ยว่ากับ permissions หรือไม่
        const errorMessage = error.message || "ไม่ทราบสาเหตุ";
        if (errorMessage.includes("permission") || errorMessage.includes("unauthorized") || errorMessage.includes("403")) {
          toast({ 
            title: "ไม่สามารถอัปเดตสถานะ", 
            description: "คุณไม่มีสิทธิ์ในการแก้ไข้ว่างานนี้",
            variant: "destructive" 
          });
        } else if (errorMessage.includes("column") || errorMessage.includes("status")) {
          toast({ 
            title: "เกิดข้อผิดพลาดในฐานข้อมูล", 
            description: "ไม่พบคอลัมน์ 'status' ในตารางงาน",
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "อัปเดตสถานะไม่สำเร็จ", 
            description: errorMessage,
            variant: "destructive" 
          });
        }
        return;
      }

      toast({ 
        title: "ปิดงานสำเร็จ!", 
        description: "งานนี้ปิดรับสมัครแล้ว และจะแสดงในหน้าหลัก" 
      });

      // รีเฟรชข้อมูล
      await fetchMyJobs();
    } catch (err) {
      console.error("Confirm completion error:", err);
      toast({ 
        title: "เกิดข้อผิดพลาด", 
        description: "กรุณาลองใหม่",
        variant: "destructive" 
      });
    }
  };

  // ดึงข้อมูลคนที่ได้รับการยืนยัน
  const fetchConfirmedApplications = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('job_applications')
        .select(`
          *,
          jobs (
            id,
            instrument,
            user_id,
            profiles (
              full_name,
              avatar_url
            )
          )
        `)
        .eq('status', 'confirmed')
        .eq('jobs.user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching confirmed applications:", error);
        return;
      }

      setConfirmedApplications(data || []);
    } catch (error) {
      console.error("Error in fetchConfirmedApplications:", error);
    }
  };

  // ดึงข้อมูลรีวิวที่ได้รับ
  const fetchReceivedReviews = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('reviews')
        .select(`
          *,
          reviewer_profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('reviewee_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching received reviews:", error);
        return;
      }

      // Transform data to include reviewer_profiles
      const transformedData = data?.map(review => ({
        ...review,
        profiles: review.reviewer_profiles
      })) || [];

      setReceivedReviews(transformedData);
    } catch (error) {
      console.error("Error in fetchReceivedReviews:", error);
    }
  };

  // ออกจากระบบ
  const handleLogout = async () => {
    const confirmLogout = window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?");
    if (!confirmLogout) return;

    try {
      // ✅ เคลียร์ Session ออกจากระบบจริงๆ
      await supabase.auth.signOut();
      
      // ✅ เคลียร์ข้อมูลใน localStorage และ sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // ✅ แสดงข้อความสำเร็จ
      toast({ title: "ออกจากระบบสำเร็จ" });
      
      // ✅ ส่งผู้ใช้กลับไปที่หน้า AuthPage ทันที
      navigate("/auth");
    } catch (err) {
      console.error("Logout error:", err);
      toast({ title: "ออกจากระบบไม่สำเร็จ", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับ</span>
          </button>
          
          {/* Husky Animation Logo - Centered */}
          <div className="flex-1 flex justify-center">
            <HuskyAnimation />
          </div>
          
          {isOwner && (
            <button
              onClick={handleShareProfile}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="แชร์โปรไฟล์"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="container py-8 max-w-lg mx-auto px-4 space-y-6">
        {/* ส่วนโปรไฟล์ */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลส่วนตัว</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* รูปโปรไฟล์ */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
                  <AvatarFallback className="bg-orange-100 text-orange-600 text-2xl">
                    {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-600 transition-colors shadow-lg"
                >
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && <p className="text-sm text-muted-foreground">กำลังอัปโหลด...</p>}
              
              {/* Prestige Bar */}
              <div className="w-full max-w-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">ความมืออาชีพ</span>
                  </div>
                  <span className={`text-sm font-bold ${getPrestigeLevel(profile?.received_tokens || 0).textColor}`}>
                    {getPrestigeLevel(profile?.received_tokens || 0).level}
                  </span>
                </div>
                
                {/* Progress Bar Container */}
                <div className="relative">
                  <Progress 
                    value={getPrestigeLevel(profile?.received_tokens || 0).progress} 
                    className="h-3"
                  />
                  
                  {/* Milestone Markers */}
                  <div className="absolute inset-0 flex items-center">
                    {milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${milestone.position}%`, transform: 'translateX(-50%)' }}
                      >
                        {/* Milestone Tick */}
                        <div className="w-0.5 h-4 bg-border"></div>
                        {/* Milestone Label */}
                        <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
                          {milestone.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Current Points Display */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white mix-blend-difference drop-shadow-sm">
                      {profile?.received_tokens || 0} / 1000
                    </span>
                  </div>
                </div>
                
                {/* Points Scale */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>250</span>
                  <span>500</span>
                  <span>750</span>
                  <span>1000</span>
                </div>
              </div>
            </div>

            {/* ฟอร์มแก้ไขข้อมูล - แสดงเฉพาะเจ้าของ */}
            {isOwner ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  ชื่อ-นามสกุล
                </Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="กรุณากรอกชื่อ-นามสกุล"
                  className="rounded-2xl h-12"
                />
              </div>

               <div className="space-y-2">
  <Label className="flex items-center gap-2">
    🎸 เครื่องดนตรีที่เล่น
  </Label>
  
  {/* แสดงรายการที่เลือกแล้วเป็นก้อนๆ (Badges) */}
  <div className="flex flex-wrap gap-2 mb-2">
  {formData.instruments
    .split(",")
    .map(inst => inst.trim())
    .filter(Boolean)
    .map((inst) => (
      <span
        key={inst}
        className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
      >
        {inst}
        <button
          type="button"
          onClick={() =>
            setFormData({
              ...formData,
              instruments: formData.instruments
                .split(",")
                .map(i => i.trim())
                .filter(i => i !== inst)
                .join(", "),
            })
          }
        >
          ✕
        </button>
      </span>
    ))}
</div>


  {/* เครื่องดนตรีที่เล่น */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  เครื่องดนตรีที่เล่น
                </Label>
                
                {/* ✅ เปลี่ยนเป็น Select แบบจังหวัด */}
                <select 
                  className="w-full h-12 rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-orange-500"
                  value=""
                  onChange={(e) => {
                    const instrumentValue = e.target.value;
                    if (instrumentValue && !selectedInstruments.includes(instrumentValue)) {
                      handleInstrumentSelect(instrumentValue);
                    }
                  }}
                >
                  <option value="">เลือกเครื่องดนตรี...</option>
                  {instruments.map((instrument) => (
                    <option 
                      key={instrument.value} 
                      value={instrument.value}
                      disabled={selectedInstruments.includes(instrument.value)}
                    >
                      {instrument.label}
                    </option>
                  ))}
                </select>
                
                {/* ✅ สร้างส่วนแสดง Tags สีส้ม */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedInstruments.map((instrumentValue) => (
                    <span
                      key={instrumentValue}
                      className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {getInstrumentLabel(instrumentValue)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInstrumentRemove(instrumentValue);
                        }}
                        className="ml-1 hover:text-orange-900 font-bold"
                      >
                        [x]
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              {/* จังหวัดที่อยู่ */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  จังหวัดที่อยู่
                </Label>
                <select 
                  className="w-full h-12 rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                >
                  <option value="">เลือกจังหวัด</option>
                  {provinces.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  เบอร์โทรศัพท์
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08xxxxxxxx"
                  className="rounded-2xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Line ID
                </Label>
                <Input
                  value={formData.line_id}
                  onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                  placeholder="กรุณากรอก Line ID"
                  className="rounded-2xl h-12"
                />
              </div>

              {/* แสดงเครดิต */}
              {profile && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">เครดิตคงเหลือ</span>
                    <span className="text-xl font-bold text-orange-500">
                      {isOwner ? realTimeCredits : (profile.credits || 0)} เครดิต
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
              >
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </div>
            </div>
            ) : (
            // แสดงข้อมูลแบบอ่านอย่างเดียวสำหรับผู้เยี่ยมชม
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  ชื่อ-นามสกุล
                </Label>
                <p className="text-foreground">{profile?.full_name || "-"}</p>
              </div>

              {/* เครื่องดนตรีที่เล่น */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">🎸</span>
                  </div>
                  เครื่องดนตรีที่เล่น
                </Label>
                {profile?.instruments ? (
                  <p className="text-foreground">{profile.instruments}</p>
                ) : (
                  <p className="text-foreground">ไม่ได้ระบุเครื่องดนตรี</p>
                )}
              </div>

              {/* จังหวัดที่อยู่ */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  จังหวัดที่อยู่
                </Label>
                <p className="text-foreground">{profile?.province || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  เบอร์โทรศัพท์
                </Label>
                <p className="text-foreground">{profile?.phone || "-"}</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Line ID
                </Label>
                <p className="text-foreground">{profile?.line_id || "-"}</p>
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* ส่วน Video Portfolio */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                วิดีโอตัวอย่างการแสดง
              </CardTitle>
              {isOwner && (
                <Button
                  onClick={() => setShowVideoInput(!showVideoInput)}
                  variant="outline"
                  size="sm"
                  disabled={(() => {
                    let videoUrls: string[] = [];
                    if (Array.isArray(profile?.video_urls)) {
                      videoUrls = profile.video_urls;
                    } else if (profile?.video_urls) {
                      try {
                        videoUrls = Array.isArray(profile.video_urls) ? profile.video_urls : [];
                      } catch {
                        videoUrls = [];
                      }
                    }
                    return videoUrls.length >= 3;
                  })()}
                  className={(() => {
                    let videoUrls: string[] = [];
                    if (Array.isArray(profile?.video_urls)) {
                      videoUrls = profile.video_urls;
                    } else if (profile?.video_urls) {
                      try {
                        videoUrls = Array.isArray(profile.video_urls) ? profile.video_urls : [];
                      } catch {
                        videoUrls = [];
                      }
                    }
                    return videoUrls.length >= 3 ? "opacity-50 cursor-not-allowed" : "";
                  })()}
                  title={(() => {
                    let videoUrls: string[] = [];
                    if (Array.isArray(profile?.video_urls)) {
                      videoUrls = profile.video_urls;
                    } else if (profile?.video_urls) {
                      try {
                        videoUrls = Array.isArray(profile.video_urls) ? profile.video_urls : [];
                      } catch {
                        videoUrls = [];
                      }
                    }
                    return videoUrls.length >= 3 ? "เพิ่มได้สูงสุด 3 วิดีโอ" : "เพิ่มวิดีโอ";
                  })()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มวีดีโอ ({(() => {
                    let videoUrls: string[] = [];
                    if (Array.isArray(profile?.video_urls)) {
                      videoUrls = profile.video_urls;
                    } else if (profile?.video_urls) {
                      try {
                        videoUrls = Array.isArray(profile.video_urls) ? profile.video_urls : [];
                      } catch {
                        videoUrls = [];
                      }
                    }
                    return videoUrls.length;
                  })()}/3)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* ฟอร์มเพิ่มวิดีโอ */}
            {isOwner && showVideoInput && (
              <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <Label>อัปโหลดวีดีโอ</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="video/mp4,video/avi,video/mov,video/wmv,video/webm"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVideoFile(file);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    />
                    {videoFile && (
                      <div className="mt-2 p-2 bg-white rounded-lg border">
                        <p className="text-sm font-medium">{videoFile.name}</p>
                        <p className="text-xs text-gray-500">
                          ขนาด: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    รองรับไฟล์วีดีโอ: MP4, AVI, MOV, WMV, WebM (สูงสุด 50MB)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddVideo}
                    disabled={uploadingVideo || !videoFile}
                    size="sm"
                    className="flex-1"
                  >
                    {uploadingVideo ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        กำลังอัปโหลด...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        อัปโหลดวีดีโอ
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowVideoInput(false);
                      setVideoFile(null);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            )}

            {/* แสดงวิดีโอ */}
            {(() => {
              // ดึง video_urls และแปลงเป็น array
              let videoUrls: string[] = [];
              if (Array.isArray(profile?.video_urls)) {
                videoUrls = profile.video_urls;
              } else if (profile?.video_urls) {
                try {
                  videoUrls = Array.isArray(profile.video_urls) ? profile.video_urls : [];
                } catch {
                  videoUrls = [];
                }
              }

              return videoUrls.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {videoUrls.map((videoUrl: string, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                      <iframe
                        src={getEmbedUrl(videoUrl)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveVideo(index)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="ลบวิดีโอ"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {isOwner ? "ยังไม่มีวิดีโอ เริ่มเพิ่มวิดีโอตัวอย่างการแสดงของคุณได้เลย" : "ยังไม่มีวิดีโอ"}
                </p>
              );
            })()}
          </CardContent>
        </Card>

{/* --- ส่วนปฏิทินแบบ Full Width --- */}
<div className="mt-4 mb-2">
  <label className="block text-sm font-semibold text-gray-800 mb-1">
    🗓️ ตารางงานของฉัน
  </label>
  
  {/* Full Width Calendar - ลดความสูงลงอีก */}
  <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden max-h-[700px] relative">
    <DemoWrapper>
      <div className="pt-1 transform scale-30 origin-top">
        <ContinuousCalendar 
          jobs={calendarJobs}
          onClick={handleDateClick}
          dayMinHeight="min-h-[100px]"
        />
      </div>
    </DemoWrapper>
    
    {/* ปุ่มขยายปฏิทิน - ย้ายมาไว้ขวาล่างของบล็อค */}
    <button
      onClick={() => setIsFullscreenCalendar(true)}
      className="absolute bottom-2 right-2 z-20 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      title="ขยายปฏิทิน"
    >
      <Maximize2 className="w-4 h-4 text-gray-600" />
    </button>
  </div>
</div>

{/* Modal สำหรับเพิ่ม/แก้ไขงาน */}
<JobModal
  isOpen={isModalOpen}
  onClose={() => {
    setIsModalOpen(false);
    setEditingJob([]);
  }}
  onSave={handleSaveJob}
  selectedDate={selectedDate}
  editingJobs={editingJob}
  onDeleteJob={handleDeleteCalendarJob}
  isOwner={isOwner}
/>

{/* Fullscreen Calendar Modal */}
{isFullscreenCalendar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full h-full max-w-6xl max-h-[90vh] shadow-2xl relative overflow-hidden">
      {/* ปุ่มปิด */}
      <button
        onClick={() => setIsFullscreenCalendar(false)}
        className="absolute top-4 right-4 z-30 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
        title="ย่อขนาด"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-800">🗓️ ตารางงานของฉัน (ขยาย)</h2>
      </div>
      
      {/* Calendar Content - Responsive และ Flexible */}
      <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
        
           <div className="w-full max-w-full mx-auto">
             <ContinuousCalendar 
               jobs={calendarJobs}
               onClick={handleDateClick}
               dayMinHeight="min-h-[100px]"
             />
           </div>
        
       </div>
    </div>
  </div>
)}

{/* ส่วน My Jobs List - แสดงเฉพาะเจ้าของ */}
        {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>งานที่ฉันประกาศ</CardTitle>
          </CardHeader>
          <CardContent>
            {myJobs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ยังไม่มีงานที่ประกาศ</p>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => {
                  const isActive = job.created_at
                    ? Date.now() - new Date(job.created_at).getTime() < 3 * 24 * 60 * 60 * 1000
                    : true;

                  return (
                    <div
                      key={job.id}
                      className={`p-4 rounded-2xl border ${
                        isActive ? "bg-card border-border" : "bg-muted/50 border-muted opacity-60"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-orange-500">{job.instrument}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {job.location}, {job.province}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="ลบประกาศ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          <span>{job.duration || "-"}</span>
                        </div>
                        <span className="font-semibold text-foreground break-words text-sm sm:text-base">งบประมาณ: {job.budget}</span>
                      </div>

                      {!isActive && (
                        <p className="text-xs text-muted-foreground italic">ประกาศหมดอายุแล้ว</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        )}

        

        {/* Confirmed Applications Section - แสดงคนที่ได้รับการยืนยัน */}
        {isOwner && confirmedApplications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                คนที่ได้รับการยืนยัน ({confirmedApplications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {confirmedApplications.map((application) => (
                  <div key={application.id} className="p-3 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{application.jobs?.instrument}</p>
                        <p className="text-xs text-muted-foreground">
                          ได้รับการยืนยันเมื่อ {new Date(application.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Button
                          onClick={() => navigate(`/profile/${application.applicant_id}`)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          ดูโปรไฟล์
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Received Reviews Section - แสดงรีวิวที่ได้รับ */}
        {isOwner && receivedReviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                รีวิวที่ได้รับ ({receivedReviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receivedReviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-sm">{review.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                        <p className="text-xs text-muted-foreground">
                          จาก {review.profiles?.full_name || 'ผู้ใช้นิรนาม'} • {new Date(review.created_at).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Button
                          onClick={() => navigate(`/profile/${review.reviewer_id}`)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          ดูโปรไฟล์ผู้รีวิว
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logout Button - แสดงเฉพาะเจ้าของโปรไฟล์ */}
        {isOwner && (
          <div className="mt-6">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full py-4 sm:py-6 text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              ออกจากระบบ
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
