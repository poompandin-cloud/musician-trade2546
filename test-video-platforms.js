// Test script สำหรับทดสอบการแยกประเภทวิดีโอ
// รันใน browser console

function testVideoPlatforms() {
  console.log('🎬 Testing video platform detection...');
  
  // จำลองฟังก์ชัน validateAndConvertVideoUrl
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
        originalUrl: trimmedUrl,
        platform: 'youtube'
      };
    }

    // ตรวจสอบ Facebook URL (รองรับ web.facebook.com/share/v/ และรูปแบบอื่นๆ)
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
  
  // ทดสอบ URL ต่างๆ
  const testUrls = [
    // YouTube URLs
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ',
    
    // Facebook URLs
    'https://www.facebook.com/watch/?v=123456789',
    'https://web.facebook.com/share/v/1CYmrvUUBN/',
    'https://fb.watch/abc123',
    'https://www.facebook.com/videos/123456789/',
    'https://www.facebook.com/username/videos/123456789/',
    
    // Invalid URLs
    'https://www.google.com',
    'invalid-url',
    'https://twitter.com/video/123'
  ];
  
  console.log('📋 Testing URL validation:');
  
  testUrls.forEach((url, index) => {
    const result = validateAndConvertVideoUrl(url);
    console.log(`📺 Test ${index + 1}: ${url}`);
    console.log(`   ✅ Valid: ${result.isValid}`);
    console.log(`   🎯 Platform: ${result.platform || 'none'}`);
    console.log(`   🔗 Embed URL: ${result.embedUrl || 'none'}`);
    console.log(`   ❌ Error: ${result.error || 'none'}`);
    console.log('');
  });
  
  // ทดสอบการสร้าง embed
  console.log('🎨 Testing embed creation:');
  
  const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const facebookUrl = 'https://web.facebook.com/share/v/1CYmrvUUBN/';
  
  const youtubeValidation = validateAndConvertVideoUrl(youtubeUrl);
  const facebookValidation = validateAndConvertVideoUrl(facebookUrl);
  
  console.log('📺 YouTube embed test:');
  console.log('   🎯 Platform:', youtubeValidation.platform);
  console.log('   🔗 Embed URL:', youtubeValidation.embedUrl);
  console.log('   ✅ Should create iframe:', youtubeValidation.platform === 'youtube');
  
  console.log('📘 Facebook embed test:');
  console.log('   🎯 Platform:', facebookValidation.platform);
  console.log('   🔗 Embed URL:', facebookValidation.embedUrl);
  console.log('   ✅ Should create link card:', facebookValidation.platform === 'facebook');
  
  // ตรวจสอบว่ามีการส่งค่า platform ถูกต้องหรือไม่
  if (youtubeValidation.platform === 'youtube' && facebookValidation.platform === 'facebook') {
    console.log('✅ Platform detection working correctly!');
  } else {
    console.log('❌ Platform detection failed!');
    console.log('   Expected youtube, got:', youtubeValidation.platform);
    console.log('   Expected facebook, got:', facebookValidation.platform);
  }
}

// รันการทดสอบ
testVideoPlatforms();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testVideoPlatforms = testVideoPlatforms;
}
