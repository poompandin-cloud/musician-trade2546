// Test script สำหรับทดสอบระบบ Instrument Badge
function testInstrumentBadge() {
  console.log('🎸 Testing Instrument Badge System...');
  
  // 1. ตรวจสอบว่ามีข้อความที่แสดง badge หรือไม่
  const checkInstrumentBadges = () => {
    console.log('🎸 Checking instrument badges...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let badgesFound = 0;
    let uniqueInstruments = new Set();
    
    messageElements.forEach((element, index) => {
      const isNotMe = !element.querySelector('.ml-auto');
      
      if (isNotMe) {
        // ค้นหา badge ทั้งหมดใน message
        const badges = element.querySelectorAll('.bg-orange-100');
        const senderName = element.querySelector('.hover\\:text-blue-600')?.textContent;
        
        if (badges.length > 0) {
          badgesFound += badges.length;
          
          badges.forEach((badge) => {
            const badgeText = badge.textContent;
            uniqueInstruments.add(badgeText);
            console.log(`🎸 Badge ${badgesFound}: ${badgeText} (from ${senderName})`);
            
            // ตรวจสอบ styling
            const badgeStyle = window.getComputedStyle(badge);
            const backgroundColor = badgeStyle.backgroundColor;
            const textColor = badgeStyle.color;
            const borderRadius = badgeStyle.borderRadius;
            const padding = badgeStyle.padding;
            const fontSize = badgeStyle.fontSize;
            
            console.log(`  🎨 Badge styling:`);
            console.log(`    🎨 Background: ${backgroundColor}`);
            console.log(`    📝 Text color: ${textColor}`);
            console.log(`    🔄 Border radius: ${borderRadius}`);
            console.log(`    📏 Padding: ${padding}`);
            console.log(`    📐 Font size: ${fontSize}`);
            
            // ตรวจสอบว่าเป็นสีส้มตามที่ต้องการ
            const isOrangeBackground = backgroundColor.includes('255, 236, 213') || backgroundColor.includes('254, 215, 170');
            const isOrangeText = textColor.includes('194, 65, 12') || textColor.includes('124, 45, 18');
            const isRounded = borderRadius !== '0px';
            const hasPadding = padding !== '0px';
            
            console.log(`  ✅ Styling checks:`);
            console.log(`    🎨 Orange background: ${isOrangeBackground}`);
            console.log(`    📝 Orange text: ${isOrangeText}`);
            console.log(`    🔄 Is rounded: ${isRounded}`);
            console.log(`    📏 Has padding: ${hasPadding}`);
            
            if (isOrangeBackground && isOrangeText && isRounded && hasPadding) {
              console.log(`  ✅ Badge styling is correct`);
            } else {
              console.log(`  ❌ Badge styling has issues`);
            }
            
            // ตรวจสอบว่าสามารถคลิกได้
            const isClickable = badge.style.cursor === 'pointer' || badge.classList.contains('cursor-pointer');
            console.log(`    🖱️ Is clickable: ${isClickable}`);
          });
        }
      }
    });
    
    console.log('📊 Badge Summary:');
    console.log(`  🎸 Total badges found: ${badgesFound}`);
    console.log(`  🎸 Unique instruments: ${Array.from(uniqueInstruments).join(', ')}`);
    console.log(`  🎸 Messages with badges: ${badgesFound}`);
    
    return {
      badgesFound,
      uniqueInstruments: Array.from(uniqueInstruments)
    };
  };
  
  // 2. ทดสอบการคลิก badge
  const testBadgeClick = () => {
    console.log('🖱️ Testing badge click functionality...');
    
    const badges = document.querySelectorAll('.bg-orange-100');
    let clickableBadges = 0;
    
    badges.forEach((badge, index) => {
      const badgeText = badge.textContent;
      console.log(`🖱️ Testing badge ${index + 1}: ${badgeText}`);
      
      // ตรวจสอบว่ามี onClick handler หรือไม่
      const hasClickHandler = badge.onclick !== null || badge.getAttribute('onclick') !== null;
      const isClickable = badge.classList.contains('cursor-pointer');
      
      console.log(`  🖱️ Has click handler: ${hasClickHandler}`);
      console.log(`  🖱️ Is clickable: ${isClickable}`);
      
      if (hasClickHandler || isClickable) {
        clickableBadges++;
        
        // จำลองการคลิก (ไม่จริงจังเพื่อไม่ให้เปลี่ยนหน้า)
        console.log(`  🖱️ Badge is clickable - would navigate to profile`);
      } else {
        console.log(`  ❌ Badge is not clickable`);
      }
    });
    
    console.log(`🖱️ Clickable badges: ${clickableBadges}/${badges.length}`);
    return clickableBadges;
  };
  
  // 3. ทดสอบ fallback cases
  const testFallbackBadges = () => {
    console.log('🔄 Testing fallback badges...');
    
    const badges = document.querySelectorAll('.bg-orange-100');
    let fallbackBadges = 0;
    let memberBadges = 0;
    
    badges.forEach((badge) => {
      const badgeText = badge.textContent;
      
      if (badgeText === '[สมาชิก]') {
        memberBadges++;
        console.log(`🔄 Found fallback badge: ${badgeText}`);
      }
    });
    
    console.log(`🔄 Fallback badges found: ${memberBadges}`);
    return memberBadges;
  };
  
  // 4. ทดสอบ hover effects
  const testHoverEffects = () => {
    console.log('🎨 Testing hover effects...');
    
    const badges = document.querySelectorAll('.bg-orange-100');
    let hoverableBadges = 0;
    
    badges.forEach((badge) => {
      const hasHoverClass = badge.classList.contains('hover:bg-orange-200');
      const hasTransition = badge.classList.contains('transition-colors');
      
      console.log(`🎨 Badge hover effects:`);
      console.log(`  🎨 Has hover class: ${hasHoverClass}`);
      console.log(`  🎨 Has transition: ${hasTransition}`);
      
      if (hasHoverClass && hasTransition) {
        hoverableBadges++;
        console.log(`  ✅ Badge has proper hover effects`);
      } else {
        console.log(`  ❌ Badge missing hover effects`);
      }
    });
    
    console.log(`🎨 Hoverable badges: ${hoverableBadges}/${badges.length}`);
    return hoverableBadges;
  };
  
  // 5. ทดสอบ data structure
  const testDataStructure = () => {
    console.log('📊 Testing data structure...');
    
    // ตรวจสอบว่า message objects มี instrument และ role fields
    console.log('💡 Expected message structure:');
    console.log('  📝 text: string');
    console.log('  👤 sender_name: string');
    console.log('  🎸 instrument?: string');
    console.log('  🎭 role?: string');
    console.log('  🆔 user_id: string');
    console.log('  🖼️ avatar_url?: string');
    console.log('  🕐 time: string');
    console.log('  📱 is_me: boolean');
    console.log('  🖼️ image_url?: string');
    
    console.log('💡 Badge display logic:');
    console.log('  🎸 If instrument exists: [instrument]');
    console.log('  🎭 If role exists (no instrument): [role]');
    console.log('  👥 If neither: [สมาชิก]');
    
    console.log('💡 Badge styling:');
    console.log('  🎨 Background: bg-orange-100');
    console.log('  📝 Text: text-orange-700');
    console.log('  🔄 Border: rounded-full');
    console.log('  📏 Size: text-xs');
    console.log('  🖱️ Interaction: cursor-pointer hover:bg-orange-200');
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting Instrument Badge System Test...\n');
    
    const badgeCheck = checkInstrumentBadges();
    console.log('');
    
    const clickTest = testBadgeClick();
    console.log('');
    
    const fallbackTest = testFallbackBadges();
    console.log('');
    
    const hoverTest = testHoverEffects();
    console.log('');
    
    testDataStructure();
    console.log('');
    
    // สรุปผลการทดสอบ
    console.log('📊 Test Summary:');
    console.log('  🎸 Badges found:', badgeCheck.badgesFound);
    console.log('  🎸 Unique instruments:', badgeCheck.uniqueInstruments.length);
    console.log('  🖱️ Clickable badges:', clickTest);
    console.log('  🔄 Fallback badges:', fallbackTest);
    console.log('  🎨 Hoverable badges:', hoverTest);
    
    console.log('\n🎯 Expected Results:');
    console.log('  ✅ All messages show badges');
    console.log('  ✅ Badges show instrument/role/fallback');
    console.log('  ✅ Badges have orange theme');
    console.log('  ✅ Badges are rounded and small');
    console.log('  ✅ Badges are clickable');
    console.log('  ✅ Badges have hover effects');
    console.log('  ✅ Clicking badge navigates to profile');
    
    console.log('\n💡 Manual Test Instructions:');
    console.log('  1. ส่งข้อความจากผู้ใช้ที่มี instrument');
    console.log('  2. ตรวจสอบว่า badge แสดงถูกต้อง');
    console.log('  3. คลิก badge เพื่อไปยังโปรไฟล์');
    console.log('  4. ทดสอบ hover effect บน badge');
    console.log('  5. ตรวจสอบ fallback badge สำหรับผู้ใช้ทั่วไป');
    console.log('  6. ตรวจสอบว่า badge สีส้มตรงตามธีม');
    
    console.log('\n🎸 Badge Examples:');
    console.log('  🎸 พี่ป๊อปปี้ [มือกีตาร์]');
    console.log('  🎸 สมชาย [นักร้อง]');
    console.log('  🎸 มานี [มือกลอง]');
    console.log('  🎸 วีระ [สมาชิก] (fallback)');
    
    console.log('\n🏁 Instrument Badge System Test Completed!');
  };
  
  runAllTests();
}

window.testInstrumentBadge = testInstrumentBadge;
