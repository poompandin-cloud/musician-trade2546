import { ArrowLeft, Zap, Users, TrendingUp, Shield, Clock, Globe } from "lucide-react";
import Logo from "./Logo";

interface AboutSectionProps {
  onBack: () => void;
}

const AboutSection = ({ onBack }: AboutSectionProps) => {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "รวดเร็วทันใจ",
      description: "ค้นหาและจับคู่นักดนตรีภายในไม่กี่นาที ไม่ต้องรอนาน",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "เครือข่ายนักดนตรีมืออาชีพ",
      description: "นักดนตรีที่ผ่านการคัดกรอง พร้อมรับงานทันที",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "เชื่อถือได้",
      description: "ระบบรีวิวและเรตติ้งช่วยให้คุณมั่นใจในทุกการจับคู่",
    },
  ];

  const roadmap = [
    {
      phase: "MVP",
      title: "เปิดตัว",
      items: ["ระบบค้นหานักดนตรี", "สมัครเป็นนักดนตรี", "การจับคู่แบบ Manual"],
      status: "current",
    },
    {
      phase: "Phase 2",
      title: "ระบบอัตโนมัติ",
      items: ["AI Matching Algorithm", "แจ้งเตือนอัตโนมัติ", "ระบบชำระเงิน"],
      status: "upcoming",
    },
    {
      phase: "Phase 3",
      title: "ขยายตลาด",
      items: ["รองรับหลายเมือง", "Rating & Review", "ระบบ Subscription"],
      status: "future",
    },
  ];

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

      {/* Content */}
      <main className="container py-8 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <Logo className="justify-center mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-4 font-display">
              แก้ปัญหา<span className="text-gradient"> นักดนตรีหายกลางคืน</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              แพลตฟอร์มที่เชื่อมร้านเพลงกับนักดนตรีที่พร้อมรับงานทันที
              ไม่ต้องกังวลเมื่อนักดนตรียกเลิกกะทันหัน
            </p>
          </div>

          {/* Problem */}
          <section className="mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-xl font-bold text-foreground mb-4 font-display flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm">
                !
              </span>
              ปัญหาที่เราแก้
            </h2>
            <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20">
              <p className="text-foreground leading-relaxed">
                ร้านเพลงมักเจอปัญหา<strong>นักดนตรียกเลิกกะทันหัน</strong> หรือไม่มาตามนัด
                ทำให้ต้องเสียรายได้ เสียลูกค้า และเสียชื่อเสียง
                การหานักดนตรีแทนในเวลาจำกัดนั้นยากและไม่น่าเชื่อถือ
              </p>
            </div>
          </section>

          {/* Solution */}
          <section className="mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xl font-bold text-foreground mb-6 font-display flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm">
                ✓
              </span>
              snowguin. ช่วยได้อย่างไร
            </h2>
            <div className="grid gap-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-card border border-border shadow-card hover:shadow-soft transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-primary shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap */}
          <section className="mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-bold text-foreground mb-6 font-display flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm">
                <TrendingUp className="w-4 h-4" />
              </span>
              Roadmap
            </h2>
            <div className="space-y-4">
              {roadmap.map((phase, i) => (
                <div
                  key={i}
                  className={`p-5 rounded-2xl border transition-all ${
                    phase.status === "current"
                      ? "bg-accent border-primary/30 shadow-soft"
                      : "bg-card border-border"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        phase.status === "current"
                          ? "gradient-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {phase.phase}
                    </span>
                    <h3 className="font-semibold text-foreground">{phase.title}</h3>
                  </div>
                  <ul className="space-y-1">
                    {phase.items.map((item, j) => (
                      <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Tech Stack */}
          <section className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-xl font-bold text-foreground mb-6 font-display flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground text-sm">
                <Globe className="w-4 h-4" />
              </span>
              Technology
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "⚡", label: "Cloud-based Platform" },
                { icon: "🤖", label: "AI-powered Matching" },
                { icon: "📱", label: "Mobile-first Design" },
                { icon: "📊", label: "Data-driven Insights" },
              ].map((tech, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-secondary text-center"
                >
                  <span className="text-2xl mb-2 block">{tech.icon}</span>
                  <span className="text-sm font-medium text-secondary-foreground">{tech.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Footer note */}
          <div className="mt-12 p-6 rounded-2xl bg-accent border border-primary/10 text-center animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <p className="text-accent-foreground font-medium mb-2">
              🚀 พร้อมเปลี่ยนวงการดนตรีกลางคืน
            </p>
            <p className="text-sm text-muted-foreground">
              ติดต่อ: hello@snowguin.app
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutSection;