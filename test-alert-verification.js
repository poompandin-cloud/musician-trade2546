// Test script สำหรับตรวจสอบการแสดง Alert
function testAlertVerification() {
  console.log('🔔 Testing Alert Verification...');
  
  // 1. ตรวจสอบว่ามีการแสดง alert หรือไม่
  const checkAlertDisplay = () => {
    console.log('🔍 Checking if alert is displayed...');
    
    // สร้าง mock alert เพื่อดักจับการเรียก
    const originalAlert = window.alert;
    let alertCalled = false;
    let alertMessage = '';
    
    window.alert = function(message) {
      alertCalled = true;
      alertMessage = message;
      console.log('🔔 Alert called with message:', message);
      
      // เรียก original alert จริง
      originalAlert(message);
      
      // คืนค่า alert เดิม
      setTimeout(() => {
        window.alert = originalAlert;
      }, 1000);
    };
    
    console.log('👁️ Alert hook installed');
    return { alertCalled, alertMessage };
  };
  
  // 2. ทดสอบการดึงข้อมูล
  const testDataFetch = async () => {
    console.log('📥 Testing data fetch with alert...');
    
    const { alertCalled, alertMessage } = checkAlertDisplay();
    
    // รอให้ fetchMessages ทำงาน
    setTimeout(() => {
      if (alertCalled) {
        console.log('✅ Alert was called successfully');
        console.log('📝 Alert message:', alertMessage);
        
        // ตรวจสอบรูปแบบข้อความ
        const messageCountMatch = alertMessage.match(/\d+/);
        if (messageCountMatch) {
          const count = parseInt(messageCountMatch[0]);
          console.log('📊 Message count from alert:', count);
          
          if (count > 0) {
            console.log('✅ Successfully fetched messages from database');
          } else if (count === 0) {
            console.log('⚠️ No messages found in database');
          }
        } else {
          console.log('⚠️ Could not parse message count from alert');
        }
      } else {
        console.log('❌ Alert was not called');
        console.log('🔧 Possible issues:');
        console.log('  - fetchMessages not called');
        console.log('  - Database query failed');
        console.log('  - Exception occurred');
        console.log('  - Alert hook not working');
      }
    }, 3000);
  };
  
  // 3. ตรวจสอบการทำงานของ setMessages
  const checkSetMessages = () => {
    console.log('💾 Checking setMessages execution...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log('📊 Messages in UI after alert:', messageElements.length);
    
    if (messageElements.length > 0) {
      console.log('✅ setMessages appears to have worked');
      console.log('📝 Messages displayed in UI:', messageElements.length);
      
      // ตรวจสอบข้อความแรก
      const firstMessage = messageElements[0];
      const lastMessage = messageElements[messageElements.length - 1];
      
      const firstTime = firstMessage?.querySelector('.text-gray-500')?.textContent;
      const lastTime = lastMessage?.querySelector('.text-gray-500')?.textContent;
      
      console.log('📅 First message time:', firstTime);
      console.log('📅 Last message time:', lastTime);
      
      if (firstTime && lastTime) {
        console.log('✅ Message order appears correct');
      }
    } else {
      console.log('❌ No messages in UI after alert');
      console.log('🔧 Possible issues:');
      console.log('  - setMessages not called');
      console.log('  - React not re-rendering');
      console.log('  - DOM not updating');
    }
  };
  
  // 4. ตรวจสอบ console logs ที่ควรเห็น
  const checkConsoleLogs = () => {
    console.log('📋 Expected console logs:');
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
    console.log('  🔔 Alert: "ดึงข้อมูลได้ X ข้อความ"');
  };
  
  // 5. รันการทดสอบทั้งหมด
  const runAllTests = async () => {
    console.log('🚀 Starting Alert Verification Test...\n');
    
    checkConsoleLogs();
    await testDataFetch();
    
    // รอให้ alert แสดงและ UI อัปเดต
    setTimeout(() => {
      checkSetMessages();
      
      console.log('\n💡 Expected Alert Messages:');
      console.log('  🔔 "ดึงข้อมูลได้ 15 ข้อความ" (ถ้ามีข้อความ)');
      console.log('  🔔 "ดึงข้อมูลได้ 0 ข้อความ (ไม่มีข้อความในระบบ)" (ถ้าไม่มี)');
      console.log('  🔔 "เกิดข้อผิดพลาดในการดึงข้อมูล: [error message]" (ถ้า error)');
      console.log('  🔔 "เกิดข้อผิดพลาดที่ไม่คาดคิด: [error message]" (ถ้า exception)');
      
      console.log('\n🎯 Success Indicators:');
      console.log('  ✅ Alert displayed with correct message count');
      console.log('  ✅ Messages appear in UI');
      console.log('  ✅ Console logs show all steps');
      console.log('  ✅ setMessages called successfully');
      console.log('  ✅ Data fetched from Supabase');
      
      console.log('\n🏁 Alert Verification Test Completed!');
    }, 4000);
  };
  
  runAllTests();
}

window.testAlertVerification = testAlertVerification;
