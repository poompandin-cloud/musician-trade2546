// Debug script สำหรับตรวจสอบปัญหาหน้าขาว
function debugWhiteScreen() {
  console.log('🔍 Debugging white screen issue...');
  
  // 1. ตรวจสอบว่า React โหลดหรือไม่
  const rootElement = document.getElementById('root');
  if (rootElement) {
    console.log('✅ Root element found:', rootElement);
    console.log('📄 Root content:', rootElement.innerHTML.substring(0, 200));
    
    if (rootElement.innerHTML.trim() === '') {
      console.log('❌ Root element is empty - React not rendering');
    } else {
      console.log('✅ Root element has content');
    }
  } else {
    console.log('❌ Root element not found');
  }
  
  // 2. ตรวจสอบ JavaScript errors
  console.log('🐛 Checking for JavaScript errors...');
  const errorCount = window.console.error || [];
  console.log('📊 Console errors:', errorCount);
  
  // 3. ตรวจสอบ CSS loading
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  console.log('🎨 Stylesheets loaded:', stylesheets.length);
  stylesheets.forEach((sheet, index) => {
    console.log(`  📄 Sheet ${index + 1}: ${sheet.href}`);
  });
  
  // 4. ตรวจสอบ network requests
  if (window.performance && window.performance.getEntriesByType) {
    const resources = window.performance.getEntriesByType('resource');
    console.log('🌐 Network requests:', resources.length);
    
    const failedRequests = resources.filter(resource => 
      resource.responseStatus && resource.responseStatus >= 400
    );
    if (failedRequests.length > 0) {
      console.log('❌ Failed requests:', failedRequests);
    }
  }
  
  // 5. ตรวจสอบว่ามี loading state หรือไม่
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
  console.log('⏳ Loading elements:', loadingElements.length);
  
  // 6. ตรวจสอบว่ามี error elements หรือไม่
  const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"]');
  console.log('🚨 Error elements:', errorElements.length);
  
  // 7. ตรวจสอบ body element
  const body = document.body;
  if (body) {
    console.log('📄 Body classes:', body.className);
    console.log('📄 Body content length:', body.innerHTML.length);
  }
  
  console.log('🔍 Debug completed!');
  
  // 8. แนะนำการแก้ไข
  console.log('💡 Suggested fixes:');
  console.log('  1. Check browser console for JavaScript errors');
  console.log('  2. Try hard refresh (Ctrl+F5)');
  console.log('  3. Check if all dependencies are loaded');
  console.log('  4. Verify server is running correctly');
  console.log('  5. Check network tab for failed requests');
}

// รัน debug
debugWhiteScreen();

// Export สำหรับใช้งาน
if (typeof window !== 'undefined') {
  window.debugWhiteScreen = debugWhiteScreen;
}
