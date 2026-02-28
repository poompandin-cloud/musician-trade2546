# การปรับปรุงระบบวิดีโอตัวอย่างการแสดง: จาก File Upload เป็น URL Input

## ภาพรวมการเปลี่ยนแปลง

### จากเดิม (File Upload)
- ผู้ใช้เลือกไฟล์วิดีโอจากเครื่อง
- อัปโหลดไปยัง Supabase Storage
- จัดเก็บเป็น Public URL จาก Storage
- แสดงผลด้วย `<video>` tag

### ใหม่ (URL Input)
- ผู้ใช้กรอกลิงก์จาก YouTube หรือ Facebook
- ตรวจสอบรูปแบบ URL และแปลงเป็น embed format
- จัดเก็บเป็นสตริง URL ลงในฐานข้อมูล
- แสดงผลด้วย `<iframe>` embed

## ฟีเจอร์ใหม่ที่เพิ่ม

### 1. URL Validation & Conversion
```tsx
const validateAndConvertVideoUrl = (url: string) => {
  // ตรวจสอบ YouTube URL
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  
  // ตรวจสอบ Facebook URL
  const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com\/.*\/videos\/|fb\.watch\/)([^/?]+)/);
  
  // แปลงเป็น embed format
  return {
    isValid: boolean,
    error: string | null,
    embedUrl: string | null,
    originalUrl: string
  };
};
```

**รูปแบบ URL ที่รองรับ:**
- **YouTube**: `youtube.com/watch?v=VIDEO_ID`, `youtu.be/VIDEO_ID`, `youtube.com/embed/VIDEO_ID`
- **Facebook**: `facebook.com/PAGE/videos/VIDEO_ID`, `fb.watch/VIDEO_ID`

### 2. Video Embed Generation
```tsx
const createVideoEmbed = (url: string, index: number) => {
  const validation = validateAndConvertVideoUrl(url);
  
  if (validation.embedUrl?.includes('youtube.com/embed/')) {
    // YouTube Embed
    return (
      <iframe
        src={validation.embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  
  // Facebook Embed
  return (
    <iframe
      src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(validation.originalUrl)}&show_text=false&width=560`}
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      allowFullScreen={true}
    />
  );
};
```

### 3. Smart URL Input UI
```tsx
<Input
  type="url"
  placeholder="วางลิงก์ YouTube หรือ Facebook ที่นี่..."
  value={videoInput}
  onChange={(e) => setVideoInput(e.target.value)}
  className="w-full"
/>

// Real-time URL Preview
{videoInput && (
  <div className="mt-2 p-2 bg-white rounded-lg border">
    <div className="flex items-center gap-2">
      {videoInput.includes('youtube') ? (
        <i className="fab fa-youtube text-red-600"></i>
      ) : videoInput.includes('facebook') ? (
        <i className="fab fa-facebook text-blue-600"></i>
      ) : (
        <Video className="w-4 h-4 text-gray-600" />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium truncate">{videoInput}</p>
        <p className="text-xs text-gray-500">
          {validateAndConvertVideoUrl(videoInput).isValid ? 'YouTube' : 'Facebook'}
        </p>
      </div>
    </div>
  </div>
)}
```

## การทำงานของระบบใหม่

### 1. การเพิ่มวิดีโอ
1. **กรอก URL**: ผู้ใช้วางลิงก์ YouTube หรือ Facebook
2. **Real-time Validation**: ตรวจสอบรูปแบบ URL ทันที
3. **Platform Detection**: แสดงไอคอนและชื่อแพลตฟอร์ม
4. **Save to Database**: จัดเก็บ URL ต้นฉบับลงใน `video_urls` array
5. **Generate Embed**: สร้าง iframe สำหรับแสดงผล

### 2. การแสดงผลวิดีโอ
1. **URL Detection**: ตรวจสอบว่าเป็น YouTube หรือ Facebook
2. **Embed Generation**: สร้าง iframe ตามแพลตฟอร์ม
3. **Responsive Design**: รองรับทั้ง desktop และ mobile
4. **Error Handling**: แสดงข้อความผิดพลาดถ้า URL ไม่ถูกต้อง

### 3. การจัดการข้อมูล
- **Database**: จัดเก็บเป็น JSON array ของ URL strings
- **No Storage**: ไม่ต้องใช้ Supabase Storage
- **Direct Embed**: แสดงผลโดยตรงจากแพลตฟอร์มต้นทาง

## ประโยชน์ของระบบใหม่

### 1. สำหรับผู้ใช้
- **ง่ายขึ้น**: ไม่ต้องดาวน์โหลดและอัปโหลดไฟล์
- **เร็วขึ้น**: แค่วางลิงก์แล้วเสร็จ
- **คุณภาพดี**: รองรับวิดีโอความละเอียดสูงจากแพลตฟอร์มต้นทาง
- **ประหยัดพื้นที่**: ไม่ต้องเก็บไฟล์วิดีโอในระบบ

### 2. สำหรับระบบ
- **ลดภาระ**: ไม่ต้องจัดการไฟล์ขนาดใหญ่
- **ประหยัด Storage**: ไม่ใช้พื้นที่ใน Supabase Storage
- **เสถียรกว่า**: ไม่มีปัญหาการอัปโหลดไฟล์
- **ปลอดภัย**: ไม่ต้องจัดการไฟล์จากผู้ใช้

### 3. สำหรับการแสดงผล
- **Native Player**: ใช้ player ของแพลตฟอร์มต้นทาง
- **Full Features**: รองรับฟีเจอร์ครบถ้วน (HD, subtitle, speed control)
- **Mobile Friendly**: รองรับมือถืออย่างดี
- **No Buffering**: สตรีมมิ่งโดยตรงจากแพลตฟอร์ม

## รายละเอียดการ Implement

### 1. YouTube Integration
```tsx
// URL Detection
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;

// Embed URL
const embedUrl = `https://www.youtube.com/embed/${videoId}`;

// Iframe Attributes
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
allowFullScreen
```

### 2. Facebook Integration
```tsx
// URL Detection
const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com\/.*\/videos\/|fb\.watch\/)([^/?]+)/;

// Embed URL
const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(originalUrl)}&show_text=false&width=560`;

// Iframe Attributes
allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
allowFullScreen={true}
```

