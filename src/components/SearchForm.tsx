import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const instruments = [
  { value: "guitar", label: "กีต้าร์" },
  { value: "bass", label: "เบส" },
  { value: "drums", label: "กลอง" },
  { value: "keyboard", label: "คีย์บอร์ด" },
  { value: "vocal", label: "นักร้อง" },
  { value: "saxophone", label: "แซกโซโฟน" },
  { value: "violin", label: "ไวโอลิน" },
];

const provinces = [
  "กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "นครปฐม", "สมุทรสาคร", 
  "พระนครศรีอยุธยา", "สระบุรี", "ลพบุรี", "ชลบุรี (พัทยา)", "ระยอง", "จันทบุรี", 
  "เชียงใหม่", "เชียงราย", "พิษณุโลก", "นครสวรรค์", "ขอนแก่น", "นครราชสีมา", 
  "อุดรธานี", "ภูเก็ต", "สุราษฎร์ธานี", "สงขลา (หาดใหญ่)"
];

interface SearchFormProps {
  onBack: () => void;
  onAddJob: (job: any) => Promise<void>;
  userId: string | null;
}

const SearchForm = ({ onBack, onAddJob, userId }: SearchFormProps) => {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);

  const [formData, setFormData] = useState({
    instrument: "",
    date: "",
    location: "",
    province: "",
    duration: "",
    budget: "",
    lineId: "", 
    phone: ""   
  });

  // โหลดข้อมูลเครดิต
  useEffect(() => {
    const fetchCredits = async () => {
      if (!userId) {
        setLoadingCredits(false);
        return;
      }

      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("credits")
          .eq("id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching credits:", error);
        } else if (data) {
          setCredits(data.credits || 0);
        } else {
          setCredits(25); // Default value
        }
      } catch (err) {
        console.error("System Error:", err);
      } finally {
        setLoadingCredits(false);
      }
    };

    fetchCredits();

    // Subscribe to real-time changes
    if (userId) {
      const channel = supabase
        .channel(`profile:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new && (payload.new as any).credits !== undefined) {
              setCredits((payload.new as any).credits);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const hasEnoughCredits = credits !== null && credits >= 5;
  const isDisabled = loadingCredits || !hasEnoughCredits || isSearching;
// ... (ส่วนบนคงเดิม)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // เช็คเครดิตก่อน submit
    if (!hasEnoughCredits) {
      toast({ 
        title: "เครดิตไม่เพียงพอ", 
        description: "คุณต้องมีเครดิตอย่างน้อย 5 เครดิตเพื่อลงประกาศงาน",
        variant: "destructive" 
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // ส่งข้อมูลโดยใช้ชื่อคอลัมน์ที่ตรงกับฐานข้อมูลของคุณเป๊ะๆ
      const jobData = {
        instrument: formData.instrument,
        date: formData.date,
        location: formData.location,
        province: formData.province,
        duration: formData.duration,
        budget: formData.budget,
        lineId: formData.lineId,
        phone: formData.phone,
        createdAt: new Date().toISOString()
      };

      await onAddJob(jobData);
      toast({ title: "ประกาศงานสำเร็จ!", description: "ข้อมูลติดต่อถูกบันทึกแล้ว และหักเครดิต 5 เครดิต" });
      onBack();
    } catch (error: any) {
      console.error("Error submitting job:", error);
      const errorMessage = error?.message || "เกิดข้อผิดพลาด";
      toast({ 
        title: errorMessage.includes("โควตา") ? "ไม่สามารถลงประกาศได้" : "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsSearching(false);
    }
  };
// ... (ส่วน UI ด้านล่างคงเดิมของคุณเป๊ะๆ)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="max-w-lg mx-auto text-left">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </header>

      <main className="container py-8 max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">ประกาศหาคนแทน</h1>
          <p className="text-muted-foreground text-sm">กรอกข้อมูลให้ครบถ้วน</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-3xl border border-border shadow-sm">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">เครื่องดนตรีที่ต้องการ</Label>
            <select 
              className="w-full h-12 rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-orange-500"
              value={formData.instrument}
              onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
              required
            >
              <option value="">เลือกเครื่องดนตรี</option>
              {instruments.map((i) => <option key={i.value} value={i.label}>{i.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">วันที่</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="rounded-2xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">จังหวัด</Label>
              <select 
                className="w-full h-12 rounded-2xl border border-input bg-background px-4 outline-none focus:ring-2 focus:ring-orange-500"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                required
              >
                <option value="">ระบุจังหวัด</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">สถานที่ / แผนที่ร้าน</Label>
            <Input placeholder="ชื่อร้าน หรือ Google Maps" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="rounded-2xl h-12" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">เวลาที่เล่น</Label>
              <Input placeholder="เช่น 20.00-21.30" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required className="rounded-2xl h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">งบประมาณ</Label>
              <Input type="text" placeholder="ระบุงบประมาณ" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} required className="rounded-2xl h-12" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-border">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-orange-600">ID Line</Label>
              <Input 
                placeholder="ระบุไอดีไลน์" 
                value={formData.lineId} 
                onChange={(e) => setFormData({ ...formData, lineId: e.target.value })} 
                required 
                className="rounded-2xl h-12 border-orange-100 focus:border-orange-500" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-green-600">เบอร์โทรศัพท์</Label>
              <Input 
                type="tel" 
                placeholder="08xxxxxxxx" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                required 
                className="rounded-2xl h-12 border-green-100 focus:border-green-500" 
              />
            </div>
          </div>

          {/* แสดงคำเตือนถ้าเครดิตไม่พอ */}
          {!loadingCredits && !hasEnoughCredits && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>เครดิตไม่เพียงพอ (ต้องการ 5 เครดิต, คุณมี {credits || 0} เครดิต)</span>
            </div>
          )}

          <Button 
            type="submit" 
            className={`w-full h-14 rounded-2xl text-white text-lg font-bold shadow-lg ${
              isDisabled 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-orange-500 hover:bg-orange-600"
            }`}
            disabled={isDisabled}
          >
            {isSearching 
              ? "กำลังประกาศ..." 
              : hasEnoughCredits 
                ? "ประกาศงานทันที (ใช้ 5 เครดิต)" 
                : "เครดิตไม่เพียงพอ"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default SearchForm;