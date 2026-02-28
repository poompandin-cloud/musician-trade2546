import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertCircle, Search, X, ChevronDown, HelpCircle, ExternalLink, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom"; // เพิ่ม import
import { useRealTimeCredits } from "@/services/realTimeCreditService";
import { Checkbox } from "@/components/ui/checkbox"; // เพิ่ม import Checkbox
import { PROVINCES } from '@/constants/provinces'; // เพิ่ม import จังหวัด
import { ProvinceSelect } from '@/components/ProvinceSelect'; // เพิ่ม import ProvinceSelect

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

interface SearchFormProps {
  onBack: () => void;
  onAddJob: (job: any) => Promise<void>;
  userId: string | null;
}

const SearchForm = ({ onBack, onAddJob, userId }: SearchFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate(); // เพิ่ม navigate hook
  const [isSearching, setIsSearching] = useState(false);
  // ใช้ Hook ตัวใหม่ที่พี่สร้าง เลขจะวิ่งไปหา 15 ทันที
const { credits, loading: loadingCredits } = useRealTimeCredits(userId);

  const [formData, setFormData] = useState({
    instruments: [] as string[],
    date: "",
    location: "",
    province: "",
    duration: "",
    budget: "",
    lineId: "", 
    phone: "",
    expiryDate: "",
    additionalNotes: ""
  });

  // State สำหรับการยอมรับเงื่อนไข
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Smart Line Link states
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

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
    setIsSearching(true);

    // ตรวจสอบความถูกต้องของข้อมูลก่อนส่ง
    const validationErrors = [];
    
    if (!formData.instruments || formData.instruments.length === 0 || formData.instruments.join("").trim() === "") {
      validationErrors.push("กรุณาระบุเครื่องดนตรี");
    }
    
    if (!formData.date || formData.date.trim() === "") {
      validationErrors.push("กรุณาระบุวันที่");
    }
    
    if (!formData.location || formData.location.trim() === "") {
      validationErrors.push("กรุณาระบุสถานที่");
    }
    
    if (!formData.province || formData.province.trim() === "") {
      validationErrors.push("กรุณาระบุจังหวัด");
    }
    
    if (!formData.duration || formData.duration.trim() === "") {
      validationErrors.push("กรุณาระบุเวลาที่เล่น");
    }
    
    if (!formData.budget || formData.budget.trim() === "") {
      validationErrors.push("กรุณาระบุงบประมาณ");
    }
    
    if (!formData.lineId || formData.lineId.trim() === "") {
      validationErrors.push("กรุณาระบุ ID Line");
    }
    
    if (!formData.phone || formData.phone.trim() === "") {
      validationErrors.push("กรุณาระบุเบอร์โทรศัพท์");
    }
    
    // ถ้ามี error ให้แสดงและหยุด
    if (validationErrors.length > 0) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: validationErrors.join(", "),
        variant: "destructive"
      });
      setIsSearching(false);
      return;
    }

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
        additional_notes: formData.additionalNotes, // เพิ่มหมายเหตุเพิ่มเติม
        accepted_terms: acceptedTerms, // เพิ่มการยอมรับเงื่อนไข
        status: "open"
      };

      console.log("🔍 Submitting job data:", jobData); // Debug log
      console.log("🔍 Calling onAddJob function...");

      await onAddJob(jobData);
      
      console.log("✅ onAddJob completed successfully!");
      toast({ title: "ประกาศงานสำเร็จ!", description: "ข้อมูลติดต่อถูกบันทึกแล้ว และหักเครดิต 5 เครดิต" });
      onBack();
    } catch (error: any) {
      console.error("Error submitting job:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      
      let errorMessage = "เกิดข้อผิดพลาด";
      let errorTitle = "เกิดข้อผิดพลาด";
      
      // ตรวจสอบประเภทของ error
      if (error?.message) {
        errorMessage = error.message;
        
        // ตรวจสอบ error จาก Supabase
        if (error.message.includes("column") || error.message.includes("does not exist")) {
          errorTitle = "ข้อผิดพลาดฐานข้อมูล";
          errorMessage = `คอลัมน์ในตารางไม่ถูกต้อง: ${error.message}`;
        } else if (error.message.includes("permission") || error.message.includes("unauthorized") || error.message.includes("403")) {
          errorTitle = "ไม่มีสิทธิ์";
          errorMessage = "คุณไม่มีสิทธิ์ในการเพิ่มงาน กรุณาตรวจสอบ RLS Policy";
        } else if (error.message.includes("duplicate") || error.message.includes("unique")) {
          errorTitle = "ข้อมูลซ้ำ";
          errorMessage = "มีข้อมูลซ้ำในระบบ";
        } else if (error.message.includes("foreign key")) {
          errorTitle = "ข้อมูลอ้างอิงไม่ถูกต้อง";
          errorMessage = "ข้อมูลผู้ใช้ไม่ถูกต้อง";
        } else if (error.message.includes("โควตา") || error.message.includes("credits")) {
          errorTitle = "ไม่สามารถลงประกาศได้";
          errorMessage = error.message;
        }
      }
      
      toast({ 
        title: errorTitle,
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
            
            
            {/* Free Text Input with Suggestions */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">เครื่องดนตรีที่ต้องการให้มาแทน</Label>
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
              <ProvinceSelect
                value={formData.province}
                onChange={(value) => setFormData({ ...formData, province: value })}
                placeholder="ระบุจังหวัด"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">สถานที่ / แผนที่ร้าน</Label>
            <Input placeholder="ชื่อร้าน หรือ Google Maps" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="rounded-2xl h-12 w-full text-sm sm:text-base break-words" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">หมายเหตุเพิ่มเติม</Label>
            <textarea
              placeholder="เช่น รายละเอียดเพลงที่ต้องการ, การแต่งกาย หรือข้อมูลอื่น ๆ"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={4}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">เวลาที่เล่น</Label>
              <Input placeholder="เช่น 20.00-21.30" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} required className="rounded-2xl h-12 w-full text-sm sm:text-base break-words" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">งบประมาณ</Label>
              <Input type="text" placeholder="ระบุงบประมาณ" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} required className="rounded-2xl h-12 w-full text-sm sm:text-base break-words" />
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

          {/* ✅ แก้ไขส่วนแสดงคำเตือนเครดิต */}
          {!loadingCredits && (
            !userId ? (
              // กรณีที่ 1: ยังไม่ได้เข้าสู่ระบบ
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>กรุณาเข้าสู่ระบบเพื่อรับเครดิตและลงประกาศงาน</span>
              </div>
            ) : !hasEnoughCredits ? (
              // กรณีที่ 2: เข้าสู่ระบบแล้วแต่เครดิตไม่พอ
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>เครดิตไม่เพียงพอ (ต้องการ 5 เครดิต, คุณมี {credits || 0} เครดิต)</span>
              </div>
            ) : null
          )}

          {/* ✅ กล่องยอมรับเงื่อนไข */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="accepted-terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label 
                  htmlFor="accepted-terms" 
                  className="text-sm font-semibold text-red-800 leading-relaxed cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>ข้อตกลงสำคัญ:</span>
                  </div>
                  หากเกิดความผิดพลาดใดๆ ระหว่างการทำงาน ทางร้านและระบบจะไม่รับผิดชอบต่อความเสียหายที่เกิดขึ้นในทุกกรณี ผู้ลงประกาศและผู้รับงานต้องเป็นผู้ตกลงและรับผิดชอบร่วมกันเอง
                </Label>
              </div>
            </div>
          </div>

         {/* ✅ ปุ่มหลักที่คุณหาอยู่คือตรงนี้ครับ */}
          <Button 
            type={userId ? "submit" : "button"} // ถ้ายังไม่ login ให้เป็น button ธรรมดา
            className={`w-full h-14 rounded-2xl text-white text-lg font-bold shadow-lg ${
              (!userId || !hasEnoughCredits || isSearching || !acceptedTerms) 
                ? "bg-gray-400" // เอา cursor-not-allowed ออกเพื่อให้กดได้
                : "bg-orange-500 hover:bg-orange-600"
            }`}
            onClick={() => {
              if (!userId) {
                navigate("/auth"); // ✅ สั่งให้วิ่งไปหน้าสไลด์ Login ที่คุณสร้าง
              }
            }}
            disabled={userId && (!hasEnoughCredits || isSearching || !acceptedTerms)} // สั่ง disabled เฉพาะตอนที่ล็อกอินแล้วแต่เครดิตไม่พอ หรือยังไม่ยอมรับเงื่อนไข
          >
            {isSearching 
              ? "กำลังประกาศ..." 
              : !userId 
                ? "กรุณาเข้าสู่ระบบ" // ข้อความที่จะโชว์ตอนยังไม่ Login
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
