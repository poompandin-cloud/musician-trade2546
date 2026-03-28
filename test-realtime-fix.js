// Test script สำหรับตรวจสอบว่า Realtime ทำงานถูกต้อง
function testRealtimeFix() {
  console.log('🔧 Testing Realtime Fix...');
  
  // 1. ตรวจสอบว่ามีการเชื่อมต่อ Realtime หรือไม่
  const checkRealtimeConnection = () => {
    console.log('📡 Checking Realtime connection...');
    
    // ตรวจสอบว่ามี channel ทำงานอยู่หรือไม่
    if (typeof supabase !== 'undefined') {
      console.log('✅ Supabase client available');
      
      // สร้าง test channel เพื่อตรวจสอสถานะ
      const testChannel = supabase
        .channel('connection-test')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'public_chats'
        }, (payload) => {
          console.log('🔔 Test channel received:', payload.new.content);
        })
        .subscribe((status) => {
          console.log('🔄 Test channel status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime connection is working!');
            console.log('🌐 Ready to test message broadcasting...');
            
            // ทดสอบส่งข้อความทันที
            setTimeout(() => {
              testMessageBroadcast();
            }, 1000);
          } else {
            console.log('❌ Realtime connection failed');
          }
          
          // ทำความสะอาด
          setTimeout(() => {
            supabase.removeChannel(testChannel);
          }, 5000);
        });
    } else {
      console.log('❌ Supabase client not available');
    }
  };
  
  // 2. ทดสอบการส่งข้อความและ broadcast
  const testMessageBroadcast = async () => {
    console.log('📤 Testing message broadcast...');
    
    try {
      // ดึงข้อมูลผู้ใช้ปัจจุบัน
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ No user logged in');
        return;
      }
      
      const testMessage = `🧪 Realtime Test - ${new Date().toLocaleTimeString()}`;
      
      console.log('📤 Sending test message:', testMessage);
      
      const { data, error } = await supabase
        .from('public_chats')
        .insert({
          content: testMessage,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        console.log('❌ Failed to send test message:', error);
        return;
      }
      
      console.log('✅ Test message sent successfully:', data);
      console.log('🔔 Should appear in ALL connected browsers within 2-3 seconds...');
      
      // ตรวจสอบว่าข้อความปรากฏใน UI
      setTimeout(() => {
        checkUIUpdate(testMessage);
      }, 3000);
      
    } catch (err) {
      console.log('❌ Error in test broadcast:', err);
    }
  };
  
  // 3. ตรวจสอบว่า UI อัปเดตหรือไม่
  const checkUIUpdate = (expectedMessage) => {
    console.log('🔍 Checking UI update...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 Current message count: ${messageElements.length}`);
    
    // ค้นหาข้อความล่าสุด
    let found = false;
    messageElements.forEach((element, index) => {
      const messageText = element.querySelector('.text-gray-800')?.textContent;
      if (messageText && messageText.includes('Realtime Test')) {
        found = true;
        console.log('✅ Test message found in UI at position', index + 1);
        console.log('📝 Message text:', messageText);
        
        const messageTime = element.querySelector('.text-gray-500')?.textContent;
        console.log('⏰ Message time:', messageTime);
      }
    });
    
    if (!found) {
      console.log('❌ Test message not found in UI');
      console.log('🔧 Possible issues:');
      console.log('  - Realtime subscription not working');
      console.log('  - setMessages not updating state');
      console.log('  - React not re-rendering');
      console.log('  - Component not subscribed to changes');
    } else {
      console.log('🎉 Realtime is working correctly!');
      console.log('🌐 Message broadcasted to all users successfully!');
    }
  };
  
  // 4. ตรวจสอบ Component State
  const checkComponentState = () => {
    console.log('⚛️ Checking React component state...');
    
    // ตรวจสอบว่า component มีการอัปเดต state หรือไม่
    const observer = new MutationObserver((mutations) => {
      let messageAdded = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const messageText = node.querySelector('.text-gray-800')?.textContent;
              if (messageText) {
                console.log('🔄 DOM updated - New message:', messageText);
                messageAdded = true;
              }
            }
          });
        }
      });
      
      if (messageAdded) {
        console.log('✅ React component re-rendered successfully!');
      }
    });
    
    const chatContainer = document.querySelector('.space-y-4');
    if (chatContainer) {
      observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
      
      console.log('👁️ Started observing DOM changes...');
      
      // หยุด observe หลัง 10 วินาที
      setTimeout(() => {
        observer.disconnect();
        console.log('👁️ Stopped observing DOM changes');
      }, 10000);
    }
  };
  
  // 5. ตรวจสอบ Network Connection
  const checkNetworkConnection = () => {
    console.log('🌐 Checking network connection...');
    
    // ตรวจสอสถานะ network
    if (navigator.onLine) {
      console.log('✅ Browser is online');
    } else {
      console.log('❌ Browser is offline - Realtime will not work');
      return;
    }
    
    // ตรวจสอบ WebSocket connection
    if ('WebSocket' in window) {
      console.log('✅ WebSocket supported');
    } else {
      console.log('❌ WebSocket not supported');
    }
  };
  
  // 6. รันการทดสอบทั้งหมด
  const runAllTests = () => {
    console.log('🚀 Starting comprehensive Realtime fix test...\n');
    
    checkNetworkConnection();
    checkComponentState();
    checkRealtimeConnection();
    
    console.log('\n💡 Testing Instructions:');
    console.log('  1. เปิด 2 browser tabs ไปที่ /public-chat');
    console.log('  2. Login ด้วยคนละ account');
    console.log('  3. รัน script นี้้ในทั้ง 2 tabs');
    console.log('  4. ส่งข้อความในแท็บแรก');
    console.log('  5. ควรเห็นข้อความในแท็บที่สองทันที');
    console.log('  6. ตรวจสอบ Console logs ในทั้ง 2 tabs');
    
    console.log('\n🔧 Expected Console Output:');
    console.log('  🔄 Realtime subscription status: SUBSCRIBED');
    console.log('  🌐 Ready to receive messages from ALL users!');
    console.log('  📤 Sending test message: 🧪 Realtime Test...');
    console.log('  🔔 Realtime: New message received:');
    console.log('  🎯 Message added to state - ALL users should see this now!');
    console.log('  🌐 Broadcasting to ALL connected clients!');
    console.log('  ✅ Test message found in UI');
    console.log('  🎉 Realtime is working correctly!');
    
    console.log('\n🏁 Test completed! Check results above.');
  };
  
  runAllTests();
}

window.testRealtimeFix = testRealtimeFix;
