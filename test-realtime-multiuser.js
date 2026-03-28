// Test script สำหรับทดสอบ Multi-user Realtime
function testRealtimeMultiuser() {
  console.log('👥 Testing Multi-user Realtime functionality...');
  
  // 1. ตรวจสอบสถานะปัจจุบัน
  const checkCurrentState = () => {
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📨 Current messages in UI: ${messageElements.length}`);
    
    // ตรวจสอบว่ามีการเชื่อมต่อ Realtime หรือไม่
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Supabase client available');
    } else {
      console.log('❌ Supabase client not available');
      return false;
    }
    
    return true;
  };
  
  // 2. สร้าง test channel แยกเพื่อ monitor
  const createMonitorChannel = () => {
    console.log('📡 Creating monitor channel...');
    
    const monitorChannel = supabase
      .channel('multiuser-test-monitor')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'public_chats'
      }, (payload) => {
        console.log('🔔 MONITOR: New message detected:', payload.new);
        console.log('👤 From user:', payload.new.user_id);
        console.log('📝 Content:', payload.new.content);
        console.log('⏰ Time:', new Date(payload.new.created_at).toLocaleTimeString());
        
        // ตรวจสอบว่า UI อัปเดตหรือไม่
        setTimeout(() => {
          checkUIUpdate();
        }, 1000);
      })
      .subscribe((status) => {
        console.log('🔄 Monitor channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Monitor channel ready - waiting for messages...');
        }
      });
    
    return monitorChannel;
  };
  
  // 3. ตรวจสอบว่า UI อัปเดตหรือไม่
  const checkUIUpdate = () => {
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 UI check: ${messageElements.length} messages visible`);
    
    // ตรวจสอบข้อความล่าสุด
    if (messageElements.length > 0) {
      const lastMessage = messageElements[messageElements.length - 1];
      const messageText = lastMessage.querySelector('.text-gray-800')?.textContent;
      const messageTime = lastMessage.querySelector('.text-gray-500')?.textContent;
      
      console.log('📝 Latest message:', messageText);
      console.log('⏰ Latest time:', messageTime);
    }
  };
  
  // 4. ทดสอบการส่งข้อความจากคนอื่น (simulate)
  const simulateOtherUserMessage = async () => {
    console.log('🎭 Simulating message from another user...');
    
    try {
      // ใช้ user ID ที่ไม่ใช่ของเรา (ถ้ามี)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ No current user - cannot simulate');
        return;
      }
      
      // สร้างข้อความจาก "คนอื่น" (ในความเป็นจริงต้องมี user อื่น)
      const testMessage = `🎭 Simulated message from other user - ${new Date().toLocaleTimeString()}`;
      
      console.log('📤 Sending simulated message...');
      
      // ในการทดสอบจริง ต้องมี user อื่น หรือใช้ RPC function
      const { data, error } = await supabase
        .from('public_chats')
        .insert({
          content: testMessage,
          user_id: user.id // ใช้ user ID เดียวกันในการทดสอบ
        })
        .select()
        .single();
      
      if (error) {
        console.log('❌ Simulated insert failed:', error);
      } else {
        console.log('✅ Simulated message sent:', data);
        console.log('🔔 Should trigger Realtime for ALL connected users');
      }
    } catch (err) {
      console.log('❌ Error simulating message:', err);
    }
  };
  
  // 5. ทดสอบการรับ Realtime จากหลาย source
  const testMultiSource = () => {
    console.log('🌐 Testing multi-source Realtime...');
    
    // สร้างหลาย channels เพื่อทดสอบ
    const channels = [];
    
    for (let i = 1; i <= 3; i++) {
      const channel = supabase
        .channel(`test-channel-${i}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'public_chats'
        }, (payload) => {
          console.log(`🔔 Channel ${i}: Received message`, payload.new.content);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Channel ${i} subscribed`);
          }
        });
      
      channels.push(channel);
    }
    
    // ทำความสะอาด
    setTimeout(() => {
      channels.forEach((channel, index) => {
        supabase.removeChannel(channel);
        console.log(`🧹 Channel ${index} cleaned up`);
      });
    }, 30000);
  };
  
  // 6. ตรวจสอบ React state updates
  const checkReactState = () => {
    console.log('⚛️ Checking React state updates...');
    
    // ตรวจสอบว่ามีการอัปเดต state หรือไม่
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log('🔄 DOM updated - new nodes added');
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const messageText = node.querySelector('.text-gray-800')?.textContent;
              if (messageText) {
                console.log('📝 New message detected in DOM:', messageText);
              }
            }
          });
        }
      });
    });
    
    // เริ่ม observe พื้นที่แชท
    const chatArea = document.querySelector('.space-y-4');
    if (chatArea) {
      observer.observe(chatArea, {
        childList: true,
        subtree: true
      });
      console.log('👁️ DOM observer started');
      
      // หยุด observe หลัง 30 วินาที
      setTimeout(() => {
        observer.disconnect();
        console.log('👁️ DOM observer stopped');
      }, 30000);
    }
  };
  
  // 7. รันการทดสอบทั้งหมด
  const runMultiUserTest = async () => {
    console.log('🚀 Starting Multi-user Realtime Test...\n');
    
    if (!checkCurrentState()) {
      return;
    }
    
    const monitorChannel = createMonitorChannel();
    checkReactState();
    
    // รอ 2 วินาทีแล้วทดสอบส่งข้อความ
    setTimeout(() => {
      simulateOtherUserMessage();
    }, 2000);
    
    // ทดสอบ multi-source
    setTimeout(() => {
      testMultiSource();
    }, 5000);
    
    console.log('\n💡 Multi-user Test Instructions:');
    console.log('  1. เปิด browser 2 แท็บไปที่ /public-chat');
    console.log('  2. Login ด้วยคนละ account');
    console.log('  3. ส่งข้อความในแท็บแรก');
    console.log('  4. ควรเห็นข้อความในแท็บที่สองทันที');
    console.log('  5. ตรวจสอบ Console logs ในทั้ง 2 แท็บ');
    console.log('  6. ตรวจสอบว่า DOM อัปเดตจริง');
    
    // ทำความสะอาด
    setTimeout(() => {
      supabase.removeChannel(monitorChannel);
      console.log('\n🧹 Monitor channel cleaned up');
      console.log('🏁 Multi-user test completed!');
    }, 35000);
  };
  
  runMultiUserTest();
}

window.testRealtimeMultiuser = testRealtimeMultiuser;
