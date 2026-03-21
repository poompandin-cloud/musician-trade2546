// รายการเครื่องดนตรีที่ใช้ทั่วทั้งแอปพลิเคชัน (เรียงตามตัวอักษร)
export const INSTRUMENTS = [
  // เครื่องสาย (Strings)
  { value: "sound-engineer", label: "ซาวด์เอนจิเนีย" },
  { value: "Technician", label: "เทคนีเชี่ยน" },
   { value: "vocal-lead", label: "นักร้องนำ" },
  { value: "vocal-backup", label: "นักร้องคอรัส" },
  { value: "guitar-acoustic", label: "กีตาร์โปร่ง" },
  { value: "guitar-electric", label: "กีตาร์ไฟฟ้า" },
  { value: "bass", label: "เบส" },
   // กลอง (Drums & Percussion)
  { value: "drums-kit", label: "กลองชุด" },
  { value: "drum-electric", label: "กลองไฟฟ้า" },
  
  
  // คีย์บอร์ด (Keyboards)
  { value: "keyboard-synth", label: "คีย์บอร์ด/ซินธิไซเซอร์" },
  { value: "keyboard-piano", label: "เปียโน" },
  
  // เครื่องเป่า (Woodwinds & Brass)
  { value: "saxophone", label: "แซกโซโฟน" },
  { value: "clarinet", label: "คลาริเน็ต" },
  { value: "flute", label: "ฟลุต" },
  { value: "trumpet", label: "ทรัมเป็ต" },
  { value: "trombone", label: "ทรอมโบน" },
  { value: "tuba", label: "ทูบา" },
  { value: "french-horn", label: "เฟรนช์ฮอร์น" },
  { value: "violin", label: "ไวโอลิน" },
  { value: "viola", label: "วิโอลา" },
  { value: "cello", label: "เชลโล" },
  { value: "ukulele", label: "อูคูเลเล่" },
  { value: "percussion", label: "เพอร์คัสชัน" },
   { value: "double-bass", label: "ดับเบิลเบส" },
  
  // อื่นๆ (Others)
  { value: "harmonica", label: "หมอนิกา" },
];

// ฟังก์ชันสำหรับหา label จาก value
export const getInstrumentLabel = (value: string): string => {
  const instrument = INSTRUMENTS.find(inst => inst.value === value);
  return instrument ? instrument.label : value;
};

// ฟังก์ชันสำหรับหา value จาก label
export const getInstrumentValue = (label: string): string => {
  const instrument = INSTRUMENTS.find(inst => inst.label === label);
  return instrument ? instrument.value : label;
};
