import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle, Search, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const instruments = [
  // กีตาร์
  { value: "guitar-acoustic", label: "กีตาร์โปร่ง", category: "กีตาร์" },
  { value: "guitar-electric", label: "กีตาร์ไฟฟ้า", category: "กีตาร์" },
  { value: "guitar-classical", label: "กีตาร์คลาสสิก", category: "กีตาร์" },
  { value: "guitar-bass", label: "เบส", category: "กีตาร์" },
  { value: "guitar-ukulele", label: "ยูคูเลเล", category: "กีตาร์" },
  
  // คีย์บอร์ด/เปียโน
  { value: "keyboard-piano", label: "เปียโน", category: "คีย์บอร์ด" },
  { value: "keyboard-synth", label: "คีย์บอร์ด/ซินธิไซเซอร์", category: "คีย์บอร์ด" },
  { value: "keyboard-organ", label: "ออร์แกน", category: "คีย์บอร์ด" },
  { value: "keyboard-accordion", label: "แอคคอร์เดียน", category: "คีย์บอร์ด" },
  
  // กลอง
  { value: "drums-kit", label: "กลองชุด", category: "กลอง" },
  { value: "drums-percussion", label: "เพอร์คัสชัน", category: "กลอง" },
  { value: "drums-cajon", label: "คาฮอน", category: "กลอง" },
  { value: "drums-djembe", label: "เจมเบ", category: "กลอง" },
  { value: "drums-bongo", label: "บองโก", category: "กลอง" },
  
  // เครื่องเป่า
  { value: "wind-saxophone", label: "แซกโซโฟน", category: "เครื่องเป่า" },
  { value: "wind-trumpet", label: "ทรัมเป็ต", category: "เครื่องเป่า" },
  { value: "wind-trombone", label: "ทรอมโบน", category: "เครื่องเป่า" },
  { value: "wind-flute", label: "ฟลุต", category: "เครื่องเป่า" },
  { value: "wind-clarinet", label: "คลาริเน็ต", category: "เครื่องเป่า" },
  { value: "wind-oboe", label: "โอโบ", category: "เครื่องเป่า" },
  { value: "wind-harmonica", label: "ฮาร์โมนิกา", category: "เครื่องเป่า" },
  
  // สาย
  { value: "strings-violin", label: "ไวโอลิน", category: "เครื่องสาย" },
  { value: "strings-cello", label: "เชลโล", category: "เครื่องสาย" },
  { value: "strings-viola", label: "วิโอลา", category: "เครื่องสาย" },
  { value: "strings-doublebass", label: "ดับเบิลเบส", category: "เครื่องสาย" },
  { value: "strings-erhu", label: "อี้หู", category: "เครื่องสาย" },
  
  // ร้อง
  { value: "vocal-lead", label: "นักร้องนำ", category: "ร้อง" },
  { value: "vocal-backup", label: "นักร้องประสาน", category: "ร้อง" },
  { value: "vocal-choir", label: "นักร้องคอรัส", category: "ร้อง" },
  { value: "vocal-rap", label: "แร็ป/เร็ปเปอร์", category: "ร้อง" },
  
  // DJ และอิเล็กทรอนิกส์
  { value: "dj-controller", label: "DJ คอนโทรลเลอร์", category: "DJ/อิเล็กทรอนิกส์" },
  { value: "dj-turntable", label: "เทิร์นเทเบิล", category: "DJ/อิเล็กทรอนิกส์" },
  { value: "dj-laptop", label: "แล็ปท็อป DJ", category: "DJ/อิเล็กทรอนิกส์" },
  { value: "dj-producer", label: "โปรดิวเซอร์", category: "DJ/อิเล็กทรอนิกส์" },
  
  // อื่นๆ
  { value: "other-djemb", label: "ดรัมแมชีน", category: "อื่นๆ" },
  { value: "other-theremin", label: "เธอรามิน", category: "อื่นๆ" },
  { value: "other-band", label: "วงดนตรีครบ", category: "อื่นๆ" },
  { value: "other-session", label: "นักดนตรีเซสชัน", category: "อื่นๆ" },
  { value: "other-sound", label: "วิศวกรเสียง", category: "อื่นๆ" },
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
    instruments: [] as string[],
    date: "",
    location: "",
    province: "",
    duration: "",
    budget: "",
    lineId: "", 
    phone: ""   
  });

  // State for searchable multi-select
  const [instrumentSearch, setInstrumentSearch] = useState("");
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false);

  // Filter instruments based on search
  const filteredInstruments = instruments.filter(instrument => 
    instrument.label.toLowerCase().includes(instrumentSearch.toLowerCase()) ||
    instrument.category.toLowerCase().includes(instrumentSearch.toLowerCase())
  );

  // Group instruments by category
  const instrumentsByCategory = filteredInstruments.reduce((acc, instrument) => {
    if (!acc[instrument.category]) {
      acc[instrument.category] = [];
    }
    acc[instrument.category].push(instrument);
    return acc;
  }, {} as Record<string, typeof instruments>);

  // Handle instrument selection
  const handleInstrumentToggle = (instrument: typeof instruments[0]) => {
    const isSelected = formData.instruments.includes(instrument.label);
    if (isSelected) {
      setFormData({
        ...formData,
        instruments: formData.instruments.filter(i => i !== instrument.label)
      });
    } else {
      setFormData({
        ...formData,
        instruments: [...formData.instruments, instrument.label]
      });
    }
  };

  // Remove instrument from selection
  const removeInstrument = (instrumentLabel: string) => {
    setFormData({
      ...formData,
      instruments: formData.instruments.filter(i => i !== instrumentLabel)
    });
  };

  // Get selected instrument objects
  const selectedInstruments = formData.instruments.map(label => 
    instruments.find(i => i.label === label)
  ).filter(Boolean) as typeof instruments;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showInstrumentDropdown) {
        const target = event.target as Element;
        if (!target.closest('.instrument-dropdown')) {
          setShowInstrumentDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInstrumentDropdown]);

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
    
    // เช็คว่าเลือกเครื่องดนตรีอย่างน้อย 1 ชนิด
    if (formData.instruments.length === 0) {
      toast({ 
        title: "กรุณาเลือกเครื่องดนตรี", 
        description: "ต้องเลือกเครื่องดนตรีอย่างน้อย 1 ชนิด",
        variant: "destructive" 
      });
      return;
    }

    setIsSearching(true);
    
    try {
      // ส่งข้อมูลโดยใช้ชื่อคอลัมน์ที่ตรงกับฐานข้อมูลของคุณเป๊ะๆ
      const jobData = {
        instrument: formData.instruments.join(", "), // แปลง array เป็น string
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
            
            {/* Searchable Multi-Select Dropdown */}
            <div className="relative instrument-dropdown">
              {/* Selected Instruments Display */}
              <div 
                className="w-full min-h-12 rounded-2xl border border-input bg-background px-4 py-2 outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                onClick={() => setShowInstrumentDropdown(!showInstrumentDropdown)}
              >
                <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
                  {formData.instruments.length === 0 ? (
                    <span className="text-muted-foreground">เลือกเครื่องดนตรี...</span>
                  ) : (
                    formData.instruments.map((instrumentLabel, index) => (
                      <div 
                        key={index}
                        className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm"
                      >
                        <span>{instrumentLabel}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeInstrument(instrumentLabel);
                          }}
                          className="ml-1 text-orange-500 hover:text-orange-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform ${showInstrumentDropdown ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown */}
              {showInstrumentDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                  {/* Search Input */}
                  <div className="p-3 border-b border-input">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="ค้นหาเครื่องดนตรี..."
                        value={instrumentSearch}
                        onChange={(e) => setInstrumentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Instrument Options */}
                  <div className="p-2">
                    {Object.entries(instrumentsByCategory).map(([category, categoryInstruments]) => (
                      <div key={category} className="mb-3">
                        <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {category}
                        </div>
                        {categoryInstruments.map((instrument) => {
                          const isSelected = formData.instruments.includes(instrument.label);
                          return (
                            <button
                              key={instrument.value}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstrumentToggle(instrument);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center justify-between ${
                                isSelected
                                  ? "bg-orange-100 text-orange-700"
                                  : "hover:bg-accent text-foreground"
                              }`}
                            >
                              <span>{instrument.label}</span>
                              {isSelected && (
                                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    {filteredInstruments.length === 0 && (
                      <div className="px-3 py-4 text-center text-muted-foreground text-sm">
                        ไม่พบเครื่องดนตรีที่ค้นหา
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">วันที่</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="rounded-2xl h-12 w-full" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">เวลาที่เล่น</Label>
              <Input placeholder="เช่น 20.00-21.30" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required className="rounded-2xl h-12 w-full" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">งบประมาณ</Label>
              <Input type="text" placeholder="ระบุงบประมาณ" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} required className="rounded-2xl h-12 w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-dashed border-border">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-orange-600">ID Line</Label>
              <Input 
                placeholder="ระบุไอดีไลน์" 
                value={formData.lineId} 
                onChange={(e) => setFormData({ ...formData, lineId: e.target.value })} 
                required 
                className="rounded-2xl h-12 w-full border-orange-100 focus:border-orange-500" 
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
                className="rounded-2xl h-12 w-full border-green-100 focus:border-green-500" 
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