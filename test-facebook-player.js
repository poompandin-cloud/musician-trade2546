// Test script สำหรับทดสอบ Facebook video player
// รันใน browser console

function testFacebookPlayer() {
  console.log('🎬 Testing Facebook video player...');
  
  // หา Facebook video players ทั้งหมด
  const facebookPlayers = document.querySelectorAll('[data-testid="facebook-video-player"]');
  console.log('📺 Facebook video players found:', facebookPlayers.length);
  
  // หา iframes ทั้งหมด
  const iframes = document.querySelectorAll('iframe');
  console.log('📺 Total iframes found:', iframes.length);
  
  iframes.forEach((iframe, index) => {
    console.log(`📺 Iframe ${index + 1}:`, {
      src: iframe.src,
      title: iframe.title,
      width: iframe.width,
      height: iframe.height,
      frameborder: iframe.frameBorder,
      allow: iframe.allow,
      sandbox: iframe.sandbox
    });
    
    // ตรวจสอบว่าเป็น Facebook iframe หรือไม่
    if (iframe.src.includes('facebook.com')) {
      console.log('📘 Facebook iframe found:', iframe.src);
      
      // ตรวจสอบว่ามี loading state หรือไม่
      const parent = iframe.parentElement;
      if (parent) {
        const loadingElements = parent.querySelectorAll('.animate-spin');
        console.log('⏳ Loading elements found:', loadingElements.length);
      }
      
      // ตรวจสอบว่าโหลดได้หรือไม่
      iframe.addEventListener('load', () => {
        console.log('✅ Facebook iframe loaded successfully');
      });
      
      iframe.addEventListener('error', () => {
        console.log('❌ Facebook iframe failed to load');
      });
      
      // ตรวจสอบว่ามี error หรือไม่
      setTimeout(() => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            console.log('📄 Iframe content accessible');
          } else {
            console.log('🚫 Iframe content not accessible (cross-origin)');
          }
        } catch (error) {
          console.log('🚫 Iframe content blocked:', error.message);
        }
      }, 2000);
    }
  });
  
  // หา fallback components
  const fallbacks = document.querySelectorAll('[data-testid="video-fallback"]');
  console.log('🔄 Fallback components found:', fallbacks.length);
  
  fallbacks.forEach((fallback, index) => {
    console.log(`🔄 Fallback ${index + 1}:`, {
      text: fallback.textContent,
      platform: fallback.getAttribute('data-platform'),
      url: fallback.getAttribute('data-url')
    });
  });
  
  // ทดสอบ URL ที่ใช้ใน iframe
  const testUrl = 'https://web.facebook.com/share/v/1CYmrvUUBN/';
  console.log('🔍 Testing URL:', testUrl);
  
  // สร้าง embed URL
  const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(testUrl)}&show_text=false&width=640&height=360&autoplay=false&allowfullscreen=true&lazy=true`;
  console.log('📺 Embed URL:', embedUrl);
  
  // ทดสอบว่า embed URL สามารถเข้าถึงได้หรือไม่
  fetch(embedUrl, { method: 'HEAD' })
    .then(response => {
      console.log('🌐 Embed URL response:', response.status);
      console.log('🌐 Embed URL headers:', response.headers.get('content-type'));
    })
    .catch(error => {
      console.log('❌ Embed URL error:', error);
    });
  
  // ตรวจสอบ console errors
  console.log('🔍 Check browser console for any errors...');
  
  // ตรวจสอบว่ามีการ block จาก browser หรือไม่
  setTimeout(() => {
    const blockedIframes = Array.from(iframes).filter(iframe => {
      try {
        return iframe.contentDocument === null;
      } catch (error) {
        return true;
      }
    });
    
    console.log('🚫 Blocked iframes:', blockedIframes.length);
    
    if (blockedIframes.length > 0) {
      console.log('💡 Suggestion: Facebook videos may be blocked due to privacy settings or browser policies');
      console.log('💡 Try opening the video directly in Facebook:', testUrl);
    }
  }, 3000);
}

// รันการทดสอบ
testFacebookPlayer();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testFacebookPlayer = testFacebookPlayer;
}
