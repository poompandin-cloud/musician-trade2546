// Debug script สำหรับทดสอบ Facebook URL validation
// รันใน browser console

function debugFacebookUrl() {
  console.log('🔍 Debugging Facebook URL validation...');
  
  // URL ที่ user ใส่
  const testUrl = 'https://web.facebook.com/share/v/1CYmrvUUBN/';
  console.log('📋 Test URL:', testUrl);
  
  // ทดสอบ regex ปัจจุบัน
  const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/;
  const match = testUrl.match(facebookRegex);
  console.log('🔍 Current regex match:', match);
  console.log('🔍 Is valid with current regex:', !!match);
  
  // ทดสอบ regex ใหม่ที่รองรับ web.facebook.com/share/v/
  const newFacebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|web\.facebook\.com|fb\.watch)\/(share\/v\/|watch\/\?v=|videos\/|reel\/|[^\/]+\/videos\/|[^\/]+\/posts\/|[^\/]+\/permalink\/)([^&\?]+)/;
  const newMatch = testUrl.match(newFacebookRegex);
  console.log('🔍 New regex match:', newMatch);
  console.log('🔍 Is valid with new regex:', !!newMatch);
  
  // ทดสอบ cleanFacebookUrl function
  function cleanFacebookUrl(url) {
    try {
      const urlObj = new URL(url);
      // ลบพารามิเตอร์ที่ไม่จำเป็น
      const paramsToRemove = ['mibextid', 's', 'ref', 'fref', '__tn__', 'eid', 'utm_source', 'utm_medium', 'utm_campaign'];
      paramsToRemove.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      return urlObj.toString();
    } catch (error) {
      // ถ้าไม่สามารถ parse URL ได้ ให้คืนค่าเดิม
      return url;
    }
  }
  
  const cleanedUrl = cleanFacebookUrl(testUrl);
  console.log('🧹 Cleaned URL:', cleanedUrl);
  
  // ทดสอบ validateAndConvertVideoUrl function
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
    const facebookRegex = /^(https?:\/\/)?(www\.)?(facebook\.com|web\.facebook\.com|fb\.watch)\/(share\/v\/|watch\/\?v=|videos\/|reel\/|[^\/]+\/videos\/|[^\/]+\/posts\/|[^\/]+\/permalink\/)([^&\?]+)/;
    const facebookMatch = trimmedUrl.match(facebookRegex);
    
    if (facebookMatch) {
      // ทำความสะอาด URL ก่อนเก็บ
      const cleanedUrl = cleanFacebookUrl(trimmedUrl);
      return {
        isValid: true,
        error: null,
        embedUrl: cleanedUrl, // Facebook ใช้ URL ที่ทำความสะอาดแล้ว
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
  
  const validation = validateAndConvertVideoUrl(testUrl);
  console.log('✅ Validation result:', validation);
  
  // ทดสอบ URL อื่นๆ
  const otherUrls = [
    'https://www.facebook.com/watch/?v=123456789',
    'https://fb.watch/abc123',
    'https://www.facebook.com/videos/123456789/',
    'https://web.facebook.com/share/v/1CYmrvUUBN/',
    'https://www.facebook.com/username/videos/123456789/'
  ];
  
  console.log('📋 Testing other URLs:');
  otherUrls.forEach(url => {
    const result = validateAndConvertVideoUrl(url);
    console.log(`📺 ${url}:`, result.isValid ? '✅ Valid' : '❌ Invalid', result.error || '');
  });
  
  // ตรวจสอบว่าปุ่มถูก disable หรือไม่
  console.log('🔍 Checking button state...');
  const addVideoButton = document.querySelector('button:has([data-testid="add-video-button"])');
  if (!addVideoButton) {
    // ลองหาปุ่มจาก text content
    const buttons = document.querySelectorAll('button');
    const addButton = Array.from(buttons).find(btn => 
      btn.textContent?.includes('เพิ่มวิดีโอ') || btn.textContent?.includes('เพิ่มวีดีโอ')
    );
    
    if (addButton) {
      console.log('🔘 Found add video button:', {
        disabled: addButton.disabled,
        text: addButton.textContent,
        className: addButton.className
      });
    } else {
      console.log('❌ Add video button not found');
    }
  } else {
    console.log('🔘 Found add video button (testid):', {
      disabled: addVideoButton.disabled,
      text: addVideoButton.textContent,
      className: addVideoButton.className
    });
  }
  
  // ตรวจสอบ input field
  const videoInput = document.querySelector('input[placeholder*="วิดีโอ"], input[placeholder*="YouTube"], input[placeholder*="Facebook"]');
  if (videoInput) {
    console.log('📝 Found video input:', {
      value: videoInput.value,
      placeholder: videoInput.placeholder,
      disabled: videoInput.disabled
    });
  } else {
    console.log('❌ Video input not found');
  }
}

// รันการทดสอบ
debugFacebookUrl();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.debugFacebookUrl = debugFacebookUrl;
}
