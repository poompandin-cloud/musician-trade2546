// รายการเครื่องดนตรีที่ใช้ทั่วทั้งแอปพลิเคชัน
export const INSTRUMENTS = [
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
  { value: "ukulele", label: "อูคูเลเล่" },
  { value: "harmonica", label: "หมอนิกา" },
  { value: "drum-electric", label: "กลองไฟฟ้า" },
  { value: "acoustic-guitar", label: "กีตาร์อะคูสติก" },
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
