// Test script สำหรับทดสอบปุ่มเพิ่มวิดีโอ
// รันใน browser console

function testVideoButton() {
  console.log('🔘 Testing video add button...');
  
  // หาปุ่มเพิ่มวิดีโอ
  const buttons = document.querySelectorAll('button');
  const addButton = Array.from(buttons).find(btn => 
    btn.textContent?.includes('เพิ่มวิดีโอ') || 
    btn.textContent?.includes('เพิ่มวีดีโอ') ||
    btn.textContent?.includes('เพิ่ม')
  );
  
  if (addButton) {
    console.log('🔘 Found add video button:', {
      text: addButton.textContent,
      disabled: addButton.disabled,
      className: addButton.className,
      innerHTML: addButton.innerHTML
    });
    
    // ตรวจสอบสาเหตุที่ปุ่มถูก disable
    if (addButton.disabled) {
      console.log('❌ Button is disabled. Checking reasons...');
      
      // ตรวจสอบ input field
      const videoInput = document.querySelector('input[placeholder*="วิดีโอ"], input[placeholder*="YouTube"], input[placeholder*="Facebook"], input[type="text"]');
      if (videoInput) {
        console.log('📝 Video input state:', {
          value: videoInput.value,
          isEmpty: !videoInput.value.trim(),
          placeholder: videoInput.placeholder,
          disabled: videoInput.disabled
        });
      } else {
        console.log('❌ Video input not found');
      }
      
      // ตรวจสอบ uploadingVideo state
      console.log('📤 Checking uploading state...');
      const uploadingIndicators = document.querySelectorAll('.animate-spin, [data-state="uploading"]');
      console.log('📤 Uploading indicators found:', uploadingIndicators.length);
      
      // ตรวจสอบ validation state
      console.log('🔍 Checking validation...');
      
      // จำลองการพิมพ์ URL
      if (videoInput) {
        console.log('📝 Simulating URL input...');
        const testUrl = 'https://web.facebook.com/share/v/1CYmrvUUBN/';
        
        // ตั้งค่า input
        videoInput.value = testUrl;
        videoInput.dispatchEvent(new Event('input', { bubbles: true }));
        videoInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log('📝 Input value set to:', testUrl);
        console.log('📝 Input value after dispatch:', videoInput.value);
        
        // รอสักครู่แล้วตรวจสอบปุ่มอีกครั้ง
        setTimeout(() => {
          console.log('🔘 Button state after input:', {
            disabled: addButton.disabled,
            text: addButton.textContent
          });
          
          // ลองคลิกปุ่ม
          if (!addButton.disabled) {
            console.log('🖱️ Attempting to click button...');
            addButton.click();
            
            // ตรวจสอบว่าเกิดอะไรขึ้น
            setTimeout(() => {
              console.log('🔍 Checking after click...');
              
              // ตรวจสอบ toast notifications
              const toasts = document.querySelectorAll('[data-sonner-toast], .toast, [role="alert"]');
              console.log('🍞 Toast notifications found:', toasts.length);
              toasts.forEach((toast, index) => {
                console.log(`🍞 Toast ${index + 1}:`, toast.textContent);
              });
              
              // ตรวจสอบ console errors
              console.log('🔍 Check browser console for errors...');
            }, 1000);
          } else {
            console.log('❌ Button is still disabled');
          }
        }, 500);
      }
    } else {
      console.log('✅ Button is enabled, attempting to click...');
      addButton.click();
      
      setTimeout(() => {
        console.log('🔍 Checking after click...');
        
        // ตรวจสอบ toast notifications
        const toasts = document.querySelectorAll('[data-sonner-toast], .toast, [role="alert"]');
        console.log('🍞 Toast notifications found:', toasts.length);
        toasts.forEach((toast, index) => {
          console.log(`🍞 Toast ${index + 1}:`, toast.textContent);
        });
      }, 1000);
    }
  } else {
    console.log('❌ Add video button not found');
    
    // หาปุ่มทั้งหมดเพื่อ debug
    console.log('🔘 All buttons found:');
    buttons.forEach((btn, index) => {
      console.log(`🔘 Button ${index + 1}:`, {
        text: btn.textContent,
        disabled: btn.disabled,
        className: btn.className
      });
    });
  }
  
  // ตรวจสอบว่ามีฟอร์มเพิ่มวิดีโอหรือไม่
  const videoForm = document.querySelector('[data-testid="video-form"], .video-form, form');
  if (videoForm) {
    console.log('📝 Video form found:', videoForm);
  } else {
    console.log('❌ Video form not found');
  }
  
  // ตรวจสอบว่าเป็นเจ้าของโปรไฟล์หรือไม่
  console.log('👤 Checking ownership...');
  const editButtons = document.querySelectorAll('button:has([data-testid="edit"]), button:contains("แก้ไข"), button:contains("แก้ไขโปรไฟล์")');
  console.log('👤 Edit buttons found:', editButtons.length);
  
  if (editButtons.length === 0) {
    console.log('❌ No edit buttons found - user may not be profile owner');
  } else {
    console.log('✅ Edit buttons found - user is likely profile owner');
  }
}

// รันการทดสอบ
testVideoButton();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testVideoButton = testVideoButton;
}
