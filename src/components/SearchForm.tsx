import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle, Search, X, ChevronDown, HelpCircle, ExternalLink, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const instruments = [
  // กีตาร์
  { value: "guitar-acoustic", label: "กีตาร์โปร่ง", category: "กีตาร์" },
  { value: "guitar-electric", label: "กีตาร์ไฟฟ้า", category: "กีตาร์" },
  
  // คีย์บอร์ด/เปียโน
  { value: "keyboard-piano", label: "เปียโน", category: "คีย์บอร์ด" },
  { value: "keyboard-synth", label: "คีย์บอร์ด/ซินธิไซเซอร์", category: "คีย์บอร์ด" },
  
  // กลอง
  { value: "drums-kit", label: "กลองชุด", category: "กลอง" },
  
  // เครื่องสาย
  { value: "strings-violin", label: "ไวโอลิน", category: "เครื่องสาย" },
  
  // ร้อง
  { value: "vocal-lead", label: "นักร้องนำ", category: "ร้อง" },
  { value: "vocal-backup", label: "นักร้องประสาน", category: "ร้อง" },
  
  // อื่นๆ - Custom Input
  { value: "other-custom", label: "อื่นๆ (ระบุเอง)", category: "อื่นๆ" }
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

  // Smart Line Link states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

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

  // Smart Line Link functions
  const extractLineId = (input: string): string => {
    // ดึง ID จากลิงก์ LINE
    const lineLinkRegex = /line\.me\/ti\/p\/[~]?([a-zA-Z0-9_-]+)/;
    const match = input.match(lineLinkRegex);
    if (match) {
      return match[1];
    }
    
    // ลบช่องว่างและอักขระพิเศษ @ ออก
    return input.replace(/[@\s]/g, '').trim();
  };

  const handleLineIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // ถ้าเป็นการ paste ลิงก์ LINE ให้ดึงเฉพาะ ID
    if (inputValue.includes('line.me')) {
      const extractedId = extractLineId(inputValue);
      setFormData({ ...formData, lineId: extractedId });
    } else {
      // ลบช่องว่างและ @ ออกขณะพิมพ์
      const cleanedValue = inputValue.replace(/[@\s]/g, '');
      setFormData({ ...formData, lineId: cleanedValue });
    }
  };

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const testLineLink = () => {
    if (formData.lineId) {
      window.open(`https://line.me/ti/p/~${formData.lineId}`, '_blank');
    }
  };

  const hasEnoughCredits = credits !== null && credits >= 5;
  const isDisabled = loadingCredits || !hasEnoughCredits || isSearching;
// ... (ส่วนบนคงเดิม)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // เช็คว่าเลือกเครื่องดนตรีอย่างน้อย 1 ชนิด
    if (formData.instruments.join(", ").trim().length === 0) {
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
        instrument: formData.instruments.join(", ").trim(), // แปลง array เป็น string
        date: formData.date,
        location: formData.location,
        province: formData.province,
        duration: formData.duration,
        budget: formData.budget,
        lineId: formData.lineId,
        phone: formData.phone,
        status: "open", // งานเริ่มต้นด้วยสถานะ "เปิดรับสมัคร"
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
            
            {/* Free Text Input with Suggestions */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">เครื่องดนตรีที่ต้องการ</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ระบุชื่อเครื่องดนตรี..."
                  value={formData.instruments.join(", ")}
                  onChange={(e) => setFormData({ ...formData, instruments: e.target.value.split(", ").filter(i => i.trim()) })}
                  className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
                />
                
                {/* Suggestions Dropdown */}
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-2">
                    รายการแนะนำ: กีต้าร์คลาสสิค, เบส, กลอง, เปียโน, ฯลฯ
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {instruments.map((instrument) => (
                      <button
                        key={instrument.value}
                        type="button"
                        onClick={() => {
                          const currentInstruments = formData.instruments.join(", ").split(", ").filter(i => i.trim());
                          if (!currentInstruments.includes(instrument.label)) {
                            setFormData({
                              ...formData,
                              instruments: [...currentInstruments, instrument.label]
                            });
                          }
                        }}
                        className="text-left px-3 py-2 rounded-xl border border-input bg-card hover:bg-accent transition-colors text-sm"
                      >
                        {instrument.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
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
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold text-orange-600">ID Line</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHelpModal(true)}
                  className="h-6 w-6 p-0 text-orange-600 hover:bg-orange-100"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </div>
              <Input 
                type="text" 
                placeholder="ระบุไอดีไลน์ หรือวางลิงก์ LINE" 
                value={formData.lineId} 
                onChange={handleLineIdChange} 
                required 
                className="rounded-2xl h-12 w-full border-orange-100 focus:border-orange-500" 
              />
              
              {/* Live Preview */}
              {formData.lineId && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="text-xs text-orange-700 mb-1">
                    ลิงก์ที่จะปรากฏ: 
                    <span className="font-mono ml-1">
                      https://line.me/ti/p/~{formData.lineId}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testLineLink}
                    className="text-xs h-7 px-2 border-orange-200 text-orange-600 hover:bg-orange-100"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    กดเพื่อทดสอบ
                  </Button>
                </div>
              )}
              
              {/* Security Warning */}
              <div className="text-xs text-orange-600 mt-1">
                ⚠️ สำคัญ: โปรดตรวจสอบว่าคุณเปิดอนุญาตให้เพิ่มเพื่อนด้วยไอดีในแอป LINE แล้ว
              </div>
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

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">วิธีเอาลิงก์จาก LINE</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowHelpModal(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">เปิดแอป LINE และไปที่หน้าโปรไฟล์</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      แตะที่รูปโปรไฟล์ของคุณในหน้าแรก LINE
                    </p>
                    <div className="bg-gray-100 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">หน้าโปรไฟล์ LINE</div>
                      <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-1"></div>
                      <div className="text-xs">ชื่อของคุณ</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">กดปุ่มแชร์/QR Code</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      แตะที่เมนู (⋮) หรือปุ่มแชร์ในหน้าโปรไฟล์
                    </p>
                    <div className="bg-gray-100 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500 mb-1">เมนูแชร์</div>
                      <div className="flex justify-center gap-2">
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                        <div className="w-8 h-8 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">คัดลอกลิงก์</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      เลือก "คัดลอกลิงก์" หรือ "Copy Link"
                    </p>
                    <div className="bg-gray-100 rounded-lg p-2">
                      <div className="text-xs text-gray-500 mb-1">ลิงก์ที่ได้:</div>
                      <div className="bg-white border border-gray-300 rounded p-2 text-xs font-mono break-all">
                        https://line.me/ti/p/ABC123
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard('https://line.me/ti/p/ABC123', 3)}
                        className="mt-2 text-xs h-6 px-2"
                      >
                        {copiedStep === 3 ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            คัดลอกแล้ว
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            คัดลอกตัวอย่าง
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">วางในช่องกรอก</h4>
                    <p className="text-xs text-gray-600">
                      กลับมาที่หน้าประกาศงานและวางลิงก์ในช่อง ID Line
                      <br />
                      <span className="text-orange-600 font-semibold">
                        ระบบจะดึงเฉพาะ ID ให้อัตโนมัติ!
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-orange-800 mb-1">สำคัญ!</h4>
                    <p className="text-xs text-orange-700">
                      ต้องเปิดอนุญาตให้เพิ่มเพื่อนด้วยไอดีในแอป LINE ก่อน
                      <br />
                      ไปที่: การตั้งค่า {'>'} เพื่อน {'>'} เพิ่มเพื่อนด้วยไอดี
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white"
            >
              เข้าใจแล้ว
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchForm;