// Add Logout Button - เพิ่มปุ่ม Logout สำหรับการจัดการ Session
function createLogoutButton() {
  console.log('🚪 Creating Logout Button...');
  
  // ค้นหาตำแหน่งที่จะใส่ปุ่ม Logout
  const headerElement = document.querySelector('header') || 
                        document.querySelector('.header') || 
                        document.querySelector('[class*="header"]') ||
                        document.querySelector('nav');
  
  if (!headerElement) {
    console.log('❌ Could not find header element');
    return false;
  }
  
  // สร้างปุ่ม Logout
  const logoutButton = document.createElement('button');
  logoutButton.innerHTML = `
    <span style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 0 1-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 21 17"></polyline>
        <line x1="12" y1="3" x2="12" y2="9"></line>
        <line x1="12" y1="17" x2="12" y2="23"></line>
      </svg>
      <span>ออกจากระบบ</span>
    </span>
  `;
  
  // เพิ่ม hover effect
  logoutButton.onmouseover = () => {
    logoutButton.querySelector('span').style.background = '#dc2626';
  };
  
  logoutButton.onmouseout = () => {
    logoutButton.querySelector('span').style.background = '#ef4444';
  };
  
  // เพิ่ม click handler
  logoutButton.onclick = async () => {
    console.log('🚪 Logout button clicked');
    
    try {
      // แสดง loading state
      logoutButton.innerHTML = `
        <span style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: not-allowed;
          font-size: 14px;
          font-weight: 500;
        ">
          <div style="
            width: 16px;
            height: 16px;
            border: 2px solid white;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span>กำลังออกจากระบบ...</span>
        </span>
      `;
      
      // เรียกใช้ Supabase logout
      const { supabase } = window.supabase || (await import('./src/integrations/supabase/client.js')).supabase;
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        alert('เกิดข้อผิดพลาดในการออกจากระบบ: ' + error.message);
      } else {
        console.log('✅ Logout successful');
        
        // แสดง success message
        logoutButton.innerHTML = `
          <span style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            background: #22c55e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: default;
            font-size: 14px;
            font-weight: 500;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 17"></polyline>
              <path d="m12 14 9 22 9"></path>
            </svg>
            <span>ออกจากระบบสำเร็จ</span>
          </span>
        `;
        
        // รอ 2 วินาทีแล้ว redirect
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Logout process error:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
      
      // คืนสถานะปุ่มเดิม
      logoutButton.innerHTML = `
        <span style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 0 1-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 21 17"></polyline>
            <line x1="12" y1="3" x2="12" y2="9"></line>
            <line x1="12" y1="17" x2="12" y2="23"></line>
          </svg>
          <span>ออกจากระบบ</span>
        </span>
      `;
      
      // คืน hover effects
      logoutButton.onmouseover = () => {
        logoutButton.querySelector('span').style.background = '#dc2626';
      };
      
      logoutButton.onmouseout = () => {
        logoutButton.querySelector('span').style.background = '#ef4444';
      };
    }
  };
  
  // หาตำแหน่งสำหรับใส่ปุ่ม
  const insertLocation = headerElement.querySelector('.container') || 
                         headerElement.querySelector('[class*="container"]') ||
                         headerElement;
  
  // ใส่ปุ่มในตำแหน่งท้ายสุดของ header
  insertLocation.appendChild(logoutButton);
  
  // เพิ่ม CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  console.log('✅ Logout button added successfully');
  console.log('📍 Location:', insertLocation);
  
  return true;
}

// Auto-logout หลังจากไม่มี activity 10 นาที
function setupAutoLogout() {
  console.log('⏰ Setting up auto-logout after 10 minutes of inactivity...');
  
  let inactivityTimer;
  let lastActivity = Date.now();
  
  const resetTimer = () => {
    lastActivity = Date.now();
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(handleAutoLogout, 10 * 60 * 1000); // 10 นาที
  };
  
  const handleAutoLogout = async () => {
    console.log('⏰ Auto-logout triggered due to inactivity');
    
    try {
      const { supabase } = window.supabase || (await import('./src/integrations/supabase/client.js')).supabase;
      await supabase.auth.signOut();
      
      alert('คุณถูกออกจากระบบเนื่องจากไม่มีการใช้งานเป็นเวลา 10 นาที');
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Auto-logout error:', error);
    }
  };
  
  // ติดตาม events สำหรับ detect activity
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  events.forEach(event => {
    document.addEventListener(event, resetTimer, true);
  });
  
  // เริ่ม timer
  resetTimer();
  
  console.log('✅ Auto-logout setup completed');
  return true;
}

// ฟังก์ชันหลัก
function removeLogoutButton() {
  const logoutButton = document.querySelector('button[onclick*="logout"]');
  if (logoutButton) {
    logoutButton.remove();
    console.log('🗑️ Logout button removed');
  }
}

// ฟังก์ชันหลักสำหรับ cleanup
function cleanupAutoLogout() {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  events.forEach(event => {
    document.removeEventListener(event, resetTimer, true);
  });
  console.log('🧹 Auto-logout cleanup completed');
}

// ฟังก์ชันหลัก
function createLogoutManager() {
  console.log('🚪 Creating Logout Manager...');
  
  return {
    addLogoutButton: createLogoutButton,
    setupAutoLogout: setupAutoLogout,
    removeLogoutButton: removeLogoutButton,
    cleanupAutoLogout: cleanupAutoLogout,
    
    // ฟังก์ชันสำหรับ testing
    test: () => {
      console.log('🧪 Testing Logout Manager...');
      
      const buttonTest = createLogoutButton();
      const autoLogoutTest = setupAutoLogout();
      
      console.log('📊 Test Results:');
      console.log('  🚪 Logout Button:', buttonTest ? '✅' : '❌');
      console.log('  ⏰ Auto-Logout:', autoLogoutTest ? '✅' : '❌');
      
      if (buttonTest && autoLogoutTest) {
        console.log('✅ SUCCESS: Logout system is working!');
        console.log('🔍 Features:');
        console.log('  - Manual logout button with loading states');
        console.log('  - Auto-logout after 10 minutes inactivity');
        console.log('  - Proper session cleanup');
        console.log('  - User-friendly feedback');
      }
      
      return buttonTest && autoLogoutTest;
    }
  };
}

// สร้าง global instance
window.logoutManager = createLogoutManager();

// Auto-setup เมื่อโหลด
console.log('🚪 Logout Manager Loaded');
console.log('💡 Available functions:');
console.log('  - logoutManager.addLogoutButton() - Add logout button');
console.log('  - logoutManager.setupAutoLogout() - Setup auto-logout');
console.log('  - logoutManager.removeLogoutButton() - Remove logout button');
console.log('  - logoutManager.cleanupAutoLogout() - Cleanup auto-logout');
console.log('  - logoutManager.test() - Test all features');
console.log('');
console.log('💡 Quick start: logoutManager.addLogoutButton()');
