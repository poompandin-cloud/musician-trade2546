// Test script สำหรับทดสอบ Avatar Navigation
function testAvatarNavigation() {
  console.log('👤 Testing Avatar Navigation...');
  
  // 1. ตรวจสอบว่ามีข้อความที่ไม่ใช่ของเรา (คนอื่นส่ง)
  const otherMessages = document.querySelectorAll('.flex.justify-start');
  console.log(`📨 พบข้อความจากคนอื่น: ${otherMessages.length} ข้อความ`);
  
  if (otherMessages.length === 0) {
    console.log('⚠️ ไม่พบข้อความจากคนอื่น ไม่สามารถทดสอบ Avatar navigation ได้');
    return;
  }
  
  // 2. ตรวจสอบ Avatar และชื่อผู้ส่ง
  let avatarCount = 0;
  let nameCount = 0;
  let clickableAvatars = 0;
  let clickableNames = 0;
  
  otherMessages.forEach((message, index) => {
    const avatar = message.querySelector('.avatar');
    const nameElement = message.querySelector('.text-xs.text-gray-600');
    
    if (avatar) {
      avatarCount++;
      const avatarContainer = avatar.parentElement;
      
      if (avatarContainer) {
        const hasCursor = avatarContainer.classList.contains('cursor-pointer');
        const hasHover = avatarContainer.classList.contains('hover:opacity-80');
        const hasTransition = avatarContainer.classList.contains('transition-opacity');
        const hasOnClick = avatarContainer.onclick;
        
        console.log(`  👤 Avatar ${index + 1}:`);
        console.log(`    🖱️  Cursor pointer: ${hasCursor}`);
        console.log(`    ✨ Hover effect: ${hasHover}`);
        console.log(`    🎭 Transition: ${hasTransition}`);
        console.log(`    📋 onClick handler: ${!!hasOnClick}`);
        
        if (hasCursor && hasOnClick) {
          clickableAvatars++;
          console.log(`    ✅ Avatar สามารถคลิกได้`);
        }
      }
    }
    
    if (nameElement) {
      nameCount++;
      const hasCursor = nameElement.classList.contains('cursor-pointer');
      const hasHover = nameElement.classList.contains('hover:underline');
      const hasColorChange = nameElement.classList.contains('hover:text-blue-600');
      const hasTransition = nameElement.classList.contains('transition-colors');
      const hasOnClick = nameElement.onclick;
      
      console.log(`  📝 ชื่อ ${index + 1}:`);
      console.log(`    🖱️  Cursor pointer: ${hasCursor}`);
      console.log(`    🔗 Hover underline: ${hasHover}`);
      console.log(`    🎨 Color change: ${hasColorChange}`);
      console.log(`    🎭 Transition: ${hasTransition}`);
      console.log(`    📋 onClick handler: ${!!hasOnClick}`);
      
      if (hasCursor && hasOnClick) {
        clickableNames++;
        console.log(`    ✅ ชื่อสามารถคลิกได้`);
      }
    }
  });
  
  console.log(`\n📊 สรุปการทดสอบ:`);
  console.log(`  👤 จำนวน Avatar ทั้งหมด: ${avatarCount}`);
  console.log(`  🔗 จำนวน Avatar ที่คลิกได้: ${clickableAvatars}`);
  console.log(`  📝 จำนวนชื่อทั้งหมด: ${nameCount}`);
  console.log(`  🔗 จำนวนชื่อที่คลิกได้: ${clickableNames}`);
  
  // 3. ทดสอบการคลิกจริง
  const testClick = (element, elementType) => {
    if (element && element.onclick) {
      console.log(`\n🧪 ทดสอบการคลิก ${elementType}...`);
      
      // ดักจับ event ก่อนคลิก
      const originalOnClick = element.onclick;
      let clickTriggered = false;
      
      element.onclick = (e) => {
        clickTriggered = true;
        console.log(`✅ ${elementType} ถูกคลิกแล้ว!`);
        
        // เรียกฟังก์ชันเดิม
        return originalOnClick.call(element, e);
      };
      
      // จำลองการคลิก
      element.click();
      
      if (clickTriggered) {
        console.log(`🎯 ${elementType} navigation ทำงานได้`);
      } else {
        console.log(`❌ ${elementType} navigation ไม่ทำงาน`);
      }
      
      // คืนค่าฟังก์ชันเดิม
      element.onclick = originalOnClick;
    }
  };
  
  // ทดสอบคลิก Avatar และชื่อตัวแรก
  if (otherMessages.length > 0) {
    const firstAvatar = otherMessages[0].querySelector('.avatar')?.parentElement;
    const firstName = otherMessages[0].querySelector('.text-xs.text-gray-600');
    
    if (firstAvatar) {
      testClick(firstAvatar, 'Avatar');
    }
    
    if (firstName) {
      testClick(firstName, 'ชื่อผู้ส่ง');
    }
  }
  
  // 4. ตรวจสอบว่ามี user_id ในข้อมูล
  console.log(`\n🔍 ตรวจสอบ user_id ในข้อมูลข้อความ:`);
  
  // ตรวจสอบจาก React state (ถ้ามี)
  if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔧 ตรวจสอบผ่าน React DevTools...');
    console.log('  💡 ให้ตรวจสอบใน React DevTools ว่า message objects มี user_id');
  } else {
    console.log('📝 ตรวจสอบจาก DOM ไม่ได้ ต้องตรวจสองจาก React state');
    console.log('  💡 ให้ตรวจสอบใน Component state ว่ามี user_id ครบถ้วน');
  }
  
  // 5. แนะนำการทดสอบเพิ่มเติม
  console.log(`\n💡 การทดสอบเพิ่มเติม:`);
  console.log(`  1. คลิก Avatar ของคนอื่น → ควรไปหน้า /profile/[user_id]`);
  console.log(`  2. คลิกชื่อผู้ส่ง → ควรไปหน้า /profile/[user_id]`);
  console.log(`  3. ตรวจสอบว่า path ถูกต้องตามระบบ`);
  console.log(`  4. ทดสอบ hover effects บน Avatar และชื่อ`);
  console.log(`  5. ตรวจสอบว่า profile page โหลดถูกต้อง`);
  
  console.log(`\n👤 Avatar Navigation test completed!`);
}

window.testAvatarNavigation = testAvatarNavigation;
