// Test script สำหรับทดสอบ Navbar และระบบป้องกันการใช้งาน
// รันใน browser console

function testNavbarAndProtection() {
  console.log('🔐 Testing Navbar and Action Protection...');
  
  // 1. ตรวจสอบสถานะการเข้าสู่ระบบ
  console.log('👤 Checking authentication status...');
  const loginButton = document.querySelector('button:contains("เข้าสู่ระบบ")');
  const avatarButton = document.querySelector('button:has(.avatar)');
  const dropdownTrigger = document.querySelector('[data-state]');
  
  if (loginButton) {
    console.log('❌ User is not logged in');
    console.log('🔘 Login button found:', loginButton.className);
  } else if (avatarButton) {
    console.log('✅ User is logged in');
    console.log('👤 Avatar button found:', avatarButton.className);
  } else {
    console.log('❓ Cannot determine login status');
  }
  
  // 2. ตรวจสอบ Navbar UI สำหรับผู้ใช้ที่ไม่ login
  console.log('🎨 Testing Navbar UI for non-logged in users...');
  
  const navbar = document.querySelector('nav');
  if (navbar) {
    console.log('✅ Navbar found');
    
    // ตรวจสอบว่ามีปุ่ม login หรือไม่
    const loginBtn = navbar.querySelector('button:contains("เข้าสู่ระบบ")');
    if (loginBtn) {
      console.log('✅ Login button visible');
      console.log('🎨 Login button styles:', loginBtn.className);
      
      // ตรวจสอบสีและรูปแบบ
      const hasBlueBackground = loginBtn.className.includes('bg-blue-600');
      const hasRoundedStyle = loginBtn.className.includes('rounded-full');
      const hasShadow = loginBtn.className.includes('shadow');
      
      console.log(`🎨 Blue background: ${hasBlueBackground}`);
      console.log(`🎨 Rounded style: ${hasRoundedStyle}`);
      console.log(`🎨 Shadow effect: ${hasShadow}`);
      
      if (hasBlueBackground && hasRoundedStyle && hasShadow) {
        console.log('✅ Login button styling is correct');
      } else {
        console.log('⚠️ Login button styling needs improvement');
      }
    }
    
    // ตรวจสอบว่าไม่มี avatar สำหรับผู้ใช้ที่ไม่ login
    const avatar = navbar.querySelector('.avatar');
    if (avatar) {
      console.log('⚠️ Avatar visible for non-logged in user (should be hidden)');
    } else {
      console.log('✅ Avatar correctly hidden for non-logged in user');
    }
  }
  
  // 3. ตรวจสอสถานะสำหรับผู้ใช้ที่ login
  console.log('👤 Testing Navbar UI for logged in users...');
  
  if (avatarButton) {
    console.log('✅ Avatar button visible for logged in user');
    
    // ตรวจสอบ dropdown menu
    const dropdown = document.querySelector('[role="menu"]');
    if (dropdown) {
      console.log('✅ Dropdown menu found');
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
      console.log(`📋 Menu items: ${menuItems.length}`);
      
      menuItems.forEach((item, index) => {
        console.log(`  📝 Item ${index + 1}: ${item.textContent.trim()}`);
      });
      
      // ตรวจสอบว่ามี "โปรไฟล์ของฉัน" และ "ออกจากระบบ"
      const profileItem = Array.from(menuItems).find(item => 
        item.textContent.includes('โปรไฟล์ของฉัน')
      );
      const logoutItem = Array.from(menuItems).find(item => 
        item.textContent.includes('ออกจากระบบ')
      );
      
      console.log(`👤 Profile menu item: ${!!profileItem}`);
      console.log(`🚪 Logout menu item: ${!!logoutItem}`);
      
      if (profileItem && logoutItem) {
        console.log('✅ Dropdown menu items are correct');
      } else {
        console.log('⚠️ Dropdown menu items are missing');
      }
    } else {
      console.log('❌ Dropdown menu not found');
    }
  }
  
  // 4. ทดสอบระบบป้องกันการประกาศงาน
  console.log('🚫 Testing job posting protection...');
  
  const postJobButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('โพสต์ประกาศงาน') || 
    btn.textContent.includes('ประกาศงาน')
  );
  
  if (postJobButton) {
    console.log('✅ Post job button found');
    
    // จำลองการคลิกถ้าไม่ login
    if (!loginButton) {
      console.log('ℹ️ User is logged in, skipping protection test');
    } else {
      console.log('🧪 Simulating click on post job button...');
      // ถ้าต้องการทดสอบจริง ให้ uncomment บรรทัดด้านล่าง
      // postJobButton.click();
      console.log('⚠️ Manual click required to test protection');
    }
  } else {
    console.log('❌ Post job button not found');
  }
  
  // 5. ทดสอบระบบป้องกันการติดต่อ
  console.log('📞 Testing contact protection...');
  
  const contactButtons = document.querySelectorAll('button:contains("ติดต่อทาง LINE")');
  console.log(`📞 LINE contact buttons found: ${contactButtons.length}`);
  
  contactButtons.forEach((button, index) => {
    console.log(`📞 Contact button ${index + 1}:`, button.className);
    
    if (!loginButton) {
      console.log('ℹ️ User is logged in, contact should work');
    } else {
      console.log('🧪 Contact button should trigger login prompt');
    }
  });
  
  // 6. ทดสอบระบบป้องกันคอมเมนต์
  console.log('💬 Testing comment protection...');
  
  const commentSection = document.querySelector('[data-testid="profile-comments"]');
  if (commentSection) {
    console.log('✅ Comment section found');
    
    const commentInput = commentSection.querySelector('textarea[placeholder*="คอมเมนต์"]');
    const loginPrompt = commentSection.querySelector('button:contains("เข้าสู่ระบบเพื่อคอมเมนต์")');
    
    if (commentInput && !loginButton) {
      console.log('✅ Comment input visible for logged in user');
    } else if (loginPrompt && loginButton) {
      console.log('✅ Login prompt visible for non-logged in user');
    } else {
      console.log('⚠️ Comment section state unclear');
    }
  } else {
    console.log('ℹ️ Comment section not found (not on profile page)');
  }
  
  // 7. ตรวจสอบการแสดงผลทั่วไป
  console.log('🎨 Testing general UI consistency...');
  
  // ตรวจสอบ flex layout
  const navbarContainer = navbar?.querySelector('.container');
  if (navbarContainer) {
    const hasFlex = navbarContainer.className.includes('flex');
    const hasItemsCenter = navbarContainer.className.includes('items-center');
    const hasGap = navbarContainer.className.includes('gap');
    
    console.log(`🎨 Flex layout: ${hasFlex}`);
    console.log(`🎨 Items center: ${hasItemsCenter}`);
    console.log(`🎨 Gap spacing: ${hasGap}`);
    
    if (hasFlex && hasItemsCenter && hasGap) {
      console.log('✅ Navbar layout is correct');
    } else {
      console.log('⚠️ Navbar layout needs improvement');
    }
  }
  
  // 8. สรุปผลการทดสอบ
  console.log('📊 Test Summary:');
  console.log(`  👤 Auth status: ${loginButton ? 'Not logged in' : 'Logged in'}`);
  console.log(`  🎨 Navbar found: ${!!navbar}`);
  console.log(`  🔘 Login button: ${!!loginButton}`);
  console.log(`  👤 Avatar button: ${!!avatarButton}`);
  console.log(`  📞 Contact buttons: ${contactButtons.length}`);
  console.log(`  💬 Comment section: ${!!commentSection}`);
  
  const issues = [];
  
  if (loginButton && avatarButton) {
    issues.push('Both login button and avatar visible');
  }
  
  if (!loginButton && !avatarButton) {
    issues.push('Neither login button nor avatar visible');
  }
  
  if (postJobButton && loginButton) {
    // ถ้ามีปุ่มประกาศงานแต่ยังไม่ login ควรจะมีการป้องกัน
    console.log('ℹ️ Post job protection should be active');
  }
  
  if (issues.length === 0) {
    console.log('✅ Navbar and protection system looks good!');
  } else {
    console.log('⚠️ Issues found:', issues);
  }
  
  // 9. คำแนะนำสำหรับการทดสอบเพิ่มเติม
  console.log('💡 Additional Testing Suggestions:');
  console.log('  1. Test login/logout flow');
  console.log('  2. Test dropdown menu functionality');
  console.log('  3. Try posting a job while not logged in');
  console.log('  4. Test contact buttons protection');
  console.log('  5. Test comment system protection');
  console.log('  6. Verify responsive design');
  
  console.log('🔐 Navbar and protection test completed!');
}

// รันการทดสอบ
testNavbarAndProtection();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testNavbarAndProtection = testNavbarAndProtection;
}
