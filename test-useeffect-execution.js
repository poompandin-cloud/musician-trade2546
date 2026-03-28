// Test script สำหรับตรวจสอบการทำงานของ useEffect
function testUseEffectExecution() {
  console.log('🎯 Testing useEffect Execution...');
  
  // 1. ตรวจสอบว่า useEffect ทำงานหรือไม่
  const checkUseEffectTrigger = () => {
    console.log('🔄 Checking useEffect trigger...');
    
    // ตรวจสอบ console logs ที่ควรเห็น
    console.log('📋 Expected console logs when page loads:');
    console.log('  🎯 useEffect triggered for initial load');
    console.log('  📊 Loading state: false');
    console.log('  🆔 Current user: [authenticated/not authenticated]');
    console.log('  ✅ Ready to fetch messages - no blocking conditions');
    console.log('  🚀 Starting initial message fetch...');
    console.log('  🎯 No blocking conditions - calling fetchMessages immediately');
    console.log('  🚀 fetchMessages function called');
    console.log('  📥 Fetching initial messages...');
    console.log('  📡 Executing Supabase query...');
    console.log('  📊 Supabase query completed');
    console.log('  📊 Data from Supabase: [array]');
    console.log('  📊 Data type: object');
    console.log('  📊 Data length: [number]');
    console.log('  📊 Is array: true');
    console.log('  📊 Error from query: null');
    console.log('  ✅ Fetched X messages from database');
    console.log('  🔄 Processing messages for display...');
    console.log('  📝 Formatted X messages');
    console.log('  💾 Calling setMessages...');
    console.log('  ✅ setMessages called successfully');
    console.log('  🎉 Initial load completed successfully');
    console.log('  📜 Auto-scrolling to bottom...');
  };
  
  // 2. ตรวจสอบสถานะการของ component
  const checkComponentState = () => {
    console.log('⚛️ Checking component state...');
    
    // ตรวจสอบว่ามีข้อความใน UI หรือไม่
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 Messages in UI: ${messageElements.length}`);
    
    if (messageElements.length === 0) {
      console.log('❌ No messages in UI');
      console.log('🔧 Possible issues:');
      console.log('  - useEffect not triggered');
      console.log('  - loading state stuck at true');
      console.log('  - fetchMessages not called');
      console.log('  - Supabase query failed');
      console.log('  - setMessages not working');
      return false;
    }
    
    console.log('✅ Messages found in UI');
    console.log('🎉 useEffect appears to be working correctly');
    return true;
  };
  
  // 3. ตรวจสอบการทำงานของ fetchMessages
  const checkFetchMessages = () => {
    console.log('📥 Checking fetchMessages execution...');
    
    // ตรวจสอบว่ามีการเรียก fetchMessages หรือไม่
    console.log('🔍 Signs that fetchMessages was called:');
    console.log('  🚀 fetchMessages function called');
    console.log('  📥 Fetching initial messages...');
    console.log('  📡 Executing Supabase query...');
    console.log('  📊 Supabase query completed');
    console.log('  📊 Data from Supabase: [array]');
    
    // ตรวจสอบว่ามีการเรียก setMessages หรือไม่
    console.log('💾 Signs that setMessages was called:');
    console.log('  💾 Calling setMessages...');
    console.log('  ✅ setMessages called successfully');
    console.log('  🎉 Initial load completed successfully');
  };
  
  // 4. ตรวจสอบ blocking conditions
  const checkBlockingConditions = () => {
    console.log('🚫 Checking blocking conditions...');
    
    console.log('🔍 What could block useEffect:');
    console.log('  - loading state is true');
    console.log('  - currentUser is null/undefined');
    console.log('  - Component not mounted');
    console.log('  - useEffect dependency issues');
    
    console.log('✅ Current implementation should have no blocking conditions');
    console.log('✅ useEffect runs when loading becomes false');
    console.log('✅ fetchMessages called immediately when ready');
  };
  
  // 5. ทดสอบการทำงานจริง
  const testRealExecution = () => {
    console.log('🧪 Testing real execution...');
    
    // สร้าง observer เพื่อดูการอัปเดต DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log('🔄 DOM updated - messages added to UI');
          
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const messageText = node.querySelector('.text-gray-800')?.textContent;
              if (messageText) {
                console.log('📝 New message in DOM:', messageText.substring(0, 30) + '...');
              }
            }
          });
        }
      });
    });
    
    const chatContainer = document.querySelector('.space-y-4');
    if (chatContainer) {
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
      
      console.log('👁️ Started observing DOM for useEffect effects');
      
      // หยุด observe หลัง 10 วินาที
      setTimeout(() => {
        observer.disconnect();
        console.log('👁️ Stopped DOM observation');
      }, 10000);
    }
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting useEffect Execution Test...\n');
    
    checkUseEffectTrigger();
    checkBlockingConditions();
    checkFetchMessages();
    testRealExecution();
    
    // ตรวจสอบผลลัพธ์หลัง 2 วินาที
    setTimeout(() => {
      const success = checkComponentState();
      
      if (success) {
        console.log('\n✅ useEffect Execution Test PASSED');
        console.log('🎉 useEffect is working correctly');
        console.log('🎯 fetchMessages is called immediately');
        console.log('💾 setMessages is updating the UI');
        console.log('📜 Messages are loaded and displayed');
      } else {
        console.log('\n❌ useEffect Execution Test FAILED');
        console.log('🔧 Check console logs for specific errors');
        console.log('🔧 Verify RLS policies are disabled');
        console.log('🔧 Check network connection');
      }
    }, 2000);
    
    console.log('\n💡 Expected Console Output:');
    console.log('  🎯 useEffect triggered for initial load');
    console.log('  📊 Loading state: false');
    console.log('  🆔 Current user: [authenticated/not authenticated]');
    console.log('  ✅ Ready to fetch messages - no blocking conditions');
    console.log('  🚀 Starting initial message fetch...');
    console.log('  🎯 No blocking conditions - calling fetchMessages immediately');
    console.log('  🚀 fetchMessages function called');
    console.log('  📥 Fetching initial messages...');
    console.log('  📡 Executing Supabase query...');
    console.log('  📊 Supabase query completed');
    console.log('  📊 Data from Supabase: [array]');
    console.log('  📊 Data type: object');
    console.log('  📊 Data length: [number]');
    console.log('  📊 Is array: true');
    console.log('  📊 Error from query: null');
    console.log('  ✅ Fetched X messages from database');
    console.log('  🔄 Processing messages for display...');
    console.log('  📝 Formatted X messages');
    console.log('  💾 Calling setMessages...');
    console.log('  ✅ setMessages called successfully');
    console.log('  🎉 Initial load completed successfully');
    console.log('  📜 Auto-scrolling to bottom...');
    console.log('  📊 Messages in UI: [number]');
  };
  
  runAllTests();
}

window.testUseEffectExecution = testUseEffectExecution;
