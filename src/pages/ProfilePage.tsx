import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, MessageCircle, Camera, Trash2, MapPin, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  line_id: string | null;
  avatar_url: string | null;
  credits: number;
}

interface Job {
  id: string;
  instrument: string;
  location: string;
  province: string;
  duration: string;
  budget: string;
  created_at: string;
}

const ProfilePage = ({ userId, onDeleteJob }: { userId: string; onDeleteJob: (id: string) => Promise<void> }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    line_id: "",
  });

  // โหลดข้อมูลโปรไฟล์
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", userId)
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
          });
        } else {
          // ถ้ายังไม่มีโปรไฟล์ ให้สร้างใหม่
          const { data: newProfile, error: insertError } = await (supabase as any)
            .from("profiles")
            .insert([{ id: userId, credits: 25 }])
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile);
          }
        }
      } catch (err) {
        console.error("System Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
      fetchMyJobs();
    }
  }, [userId]);

  // โหลดงานที่ผู้ใช้ลงประกาศเอง
  const fetchMyJobs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("jobs")
        .select("*")
        .eq("user_id", userId)
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

  // อัปโหลดรูปโปรไฟล์
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "ไฟล์ใหญ่เกินไป", description: "กรุณาเลือกไฟล์ขนาดไม่เกิน 5MB", variant: "destructive" });
      return;
    }

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith("image/")) {
      toast({ title: "รูปแบบไฟล์ไม่ถูกต้อง", description: "กรุณาเลือกรูปภาพเท่านั้น", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      // สร้าง path สำหรับเก็บไฟล์ (เก็บใน folder ตาม user_id เพื่อให้ตรงกับ RLS policy)
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // อัปโหลดไฟล์ไปยัง Supabase Storage
      // ต้องสร้าง bucket ชื่อ "avatars" ก่อนใน Supabase Storage (รัน create_storage_bucket.sql)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({ title: "อัปโหลดไม่สำเร็จ", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        return;
      }

      // ดึง public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // อัปเดต avatar_url ใน profiles
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) {
        console.error("Update error:", updateError);
        toast({ title: "อัปเดตไม่สำเร็จ", description: "ไม่สามารถบันทึก URL รูปภาพได้", variant: "destructive" });
      } else {
        toast({ title: "อัปโหลดสำเร็จ", description: "อัปเดตรูปโปรไฟล์แล้ว" });
        // อัปเดต state
        if (profile) {
          setProfile({ ...profile, avatar_url: publicUrl });
        }
      }
    } catch (err) {
      console.error("System Error:", err);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // บันทึกข้อมูลโปรไฟล์
  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          line_id: formData.line_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Update error:", error);
        toast({ title: "บันทึกไม่สำเร็จ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "บันทึกสำเร็จ", description: "อัปเดตข้อมูลโปรไฟล์แล้ว" });
        // อัปเดต state
        if (profile) {
          setProfile({
            ...profile,
            full_name: formData.full_name || null,
            phone: formData.phone || null,
            line_id: formData.line_id || null,
          });
        }
      }
    } catch (err) {
      console.error("System Error:", err);
      toast({ title: "เกิดข้อผิดพลาด", variant: "destructive" });
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
          <h1 className="text-xl font-bold flex-1">โปรไฟล์ของฉัน</h1>
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
            </div>

            {/* ฟอร์มแก้ไขข้อมูล */}
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
                    <span className="text-xl font-bold text-orange-500">{profile.credits || 0} เครดิต</span>
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
          </CardContent>
        </Card>

        {/* ส่วน My Jobs List */}
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
                        <span className="font-semibold text-foreground">งบประมาณ: {job.budget}</span>
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
      </main>
    </div>
  );
};

export default ProfilePage;
