// Test script สำหรับทดสอบ Facebook video embed
// รันใน browser console

function testFacebookVideo() {
  console.log('🎬 Testing Facebook video embed...');
  
  // ทดสอบ URL ต่างๆ
  const testUrls = [
    'https://www.facebook.com/watch/?v=123456789',
    'https://www.facebook.com/videos/123456789/',
    'https://fb.watch/abc123',
    'https://www.facebook.com/username/videos/123456789/',
    'https://www.facebook.com/username/posts/123456789/'
  ];
  
  testUrls.forEach(url => {
    console.log('🔍 Testing URL:', url);
    
    // สร้าง embed URL
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=640&height=360`;
    console.log('📺 Embed URL:', embedUrl);
    
    // ทดสอบว่าสามารถโหลดได้หรือไม่
    fetch(embedUrl, { method: 'HEAD' })
      .then(response => {
        console.log('✅ Response status:', response.status);
        console.log('✅ Response headers:', response.headers.get('content-type'));
      })
      .catch(error => {
        console.log('❌ Error:', error);
      });
  });
  
  // ทดสอบ iframe ในหน้าปัจจุบัน
  console.log('🔍 Checking iframes in page...');
  const iframes = document.querySelectorAll('iframe');
  console.log('📺 Found iframes:', iframes.length);
  
  iframes.forEach((iframe, index) => {
    console.log(`📺 Iframe ${index}:`, {
      src: iframe.src,
      title: iframe.title,
      width: iframe.width,
      height: iframe.height
    });
    
    // ตรวจสอบว่าเป็น Facebook iframe หรือไม่
    if (iframe.src.includes('facebook.com')) {
      console.log('🔍 Facebook iframe found:', iframe.src);
      
      // ตรวจสอบว่าโหลดได้หรือไม่
      iframe.addEventListener('load', () => {
        console.log('✅ Facebook iframe loaded successfully');
      });
      
      iframe.addEventListener('error', () => {
        console.log('❌ Facebook iframe failed to load');
      });
    }
  });
  
  // ทดสอบ component FacebookVideoEmbed
  console.log('🔍 Checking FacebookVideoEmbed components...');
  const facebookEmbeds = document.querySelectorAll('[data-testid="facebook-video-embed"]');
  console.log('📺 Facebook embed components:', facebookEmbeds.length);
}

// รันการทดสอบ
testFacebookVideo();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testFacebookVideo = testFacebookVideo;
}
