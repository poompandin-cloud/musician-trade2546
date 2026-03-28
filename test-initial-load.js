// Test script สำหรับทดสอบการโหลดข้อความเริ่มต้น
function testInitialLoad() {
  console.log('🚀 Testing Initial Message Load...');
  
  // 1. ตรวจสอบว่า Component โหลดข้อมูลหรือไม่
  const checkComponentState = () => {
    console.log('⚛️ Checking React component state...');
    
    // ตรวจสอบว่ามีข้อความใน UI หรือไม่
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 Messages in UI: ${messageElements.length}`);
    
    if (messageElements.length === 0) {
      console.log('❌ No messages loaded - fetchMessages may not be working');
      console.log('🔧 Possible issues:');
      console.log('  - useEffect not running');
      console.log('  - fetchMessages not called');
      console.log('  - setMessages not updating state');
      console.log('  - Database query failing');
      console.log('  - RLS policy blocking');
      return false;
    }
    
    console.log('✅ Messages loaded successfully');
    
    // ตรวจสอบข้อมูลในข้อความ
    messageElements.forEach((element, index) => {
      const messageText = element.querySelector('.text-gray-800')?.textContent;
      const senderName = element.querySelector('.text-xs.text-gray-600')?.textContent;
      const messageTime = element.querySelector('.text-gray-500')?.textContent;
      const isMe = element.querySelector('.justify-end');
      
      console.log(`📝 Message ${index + 1}:`, {
        text: messageText?.substring(0, 30) + '...',
        sender: senderName,
        time: messageTime,
        isMe: !!isMe
      });
    });
    
    return true;
  };
  
  // 2. ตรวจสอบ Console Logs ที่ควรเห็น
  const checkConsoleLogs = () => {
    console.log('📋 Expected console logs during initial load:');
    console.log('  🚀 Starting initial message fetch...');
    console.log('  📥 Fetching initial messages...');
    console.log('  🆔 Current user ID: [user-id]');
    console.log('  ✅ Fetched X messages from database');
    console.log('  📊 Raw data sample: [...]');
    console.log('  🔄 Processing message [id]: {...}');
    console.log('  📝 Formatted X messages');
    console.log('  📅 Message order: Oldest → Newest (ascending)');
    console.log('  💾 About to setMessages with: X messages');
    console.log('  ✅ setMessages called successfully');
    console.log('  📜 Auto-scrolling to bottom...');
  };
  
  // 3. ทดสอบการเชื่อมต่อฐานข้อมูลโดยตรง
  const testDirectDatabaseQuery = async () => {
    console.log('🔍 Testing direct database query...');
    
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
        console.log('🔧 Check RLS policies on public_chats table');
        return false;
      }
      
      console.log('✅ Direct query successful');
      console.log(`📊 Found ${data.length} messages in database`);
      
      if (data.length > 0) {
        console.log('📄 Sample message:', data[0]);
        
        // ตรวจสอบว่ามีการ join กับ profiles
        if (data[0].profiles) {
          console.log('✅ Profile join working');
          console.log('👤 Profile data:', data[0].profiles);
        } else {
          console.log('⚠️ Profile join not working');
          console.log('🔧 Check RLS policies on profiles table');
        }
      }
      
      return true;
    } catch (err) {
      console.log('❌ Exception in direct query:', err);
      return false;
    }
  };
  
  // 4. ตรวจสอบ useEffect dependencies
  const checkUseEffect = () => {
    console.log('🔄 Checking useEffect dependencies...');
    
    // ตรวจสอบว่า component มีการอัปเดตเมื่อ currentUser เปลี่ยน
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
    }
  };
  
  // 5. ตรวจสอบการทำงานของ setMessages
  const checkSetMessages = () => {
    console.log('💾 Checking setMessages functionality...');
    
    // สร้าง observer เพื่อดูว่ามีการอัปเดต DOM หรือไม่
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log('🔄 DOM updated - new messages added');
          
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
      
      console.log('👁️ Started observing DOM for setMessages effects');
      
      // หยุด observe หลัง 5 วินาที
      setTimeout(() => {
        observer.disconnect();
        console.log('👁️ Stopped DOM observation');
      }, 5000);
    }
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = async () => {
    console.log('🚀 Starting Initial Load Test...\n');
    
    // ตรวจสอบ Console logs ที่ควรเห็น
    checkConsoleLogs();
    
    // ทดสอบการเชื่อมต่อฐานข้อมูลโดยตรง
    const dbQuerySuccess = await testDirectDatabaseQuery();
    
    if (!dbQuerySuccess) {
      console.log('\n❌ Database query failed - check RLS policies');
      console.log('🔧 Run this in Supabase SQL Editor:');
      console.log('  CREATE POLICY "Enable read for all users" ON public_chats');
      console.log('    FOR SELECT USING (true);');
      return;
    }
    
    // ตรวจสอบ component state
    setTimeout(() => {
      const componentSuccess = checkComponentState();
      checkUseEffect();
      checkSetMessages();
      
      if (componentSuccess) {
        console.log('\n✅ Initial load test PASSED');
        console.log('🎉 Messages are loading correctly on page refresh');
      } else {
        console.log('\n❌ Initial load test FAILED');
        console.log('🔧 Check console logs for specific errors');
      }
    }, 1000);
    
    console.log('\n💡 Manual Test Instructions:');
    console.log('  1. Refresh the page (F5)');
    console.log('  2. Check console for expected logs');
    console.log('  3. Verify messages appear in UI');
    console.log('  4. Check message order (oldest → newest)');
    console.log('  5. Verify profile data is loaded');
  };
  
  runAllTests();
}

window.testInitialLoad = testInitialLoad;
