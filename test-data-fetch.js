// Test script สำหรับตรวจสอบการดึงข้อมูลจาก Supabase
function testDataFetch() {
  console.log('📊 Testing Data Fetch from Supabase...');
  
  // 1. ตรวจสอบว่า fetchMessages ถูกเรียกหรือไม่
  const checkFetchExecution = () => {
    console.log('🔍 Checking if fetchMessages was executed...');
    
    // ตรวจสอบ console logs ที่ควรเห็น
    console.log('📋 Expected console logs when page loads:');
    console.log('  🚀 Starting initial message fetch...');
    console.log('  📥 Fetching initial messages...');
    console.log('  🆔 Current user ID: [user-id]');
    console.log('  ⏰ Fetch time: [time]');
    console.log('  📊 Data from Supabase: [array]');
    console.log('  📊 Data type: object');
    console.log('  📊 Data length: [number]');
    console.log('  📊 Is array: true');
    console.log('  ✅ Fetched X messages from database');
    console.log('  📝 Formatted X messages');
    console.log('  💾 setMessages called successfully');
  };
  
  // 2. ทดสอบการดึงข้อมูลโดยตรง
  const testDirectQuery = async () => {
    console.log('🔍 Testing direct Supabase query...');
    
    try {
      const { data, error } = await supabase
        .from('public_chats')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) {
        console.log('❌ Direct query failed:', error);
        return false;
      }
      
      console.log('✅ Direct query successful');
      console.log('📊 Data from Supabase:', data);
      console.log('📊 Data type:', typeof data);
      console.log('📊 Data length:', data?.length || 0);
      console.log('📊 Is array:', Array.isArray(data));
      
      if (data && data.length > 0) {
        console.log('📄 Sample message structure:', data[0]);
        console.log('👤 Profile data:', data[0].profiles);
      }
      
      return true;
    } catch (err) {
      console.log('❌ Exception in direct query:', err);
      return false;
    }
  };
  
  // 3. ตรวจสอบว่า setMessages ทำงานหรือไม่
  const checkSetMessages = () => {
    console.log('💾 Checking setMessages functionality...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 Messages in UI: ${messageElements.length}`);
    
    if (messageElements.length === 0) {
      console.log('❌ No messages in UI - setMessages may not have worked');
      console.log('🔧 Possible issues:');
      console.log('  - fetchMessages not called');
      console.log('  - Supabase query failed');
      console.log('  - setMessages not called');
      console.log('  - React state not updating');
      console.log('  - Component not re-rendering');
      return false;
    }
    
    console.log('✅ Messages found in UI - setMessages appears to have worked');
    
    // ตรวจสอบข้อมูลใน UI
    messageElements.forEach((element, index) => {
      const messageText = element.querySelector('.text-gray-800')?.textContent;
      const senderName = element.querySelector('.text-xs.text-gray-600')?.textContent;
      const messageTime = element.querySelector('.text-gray-500')?.textContent;
      
      if (index < 3) { // แสดงแค่ 3 ข้อความแรก
        console.log(`📝 Message ${index + 1}:`, {
          text: messageText?.substring(0, 30) + '...',
          sender: senderName,
          time: messageTime
        });
      }
    });
    
    return true;
  };
  
  // 4. ตรวจสอบ useEffect dependencies
  const checkUseEffect = () => {
    console.log('🔄 Checking useEffect dependencies...');
    
    console.log('💡 useEffect should run when:');
    console.log('  - loading becomes false');
    console.log('  - currentUser is available');
    console.log('  - Component mounts');
    
    // ตรวจสอบค่าปัจจุบัน
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 Current message count: ${messageElements.length}`);
    
    if (messageElements.length > 0) {
      console.log('✅ useEffect appears to have run successfully');
    } else {
      console.log('❌ useEffect may not have run or failed');
      console.log('🔧 Check if loading is stuck at true');
      console.log('🔧 Check if currentUser is null');
    }
  };
  
  // 5. ตรวจสอบการเชื่อมต่อ Supabase
  const checkSupabaseConnection = () => {
    console.log('📡 Checking Supabase connection...');
    
    if (typeof supabase === 'undefined') {
      console.log('❌ Supabase client not available');
      return false;
    }
    
    console.log('✅ Supabase client available');
    
    // ตรวจสอบว่ามีการเชื่อมต่อหรือไม่
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('✅ User session active');
        console.log('🆔 Session user ID:', session.user.id);
      } else {
        console.log('⚠️ No active session');
        console.log('💡 But should still be able to fetch public messages');
      }
    });
    
    return true;
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = async () => {
    console.log('🚀 Starting Data Fetch Test...\n');
    
    // ตรวจสอบ console logs ที่ควรเห็น
    checkFetchExecution();
    
    // ตรวจสอบการเชื่อมต่อ
    const connectionOk = checkSupabaseConnection();
    
    if (!connectionOk) {
      console.log('\n❌ Supabase connection failed');
      return;
    }
    
    // ทดสอบการดึงข้อมูลโดยตรง
    const querySuccess = await testDirectQuery();
    
    if (!querySuccess) {
      console.log('\n❌ Direct query failed');
      console.log('🔧 Check RLS policies on public_chats table');
      console.log('🔧 Check network connection');
      return;
    }
    
    // ตรวจสอบผลลัพธ์ใน UI
    setTimeout(() => {
      const setMessagesOk = checkSetMessages();
      checkUseEffect();
      
      if (setMessagesOk) {
        console.log('\n✅ Data fetch test PASSED');
        console.log('🎉 Messages are loading correctly from Supabase');
      } else {
        console.log('\n❌ Data fetch test FAILED');
        console.log('🔧 Check console logs for specific errors');
      }
    }, 2000);
    
    console.log('\n💡 Expected Console Output:');
    console.log('  🚀 Starting initial message fetch...');
    console.log('  📥 Fetching initial messages...');
    console.log('  📊 Data from Supabase: [array of messages]');
    console.log('  📊 Data type: object');
    console.log('  📊 Data length: [number]');
    console.log('  📊 Is array: true');
    console.log('  ✅ Fetched X messages from database');
    console.log('  📝 Formatted X messages');
    console.log('  💾 setMessages called successfully');
    console.log('  📊 Messages in UI: [number]');
    
    console.log('\n🔧 If no messages appear:');
    console.log('  1. Check console for errors');
    console.log('  2. Check RLS policies');
    console.log('  3. Check network connection');
    console.log('  4. Check Supabase project settings');
    console.log('  5. Try refreshing the page');
  };
  
  runAllTests();
}

window.testDataFetch = testDataFetch;
