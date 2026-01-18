import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface MusicianSignupProps {
  onBack: () => void;
}

const instruments = [
  { value: "guitar", label: "🎸 กีตาร์" },
  { value: "bass", label: "🎸 เบส" },
  { value: "drums", label: "🥁 กลอง" },
  { value: "keyboard", label: "🎹 คีย์บอร์ด" },
  { value: "vocal", label: "🎤 นักร้อง" },
  { value: "saxophone", label: "🎷 แซกโซโฟน" },
  { value: "violin", label: "🎻 ไวโอลิน" },
  { value: "dj", label: "🎧 DJ" },
];

const MusicianSignup = ({ onBack }: MusicianSignupProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    instrument: "",
    experience: "",
    areas: [] as string[],
    lineId: "",
  });

  const areas = ["สุขุมวิท", "ทองหล่อ", "RCA", "สีลม", "สาทร", "ลาดพร้าว", "รัชดา", "อารีย์"];

  const handleAreaToggle = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "🎉 สมัครสำเร็จ!",
        description: "ยินดีต้อนรับสู่ snowguin. เราจะติดต่อกลับเร็วๆ นี้!",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>กลับหน้าหลัก</span>
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="container py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent flex items-center justify-center text-3xl">
              🎸
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2 font-display">
              สมัครเป็นนักดนตรี
            </h1>
            <p className="text-muted-foreground">
              เข้าร่วมเครือข่ายนักดนตรีที่พร้อมรับงานได้ทันที
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <Label htmlFor="name" className="text-foreground font-medium">
                ชื่อ-นามสกุล
              </Label>
              <Input
                id="name"
                placeholder="ชื่อของคุณ"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 rounded-xl bg-card border-border"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <Label htmlFor="phone" className="text-foreground font-medium">
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-12 rounded-xl bg-card border-border"
              />
            </div>

            {/* Instrument */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Label htmlFor="instrument" className="text-foreground font-medium">
                เครื่องดนตรีหลัก
              </Label>
              <Select
                value={formData.instrument}
                onValueChange={(value) => setFormData({ ...formData, instrument: value })}
              >
                <SelectTrigger className="h-12 rounded-xl bg-card border-border">
                  <SelectValue placeholder="เลือกเครื่องดนตรี" />
                </SelectTrigger>
                <SelectContent>
                  {instruments.map((inst) => (
                    <SelectItem key={inst.value} value={inst.value}>
                      {inst.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Experience */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.25s" }}>
              <Label htmlFor="experience" className="text-foreground font-medium">
                ประสบการณ์
              </Label>
              <Select
                value={formData.experience}
                onValueChange={(value) => setFormData({ ...formData, experience: value })}
              >
                <SelectTrigger className="h-12 rounded-xl bg-card border-border">
                  <SelectValue placeholder="เลือกประสบการณ์" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2">1-2 ปี</SelectItem>
                  <SelectItem value="3-5">3-5 ปี</SelectItem>
                  <SelectItem value="5-10">5-10 ปี</SelectItem>
                  <SelectItem value="10+">มากกว่า 10 ปี</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Areas */}
            <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Label className="text-foreground font-medium">
                พื้นที่ที่สะดวกรับงาน
              </Label>
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleAreaToggle(area)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${formData.areas.includes(area)
                        ? "gradient-primary text-primary-foreground shadow-soft"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }
                    `}
                  >
                    {formData.areas.includes(area) && (
                      <CheckCircle2 className="w-4 h-4 inline mr-1" />
                    )}
                    {area}
                  </button>
                ))}
              </div>
            </div>

            {/* Line ID */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.35s" }}>
              <Label htmlFor="lineId" className="text-foreground font-medium">
                Line ID (ถ้ามี)
              </Label>
              <Input
                id="lineId"
                placeholder="@yourlineid"
                value={formData.lineId}
                onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                className="h-12 rounded-xl bg-card border-border"
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Checkbox id="terms" className="mt-1" />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                ข้าพเจ้ายินยอมให้ snowguin. ติดต่อเมื่อมีงานที่เหมาะสม และยอมรับเงื่อนไขการใช้งาน
              </Label>
            </div>

            {/* Submit */}
            <div className="pt-4 animate-fade-in" style={{ animationDelay: "0.45s" }}>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-lg font-semibold rounded-xl gradient-primary shadow-button hover:opacity-90 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังสมัคร...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    สมัครเลย
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Benefits */}
          <div className="mt-8 space-y-3 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <p className="text-sm font-medium text-foreground text-center">สิ่งที่คุณจะได้รับ:</p>
            <div className="grid gap-2">
              {[
                "💰 รับงานเพิ่มเมื่อมีเวลาว่าง",
                "⚡ แจ้งเตือนงานด่วนใกล้คุณ",
                "📈 สร้างโปรไฟล์และชื่อเสียง",
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-accent text-sm text-accent-foreground text-center"
                >
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MusicianSignup;
