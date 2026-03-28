// Test script สำหรับทดสอบการอัปโหลดรูปภาพ
function testImageUpload() {
  console.log('📸 Testing Image Upload...');
  
  // 1. ตรวจสอบว่ามีไอคอนรูปภาพหรือไม่
  const checkImageIcon = () => {
    console.log('🔍 Checking image icon...');
    
    const imageButton = document.querySelector('button:has(.lucide-image)');
    if (imageButton) {
      console.log('✅ Image icon found');
      console.log('🎯 Image icon is clickable');
      
      // ตรวจสอบว่ามี Camera icon หรือไม่
      const cameraButton = document.querySelector('button:has(.lucide-camera)');
      if (!cameraButton) {
        console.log('✅ Camera icon removed successfully');
      } else {
        console.log('❌ Camera icon still exists');
      }
      
      return true;
    } else {
      console.log('❌ Image icon not found');
      return false;
    }
  };
  
  // 2. ทดสอบการคลิกปุ่มรูปภาพ
  const testImageClick = () => {
    console.log('🖱️ Testing image click...');
    
    const imageButton = document.querySelector('button:has(.lucide-image)');
    if (imageButton) {
      console.log('📸 Clicking image button...');
      imageButton.click();
      
      // ตรวจสอบว่ามี file input หรือไม่
      setTimeout(() => {
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          console.log('✅ File input found');
          console.log('📁 File input accepts:', fileInput.accept);
          console.log('📁 File input is hidden:', fileInput.classList.contains('hidden'));
        } else {
          console.log('❌ File input not found');
        }
      }, 100);
    }
  };
  
  // 3. ทดสอบการเลือกไฟล์
  const testFileSelection = () => {
    console.log('📁 Testing file selection...');
    
    // สร้างไฟล์จำลอง
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      console.log('📁 Creating mock file selection...');
      
      // สร้าง DataTransfer object
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);
      
      // จำลองการเลือกไฟล์
      const event = new Event('change', { bubbles: true });
      Object.defineProperty(event, 'target', {
        writable: false,
        value: fileInput
      });
      Object.defineProperty(event, 'currentTarget', {
        writable: false,
        value: fileInput
      });
      
      // จำลอง files array
      Object.defineProperty(fileInput, 'files', {
        writable: false,
        value: dataTransfer.files
      });
      
      fileInput.dispatchEvent(event);
      console.log('📁 Mock file selection triggered');
    }
  };
  
  // 4. ตรวจสอบสถานะการอัปโหลด
  const checkUploadStatus = () => {
    console.log('📊 Checking upload status...');
    
    const sendButton = document.querySelector('button:has(.lucide-send)');
    if (sendButton) {
      const isDisabled = sendButton.disabled;
      const hasSpinner = sendButton.querySelector('.animate-spin');
      
      console.log('📊 Send button disabled:', isDisabled);
      console.log('📊 Upload spinner visible:', !!hasSpinner);
      
      if (isDisabled && hasSpinner) {
        console.log('✅ Upload in progress');
      } else if (!isDisabled && !hasSpinner) {
        console.log('✅ Upload completed');
      } else {
        console.log('⚠️ Upload status unclear');
      }
    }
  };
  
  // 5. ตรวจสอบการแสดงรูปภาพในแชท
  const checkImageDisplay = () => {
    console.log('🖼️ Checking image display in chat...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let foundImages = 0;
    
    messageElements.forEach((element) => {
      const images = element.querySelectorAll('img[alt="รูปภาพในแชท"]');
      if (images.length > 0) {
        foundImages++;
        console.log('🖼️ Found message with image:', images.length);
        
        // ตรวจสอบว่ารูปภาพสามารถคลิกได้
        images.forEach((img) => {
          const isClickable = img.onclick !== null;
          console.log('🖱️ Image clickable:', isClickable);
          console.log('🔗 Image src:', img.src.substring(0, 50) + '...');
        });
      }
    });
    
    console.log('🖼️ Total messages with images:', foundImages);
    
    if (foundImages > 0) {
      console.log('✅ Image display working correctly');
    } else {
      console.log('⚠️ No images found in chat');
    }
  };
  
  // 6. ตรวจสอบ console logs
  const checkConsoleLogs = () => {
    console.log('📋 Expected console logs for image upload:');
    console.log('  📤 Uploading image: [filename]');
    console.log('  📊 File size: [size]');
    console.log('  📊 File type: [type]');
    console.log('  ✅ Upload successful: [upload data]');
    console.log('  🔗 Public URL: [url]');
    console.log('  ✅ Message with image inserted successfully: [message data]');
    console.log('  🎉 Toast: "อัปโหลดรูปภาพสำเร็จ"');
  };
  
  // 7. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting Image Upload Test...\n');
    
    // ตรวจสอบ UI components
    const iconTest = checkImageIcon();
    if (!iconTest) {
      console.log('❌ Image icon test failed');
      return;
    }
    
    // ทดสอบการคลิก
    testImageClick();
    
    // รอ 1 วินาทีแล้วตรวจสอบการเลือกไฟล์
    setTimeout(() => {
      testFileSelection();
    }, 500);
    
    // รอ 2 วินาทีแล้วตรวจสอบสถานะการอัปโหลด
    setTimeout(() => {
      checkUploadStatus();
    }, 1000);
    
    // รอ 3 วินาทีแล้วตรวจสอบการแสดงรูปภาพ
    setTimeout(() => {
      checkImageDisplay();
    }, 2000);
    
    // แสดง console logs ที่ควรเห็น
    checkConsoleLogs();
    
    console.log('\n💡 Manual Test Instructions:');
    console.log('  1. คลิกปุ่มรูปภาพ (Image icon)');
    console.log('  2. เลือกไฟล์รูปภาพจากเครื่อง');
    console.log('  3. ตรวจสอบว่ามีการอัปโหลดไปยัง Supabase Storage');
    console.log('  4. ตรวจสอบว่า URL ถูกบันทึกใน public_chats');
    console.log('  5. ตรวจสอบว่ารูปภาพแสดงในแชท');
    console.log('  6. ตรวจสอบว่ารูปภาพสามารถคลิกเพื่อดูขนาดใหญ่');
    
    console.log('\n🎯 Expected Results:');
    console.log('  ✅ Image icon clickable');
    console.log('  ✅ File dialog opens');
    console.log('  ✅ Image uploads to chat_images bucket');
    console.log('  ✅ URL saved to public_chats table');
    console.log('  ✅ Image displays in chat bubble');
    console.log('  ✅ Image clickable to view full size');
    console.log('  ✅ Toast notification on success');
    
    console.log('\n🏁 Image Upload Test Completed!');
  };
  
  runAllTests();
}

window.testImageUpload = testImageUpload;
