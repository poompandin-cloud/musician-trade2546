// Test script สำหรับทดสอบ embed URL ที่ส่งไปให้ FacebookVideoPlayer
// รันใน browser console

function testEmbedUrl() {
  console.log('🔍 Testing embed URL sent to FacebookVideoPlayer...');
  
  // ทดสอบ URL ที่ user ใส่
  const originalUrl = 'https://web.facebook.com/share/v/1CYmrvUUBN/';
  console.log('📋 Original URL:', originalUrl);
  
  // จำลองการทำงานของ validateAndConvertVideoUrl
  function validateAndConvertVideoUrl(url) {
    if (!url || !url.trim()) {
      return { isValid: false, error: "กรุณากรอก URL วิดีโอ", embedUrl: null };
    }

    const trimmedUrl = url.trim();

    // ตรวจสอบ YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = trimmedUrl.match(youtubeRegex);
    
    if (youtubeMatch) {
      const videoId = youtubeMatch[4];
      return {
        isValid: true,
        error: null,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        originalUrl: trimmedUrl
      };
    }

    // ตรวจสอบ Facebook URL (รองรับ web.facebook.com/share/v/)
    const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|web\.facebook\.com|fb\.watch)\/(share\/v\/|watch\/\?v=|videos\/|reel\/|[^\/]+\/videos\/|[^\/]+\/posts\/|[^\/]+\/permalink\/|share\/)([^&\?]*)/;
    const facebookMatch = trimmedUrl.match(facebookRegex);
    
    if (facebookMatch) {
      // ทำความสะอาด URL
      const cleanedUrl = trimmedUrl; // สมมติว่า cleanFacebookUrl ทำงาน
      // สร้าง embed URL สำหรับ Facebook
      const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanedUrl)}&show_text=false&width=640&height=360&autoplay=false&allowfullscreen=true&lazy=true`;
      return {
        isValid: true,
        error: null,
        embedUrl: embedUrl,
        originalUrl: cleanedUrl,
        platform: 'facebook'
      };
    }

    return {
      isValid: false,
      error: "รองรับเฉพาะลิงก์จาก YouTube หรือ Facebook เท่านั้น",
      embedUrl: null
    };
  }
  
  const validation = validateAndConvertVideoUrl(originalUrl);
  console.log('✅ Validation result:', validation);
  
  // ตรวจสอบว่า embedUrl ถูกต้องหรือไม่
  if (validation.embedUrl) {
    console.log('📺 Embed URL:', validation.embedUrl);
    console.log('🔍 Is embed URL format correct?', validation.embedUrl.includes('facebook.com/plugins/video.php'));
    
    // ทดสอบว่า embed URL สามารถเข้าถึงได้หรือไม่
    fetch(validation.embedUrl, { method: 'HEAD' })
      .then(response => {
        console.log('🌐 Embed URL response:', response.status);
        console.log('🌐 Embed URL headers:', response.headers.get('content-type'));
      })
      .catch(error => {
        console.log('❌ Embed URL error:', error);
      });
  }
  
  // ตรวจสอบว่า FacebookVideoPlayer ได้รับ embedUrl หรือ originalUrl
  console.log('🔍 Checking what URL is sent to FacebookVideoPlayer...');
  console.log('📤 Sent to FacebookVideoPlayer:', validation.embedUrl || validation.originalUrl);
  
  // หา FacebookVideoPlayer components ในหน้าเว็บ
  const facebookPlayers = document.querySelectorAll('[data-testid="facebook-video-player"]');
  console.log('📺 FacebookVideoPlayer components found:', facebookPlayers.length);
  
  // หา iframes ทั้งหมด
  const iframes = document.querySelectorAll('iframe');
  console.log('📺 Total iframes found:', iframes.length);
  
  iframes.forEach((iframe, index) => {
    if (iframe.src.includes('facebook.com/plugins/video.php')) {
      console.log(`📺 Facebook iframe ${index + 1}:`, {
        src: iframe.src,
        isEmbedFormat: iframe.src.includes('facebook.com/plugins/video.php'),
        hasCorrectParams: iframe.src.includes('href=') && iframe.src.includes('show_text=false')
      });
    }
  });
  
  // ทดสอบ URL อื่นๆ
  const testUrls = [
    'https://www.facebook.com/watch/?v=123456789',
    'https://fb.watch/abc123',
    'https://web.facebook.com/share/v/1CYmrvUUBN/',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  ];
  
  console.log('📋 Testing other URLs:');
  testUrls.forEach(url => {
    const result = validateAndConvertVideoUrl(url);
    console.log(`📺 ${url}:`, {
      isValid: result.isValid,
      isEmbedFormat: result.embedUrl?.includes('plugins/video.php') || result.embedUrl?.includes('youtube.com/embed/'),
      embedUrl: result.embedUrl
    });
  });
}

// รันการทดสอบ
testEmbedUrl();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testEmbedUrl = testEmbedUrl;
}
