// Debug script สำหรับทดสอบการเพิ่มวิดีโอ
// รันใน browser console

function debugVideoAdd() {
  console.log('🎬 Debugging video addition process...');
  
  // 1. ตรวจสอบปุ่มเพิ่มวิดีโอ
  console.log('🔘 Checking add video button...');
  const addButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('เพิ่มวิดีโอ') || 
    btn.textContent?.includes('เพิ่มวีดีโอ')
  );
  
  if (addButton) {
    console.log('✅ Add video button found:', {
      disabled: addButton.disabled,
      text: addButton.textContent,
      className: addButton.className
    });
  } else {
    console.log('❌ Add video button not found');
  }
  
  // 2. ตรวจสอบ input field
  console.log('📝 Checking video input field...');
  const videoInput = document.querySelector('input[placeholder*="วิดีโอ"], input[placeholder*="YouTube"], input[placeholder*="Facebook"]');
  if (videoInput) {
    console.log('✅ Video input found:', {
      value: videoInput.value,
      placeholder: videoInput.placeholder,
      disabled: videoInput.disabled
    });
  } else {
    console.log('❌ Video input not found');
  }
  
  // 3. ตรวจสอบวิดีโอปัจจุบัน
  console.log('📺 Checking current videos...');
  const videoElements = document.querySelectorAll('[data-testid="video-embed"]');
  console.log('📺 Video elements found:', videoElements.length);
  
  videoElements.forEach((element, index) => {
    console.log(`📺 Video ${index + 1}:`, {
      element: element,
      isYouTube: element.querySelector('iframe[src*="youtube"]'),
      isFacebook: element.querySelector('a[href*="facebook"]'),
      src: element.querySelector('iframe')?.src || element.querySelector('a')?.href
    });
  });
  
  // 4. จำลองการเพิ่มวิดีโอ
  console.log('🧪 Simulating video addition...');
  if (videoInput && addButton) {
    // ทดสอบ URL ต่างๆ
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://web.facebook.com/share/v/1CYmrvUUBN/',
      'https://www.facebook.com/watch/?v=123456789'
    ];
    
    testUrls.forEach((testUrl, index) => {
      console.log(`🧪 Testing URL ${index + 1}: ${testUrl}`);
      
      // ตั้งค่า input
      videoInput.value = testUrl;
      videoInput.dispatchEvent(new Event('input', { bubbles: true }));
      videoInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // รอสักครู่แล้วตรวจสอบปุ่ม
      setTimeout(() => {
        console.log(`🔘 Button state after input ${index + 1}:`, {
          disabled: addButton.disabled,
          text: addButton.textContent
        });
        
        // ลองคลิกปุ่ม
        if (!addButton.disabled) {
          console.log(`🖱️ Attempting to click button for URL ${index + 1}...`);
          addButton.click();
          
          // ตรวจสอบผลลัพธ์
          setTimeout(() => {
            console.log('🔍 Checking after click...');
            
            // ตรวจสอบ toast notifications
            const toasts = document.querySelectorAll('[data-sonner-toast], .toast, [role="alert"]');
            console.log('🍞 Toast notifications found:', toasts.length);
            toasts.forEach((toast, i) => {
              console.log(`🍞 Toast ${i + 1}:`, toast.textContent);
            });
            
            // ตรวจสอบว่ามีวิดีโอเพิ่มเข้ามาหรือไม่
            const newVideoElements = document.querySelectorAll('[data-testid="video-embed"]');
            console.log('📺 Video elements after click:', newVideoElements.length);
            
            // ตรวจสอบ console logs
            console.log('🔍 Check browser console for debug logs...');
          }, 2000);
        }
      }, 500);
    });
  }
  
  // 5. ตรวจสอบ validateAndConvertVideoUrl function
  console.log('🔍 Testing validateAndConvertVideoUrl function...');
  
  // จำลองฟังก์ชัน (ถ้าสามารถเข้าถึงได้)
  if (typeof window.validateAndConvertVideoUrl === 'function') {
    const testValidation = window.validateAndConvertVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    console.log('✅ Validation test result:', testValidation);
  } else {
    console.log('❌ validateAndConvertVideoUrl function not accessible from window');
  }
  
  // 6. ตรวจสอบ state และ props
  console.log('🔍 Checking component state...');
  console.log('📊 Current URL:', window.location.href);
  console.log('👤 Profile ID:', new URLSearchParams(window.location.search).get('id'));
  
  // ตรวจสอบว่าเป็นเจ้าของโปรไฟล์หรือไม่
  const editButtons = document.querySelectorAll('button:has([data-testid="edit"]), button:contains("แก้ไข")');
  console.log('👤 Edit buttons found:', editButtons.length);
  console.log('👤 Is owner:', editButtons.length > 0);
}

// รันการทดสอบ
debugVideoAdd();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.debugVideoAdd = debugVideoAdd;
}
