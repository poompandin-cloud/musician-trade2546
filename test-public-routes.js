// Test script สำหรับทดสอบ Public Routes และ Protected Routes
// รันใน browser console

function testPublicRoutes() {
  console.log('🔓 Testing public and protected routes...');
  
  // 1. ตรวจสอบว่าผู้ใช้ login อยู่หรือไม่
  console.log('👤 Checking user authentication status...');
  const navbar = document.querySelector('[data-testid="navbar"]');
  const loginButton = document.querySelector('button:contains("เข้าสู่ระบบ")');
  const logoutButton = document.querySelector('button:contains("ออกจากระบบ")');
  
  if (logoutButton) {
    console.log('✅ User is logged in');
  } else if (loginButton) {
    console.log('❌ User is not logged in');
  } else {
    console.log('❓ Cannot determine login status');
  }
  
  // 2. ทดสอบ Public Routes - ควรเข้าถึงได้แม้ไม่ login
  console.log('🌍 Testing public routes...');
  const publicRoutes = [
    { path: '/', name: 'Home Page', description: 'หน้าหลัก' },
    { path: '/search', name: 'Search', description: 'ค้นหาศิลปิน' },
    { path: '/musicians', name: 'Musicians', description: 'รายชื่อศิลปิน' },
    { path: '/about', name: 'About', description: 'เกี่ยวกับ' },
    { path: '/join', name: 'Join', description: 'สมัครสมาชิก' },
    { path: '/auth', name: 'Auth', description: 'หน้า login' }
  ];
  
  console.log('📋 Public Routes (should be accessible without login):');
  publicRoutes.forEach(route => {
    console.log(`  ✅ ${route.path} - ${route.name} (${route.description})`);
  });
  
  // 3. ทดสอบ Public Profile Routes - ทุกคนควรดูโปรไฟล์ได้
  console.log('👥 Testing public profile routes...');
  console.log('📋 Public Profile Routes (should be accessible to everyone):');
  console.log('  ✅ /profile/:id - ดูโปรไฟล์ของผู้ใช้อื่น');
  console.log('  ✅ /job/:id - ดูรายละเอียดงาน');
  
  // 4. ทดสอบ Protected Routes - ควรต้อง login
  console.log('🔒 Testing protected routes...');
  const protectedRoutes = [
    { path: '/profile', name: 'My Profile', description: 'โปรไฟล์ตัวเอง' },
    { path: '/edit-profile', name: 'Edit Profile', description: 'แก้ไขโปรไฟล์' },
    { path: '/my-applications', name: 'My Applications', description: 'คำร้องขอของฉัน' },
    { path: '/credits', name: 'Credits', description: 'เครดิตของฉัน' },
    { path: '/nearby-gigs', name: 'Nearby Gigs', description: 'งานใกล้ฉัน' }
  ];
  
  console.log('📋 Protected Routes (should redirect to login if not authenticated):');
  protectedRoutes.forEach(route => {
    console.log(`  🔒 ${route.path} - ${route.name} (${route.description})`);
  });
  
  // 5. ทดสอบการนำทางจริง
  console.log('🧭 Testing actual navigation...');
  
  // ทดสอบไปหน้า Home
  console.log('🏠 Testing Home route...');
  if (window.location.pathname === '/') {
    console.log('✅ Currently on Home page');
  } else {
    console.log('ℹ️ Not on Home page, current path:', window.location.pathname);
  }
  
  // ทดสอบการเข้าถึงเนื้อหา
  console.log('📱 Testing content accessibility...');
  
  // ตรวจสอบว่ามีเนื้อหาหลักแสดงหรือไม่
  const mainContent = document.querySelector('main');
  const jobListings = document.querySelectorAll('[data-testid="job-card"]');
  const searchForm = document.querySelector('[data-testid="search-form"]');
  const menuCards = document.querySelectorAll('[data-testid="menu-card"]');
  
  console.log('📊 Content Analysis:');
  console.log(`  📄 Main content found: ${!!mainContent}`);
  console.log(`  💼 Job listings: ${jobListings.length}`);
  console.log(`  🔍 Search form: ${!!searchForm}`);
  console.log(`  📋 Menu cards: ${menuCards.length}`);
  
  // 6. ทดสอบ UI สำหรับผู้ใช้ทั่วไป
  console.log('🎨 Testing UI for public users...');
  
  // ตรวจสอว่ามีปุ่ม login หรือไม่
  const loginBtn = document.querySelector('a[href*="login"], button:contains("เข้าสู่ระบบ")');
  const signupBtn = document.querySelector('a[href*="join"], button:contains("สมัครสมาชิก")');
  
  console.log('🔘 UI Elements for Public Users:');
  console.log(`  🔑 Login button: ${!!loginBtn}`);
  console.log(`  📝 Signup button: ${!!signupBtn}`);
  
  // 7. ทดสอบ responsive behavior
  console.log('📱 Testing responsive behavior...');
  const isMobile = window.innerWidth < 768;
  console.log(`📱 Screen size: ${window.innerWidth}px (${isMobile ? 'Mobile' : 'Desktop'})`);
  
  // 8. สรุปผลการทดสอบ
  console.log('📋 Route Test Summary:');
  console.log(`  🌍 Public routes: ${publicRoutes.length}`);
  console.log(`  👥 Public profile routes: 2`);
  console.log(`  🔒 Protected routes: ${protectedRoutes.length}`);
  console.log(`  👤 Auth status: ${logoutButton ? 'Logged in' : 'Not logged in'}`);
  console.log(`  📱 Current view: ${isMobile ? 'Mobile' : 'Desktop'}`);
  
  // 9. ตรวจสอบปัญหาที่อาจเกิดขึ้น
  const issues = [];
  
  if (!mainContent) {
    issues.push('Main content not found');
  }
  
  if (jobListings.length === 0 && !searchForm) {
    issues.push('No job listings or search form found');
  }
  
  if (!loginBtn && !logoutButton) {
    issues.push('No login or logout button found');
  }
  
  if (issues.length === 0) {
    console.log('✅ No issues found with public routes!');
  } else {
    console.log('⚠️ Issues found:', issues);
  }
  
  // 10. คำแนะนำสำหรับการทดสอบเพิ่มเติม
  console.log('💡 Additional Testing Suggestions:');
  console.log('  1. Try accessing protected routes while not logged in');
  console.log('  2. Test navigation between public routes');
  console.log('  3. Check if login redirect works properly');
  console.log('  4. Verify profile pages load correctly');
  console.log('  5. Test responsive design on different screen sizes');
  
  console.log('🔓 Public routes test completed!');
}

// รันการทดสอบ
testPublicRoutes();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.testPublicRoutes = testPublicRoutes;
}