### 3. UI Components
```tsx
// Input Field
<Input
  type="url"
  placeholder="วางลิงก์ YouTube หรือ Facebook ที่นี่..."
  value={videoInput}
  onChange={(e) => setVideoInput(e.target.value)}
  className="w-full"
/>

// Platform Icon
{videoInput.includes('youtube') ? (
  <i className="fab fa-youtube text-red-600"></i>
) : videoInput.includes('facebook') ? (
  <i className="fab fa-facebook text-blue-600"></i>
) : (
  <Video className="w-4 h-4 text-gray-600" />
)}

// Validation Status
{validateAndConvertVideoUrl(videoInput).isValid ? 
  (videoInput.includes('youtube') ? 'YouTube' : 'Facebook') : 
  'ตรวจสอบ URL...'
}
```

## การทดสอบ

### 1. YouTube URL
- **Valid**: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- **Valid**: `https://youtu.be/dQw4w9WgXcQ`
- **Valid**: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- **Invalid**: `https://www.youtube.com/`

### 2. Facebook URL
- **Valid**: `https://www.facebook.com/page/videos/123456789/`
- **Valid**: `https://fb.watch/abc123def/`
- **Invalid**: `https://www.facebook.com/`

### 3. Error Handling
- **Empty URL**: "กรุณากรอก URL วิดีโอ"
- **Invalid URL**: "รองรับเฉพาะลิงก์จาก YouTube หรือ Facebook เท่านั้น"
- **Max Videos**: "สามารถเพิ่มวิดีโอได้สูงสุด 3 คลิปเท่านั้น"

## การย้ายข้อมูล (Migration)

### สำหรับข้อมูลเดิม (File Upload)
1. **Keep Existing**: วิดีโอที่อัปโหลดไว้แล้วยังคงแสดงผล
2. **Mixed Support**: รองรับทั้ง URL ใหม่และไฟล์เดิม
3. **Gradual Migration**: ผู้ใช้สามารถเพิ่ม URL ใหม่ได้ทันที

### สำหรับข้อมูลใหม่ (URL Input)
1. **Direct Save**: บันทึก URL ลงในฐานข้อมูลโดยตรง
2. **Instant Preview**: แสดงผล embed ทันทีหลังบันทึก
3. **No Upload**: ไม่ต้องรอการอัปโหลดไฟล์

## สรุป

การปรับปรุงนี้ทำให้ระบบวิดีโอตัวอย่างการแสดง:
- **ใช้งานง่ายขึ้น**: แค่วางลิงก์แทนการอัปโหลดไฟล์
- **เร็วขึ้น**: ไม่ต้องรอการอัปโหลด
- **คุณภาพดีขึ้น**: รองรับวิดีโอความละเอียดสูง
- **ลดภาระระบบ**: ไม่ต้องจัดการไฟล์ขนาดใหญ่
- **ประหยัดค่าใช้จ่าย**: ไม่ใช้พื้นที่ Storage

ระบบใหม่พร้อมใช้งานและรองรับผู้ใช้ได้ดีกว่าเดิม
