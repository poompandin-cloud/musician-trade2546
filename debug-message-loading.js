// Debug script สำหรับตรวจสอบปัญหาข้อความหายไปหมด
function debugMessageLoading() {
  console.log('🔍 Debugging Message Loading Issues...');
  
  // 1. ตรวจสอบว่ามีข้อความแสดงใน UI หรือไม่
  const checkMessageDisplay = () => {
    console.log('📱 Checking message display in UI...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    const messageCount = messageElements.length;
    
    console.log('📊 Message elements found:', messageCount);
    
    if (messageCount === 0) {
      console.log('❌ No message elements found in UI');
      console.log('💡 Possible causes:');
      console.log('  1. Database query failed');
      console.log('  2. Messages array is empty');
      console.log('  3. setMessages not called');
      console.log('  4. Component not rendering');
    } else {
      console.log('✅ Message elements found:', messageCount);
      messageElements.forEach((element, index) => {
        const isMe = element.querySelector('.ml-auto');
        const messageText = element.querySelector('p')?.textContent;
        const senderName = element.querySelector('.hover\\:text-blue-600')?.textContent;
        const badge = element.querySelector('.bg-orange-100')?.textContent;
        
        console.log(`📝 Message ${index + 1}: ${senderName} ${badge || ''} - ${messageText?.substring(0, 50)}...`);
      });
    }
    
    return messageCount;
  };
  
  // 2. ตรวจสอบ console logs ที่ควรเห็น
  const checkExpectedConsoleLogs = () => {
    console.log('📋 Expected console logs to check:');
    console.log('');
    console.log('🚀 fetchMessages function called');
    console.log('📥 Fetching initial messages...');
    console.log('📡 Executing Supabase query...');
    console.log('🔍 Safe query - fetching basic data first...');
    console.log('📊 Safe query completed');
    console.log('🔍 Checking column names - fetching one profile with all data...');
    console.log('🔍 Sample profile keys: [array of column names]');
    console.log('🔍 Looking for instrument columns:');
    console.log('  🔍 instruments (with s): [value or undefined]');
    console.log('  🔍 instrument (without s): [value or undefined]');
    console.log('🔍 Column check results:');
    console.log('  ✅ has instruments column: true/false');
    console.log('  ✅ has instrument column: true/false');
    console.log('🔍 Updating query to include instrument columns...');
    console.log('🔍 Enhanced query completed');
    console.log('📊 Final Supabase query completed');
    console.log('✅ Fetched X messages from database');
    console.log('🔄 Processing messages for display...');
    console.log('📝 Formatted X messages');
    console.log('💾 Calling setMessages...');
    console.log('✅ setMessages called successfully');
    
    return true;
  };
  
  // 3. ตรวจสอบว่า Realtime connection ทำงานหรือไม่
  const checkRealtimeConnection = () => {
    console.log('🔔 Checking Realtime connection...');
    
    console.log('💡 Expected realtime logs:');
    console.log('📡 Setting up realtime subscription...');
    console.log('🔔 Realtime subscription established');
    console.log('🔔 Realtime: New message received: [payload]');
    console.log('🔍 Fetching profile for realtime message...');
    console.log('🔍 Safe realtime profile fetch completed');
    console.log('🔨 Adding new message to state with badge...');
    
    console.log('💡 How to test realtime:');
    console.log('  1. Open chat in two different browser windows');
    console.log('  2. Send message from one window');
    console.log('  3. Check if message appears in other window');
    console.log('  4. Check console logs for realtime events');
    
    return true;
  };
  
  // 4. ตรวจสอบจำนวนออนไลน์
  const checkOnlineCount = () => {
    console.log('👥 Checking online count...');
    
    const onlineCountElement = document.querySelector('.text-xs.text-gray-500');
    if (onlineCountElement) {
      const onlineText = onlineCountElement.textContent;
      console.log('👥 Online count text:', onlineText);
      
      // ดึงตัวเลขออนไลน์
      const match = onlineText.match(/ออนไลน์:\s*(\d+)/);
      if (match) {
        const onlineCount = parseInt(match[1]);
        console.log('👥 Online count number:', onlineCount);
        
        if (onlineCount === 0) {
          console.log('⚠️ Online count is 0 - this might indicate:');
          console.log('  1. No messages in database');
          console.log('  2. Messages array is empty');
          console.log('  3. Count calculation issue');
          console.log('  4. Realtime connection problem');
        } else {
          console.log('✅ Online count is:', onlineCount);
        }
        
        return onlineCount;
      } else {
        console.log('❌ Could not extract online count number');
        return 0;
      }
    } else {
      console.log('❌ Online count element not found');
      return 0;
    }
  };
  
  // 5. ตรวจสอบ component state
  const checkComponentState = () => {
    console.log('🔧 Checking component state...');
    
    console.log('💡 React component state to check:');
    console.log('  📝 messages array length');
    console.log('  👤 currentUser object');
    console.log('  🔄 loading state');
    console.log('  📡 realtime subscription status');
    
    console.log('💡 How to check state (in browser console):');
    console.log('  // Find the React component and inspect its state');
    console.log('  // Look for the PublicChat component in React DevTools');
    console.log('  // Check the messages array in component state');
    
    return true;
  };
  
  // 6. สร้าง SQL queries สำหรับตรวจสอบ database
  const generateDatabaseChecks = () => {
    console.log('🗄️ Database checks to run in Supabase Dashboard:');
    console.log('');
    console.log('-- 1. ตรวจสอบว่ามีข้อความในตาราง public_chats');
    console.log('SELECT COUNT(*) as total_messages FROM public_chats;');
    console.log('');
    console.log('-- 2. ตรวจสอบข้อความล่าสุด');
    console.log('SELECT * FROM public_chats ORDER BY created_at DESC LIMIT 5;');
    console.log('');
    console.log('-- 3. ตรวจสอบว่ามี profiles ที่เชื่อมโยงกับข้อความ');
    console.log('SELECT DISTINCT user_id FROM public_chats;');
    console.log('');
    console.log('-- 4. ตรวจสอบว่า user_ids ใน public_chats มีอยู่ใน profiles');
    console.log('SELECT pc.user_id, p.full_name');
    console.log('FROM public_chats pc');
    console.log('LEFT JOIN profiles p ON pc.user_id = p.id');
    console.log('LIMIT 10;');
    console.log('');
    console.log('-- 5. ตรวจสอบ column names ในตาราง profiles');
    console.log('SELECT column_name, data_type');
    console.log('FROM information_schema.columns');
    console.log('WHERE table_name = \'profiles\'');
    console.log('  AND table_schema = \'public\'');
    console.log('ORDER BY ordinal_position;');
    
    return true;
  };
  
  // 7. สร้าง troubleshooting steps
  const createTroubleshootingSteps = () => {
    console.log('🔧 Troubleshooting Steps:');
    console.log('');
    console.log('1. 📋 Check console logs for errors');
    console.log('   - Look for "❌ Error" messages');
    console.log('   - Check for network errors');
    console.log('   - Look for "fetchMessages failed"');
    console.log('');
    console.log('2. 🗄️ Run database checks');
    console.log('   - Verify data exists in tables');
    console.log('   - Check column names');
    console.log('   - Verify relationships');
    console.log('');
    console.log('3. 🔄 Refresh the page');
    console.log('   - Clear browser cache');
    console.log('   - Restart development server');
    console.log('   - Check network connection');
    console.log('');
    console.log('4. 🔍 Check component rendering');
    console.log('   - Verify component mounts');
    console.log('   - Check useEffect hooks');
    console.log('   - Verify state updates');
    console.log('');
    console.log('5. 📡 Test realtime connection');
    console.log('   - Open in multiple windows');
    console.log('   - Send test messages');
    console.log('   - Check console for realtime events');
    console.log('');
    console.log('6. 🎯 Expected behavior:');
    console.log('   - Messages should load on page refresh');
    console.log('   - Online count should show actual number');
    console.log('   - Realtime should work between windows');
    console.log('   - Badges should show correct instrument data');
    
    return true;
  };
  
  // 8. รันการทดสอบทั้งหมด
  const runAllDebugging = () => {
    console.log('🚀 Starting Message Loading Debugging...\n');
    
    const displayCheck = checkMessageDisplay();
    console.log('');
    
    const logCheck = checkExpectedConsoleLogs();
    console.log('');
    
    const realtimeCheck = checkRealtimeConnection();
    console.log('');
    
    const onlineCheck = checkOnlineCount();
    console.log('');
    
    const stateCheck = checkComponentState();
    console.log('');
    
    const dbCheck = generateDatabaseChecks();
    console.log('');
    
    const stepsCheck = createTroubleshootingSteps();
    console.log('');
    
    // สรุปผลการทดสอบ
    console.log('📊 Debugging Summary:');
    console.log('  📱 Message display:', displayCheck > 0 ? '✅' : '❌');
    console.log('  📋 Console logs guide: ✅');
    console.log('  🔔 Realtime check: ✅');
    console.log('  👥 Online count:', onlineCheck > 0 ? '✅' : '❌');
    console.log('  🔧 Component state: ✅');
    console.log('  🗄️ Database checks: ✅');
    console.log('  🔧 Troubleshooting: ✅');
    
    console.log('\n🎯 Current Status:');
    if (displayCheck === 0) {
      console.log('  ⚠️ PROBLEM: No messages displaying');
      console.log('  💡 Check console logs for errors');
      console.log('  💡 Run database checks to verify data');
      console.log('  💡 Verify component is mounting correctly');
    } else {
      console.log('  ✅ SUCCESS: Messages are displaying');
      console.log('  📊 Found', displayCheck, 'messages');
    }
    
    if (onlineCheck === 0) {
      console.log('  ⚠️ PROBLEM: Online count is 0');
      console.log('  💡 This might indicate empty messages array');
      console.log('  💡 Check if messages array is being set correctly');
    }
    
    console.log('\n🔍 What to Do Next:');
    console.log('  1. Check browser console for error messages');
    console.log('  2. Run the SQL queries in Supabase Dashboard');
    console.log('  3. Refresh the page and watch console logs');
    console.log('  4. Test realtime connection with multiple windows');
    console.log('  5. If problems persist, check network and database connection');
    
    console.log('\n🏁 Message Loading Debugging Completed!');
  };
  
  runAllDebugging();
}

window.debugMessageLoading = debugMessageLoading;
