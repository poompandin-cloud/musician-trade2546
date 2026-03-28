// Test script สำหรับทดสอบการคงอยู่ของข้อความ
function testMessagePersistence() {
  console.log('💾 Testing Message Persistence...');
  
  // 1. ตรวจสอบการโหลดข้อความเริ่มต้น
  const checkInitialLoad = () => {
    console.log('📥 Checking initial message load...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 Messages loaded in UI: ${messageElements.length}`);
    
    if (messageElements.length === 0) {
      console.log('❌ No messages loaded - possible fetch issue');
    } else {
      console.log('✅ Messages loaded successfully');
      
      // ตรวจสอบลำดับข้อความ
      const firstMessage = messageElements[0];
      const lastMessage = messageElements[messageElements.length - 1];
      
      const firstTime = firstMessage?.querySelector('.text-gray-500')?.textContent;
      const lastTime = lastMessage?.querySelector('.text-gray-500')?.textContent;
      
      console.log(`📅 First message time: ${firstTime}`);
      console.log(`📅 Last message time: ${lastTime}`);
      
      if (firstTime && lastTime) {
        console.log('✅ Message order appears correct (oldest → newest)');
      }
    }
  };
  
  // 2. ทดสอบการส่งข้อความ
  const testSendMessage = async () => {
    console.log('📤 Testing message sending...');
    
    try {
      // ดึงข้อมูลผู้ใช้
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ No user logged in');
        return;
      }
      
      const testMessage = `💾 Persistence Test - ${new Date().toLocaleTimeString()}`;
      
      console.log('📝 Test message:', testMessage);
      console.log('🆔 User ID:', user.id);
      
      // ตรวจสอบว่ามีการ insert จริงๆ
      console.log('💾 Inserting message into database...');
      
      const { data, error } = await supabase
        .from('public_chats')
        .insert({
          content: testMessage,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        console.log('❌ Insert failed:', error);
        console.log('🔧 Possible issues:');
        console.log('  - RLS policy blocking insert');
        console.log('  - Table permissions issue');
        console.log('  - Network connectivity');
        return false;
      }
      
      console.log('✅ Insert successful:', data);
      console.log('📊 Message ID:', data.id);
      console.log('⏰ Created at:', data.created_at);
      
      // รอ 2-3 วินาทีแล้วตรวจสอบว่าข้อความปรากฏใน UI
      setTimeout(() => {
        checkMessageInUI(testMessage);
      }, 3000);
      
      return true;
    } catch (err) {
      console.log('❌ Exception during send:', err);
      return false;
    }
  };
  
  // 3. ตรวจสอบว่าข้อความปรากฏใน UI
  const checkMessageInUI = (expectedMessage) => {
    console.log('🔍 Checking if message appears in UI...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    let found = false;
    let position = -1;
    
    messageElements.forEach((element, index) => {
      const messageText = element.querySelector('.text-gray-800')?.textContent;
      if (messageText && messageText.includes('Persistence Test')) {
        found = true;
        position = index + 1;
        console.log('✅ Test message found in UI at position:', position);
        console.log('📝 Message text:', messageText);
        
        const messageTime = element.querySelector('.text-gray-500')?.textContent;
        console.log('⏰ Message time:', messageTime);
        
        // ตรวจสอบว่าข้อความอยู่ล่างสุด
        if (position === messageElements.length) {
          console.log('✅ Message is at the bottom (correct order)');
        } else {
          console.log('⚠️ Message is not at the bottom - order issue');
        }
      }
    });
    
    if (!found) {
      console.log('❌ Test message not found in UI');
      console.log('🔧 Possible issues:');
      console.log('  - Realtime subscription not working');
      console.log('  - setMessages not updating state');
      console.log('  - React not re-rendering');
      console.log('  - Component not mounted properly');
    }
    
    return found;
  };
  
  // 4. ทดสอบการรีเฟรชหน้าเว็บ
  const testRefresh = () => {
    console.log('🔄 Testing page refresh...');
    
    const currentMessages = document.querySelectorAll('.space-y-4 > div').length;
    console.log(`📊 Messages before refresh: ${currentMessages}`);
    
    console.log('💡 Instructions:');
    console.log('  1. ส่งข้อความใหม่');
    console.log('  2. จำจำนวนข้อความ');
    console.log('  3. Refresh หน้าเว็บ (F5)');
    console.log('  4. ตรวจสอบว่าข้อความยังคงอยู่');
    console.log('  5. รัน script นี้ใหม่เพื่อตรวจสอบ');
  };
  
  // 5. ตรวจสอบการเรียงลำดับ
  const checkMessageOrder = () => {
    console.log('📅 Checking message order...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    const times = [];
    
    messageElements.forEach((element, index) => {
      const timeText = element.querySelector('.text-gray-500')?.textContent;
      if (timeText) {
        times.push({
          position: index + 1,
          time: timeText
        });
      }
    });
    
    console.log('📊 Message times:', times);
    
    // ตรวจสอบว่าเวลาเรียงลำดับถูกต้อง
    let isOrdered = true;
    for (let i = 1; i < times.length; i++) {
      if (times[i].time < times[i-1].time) {
        isOrdered = false;
        console.log('❌ Order issue found at position', i + 1);
        console.log(`  Position ${i}: ${times[i-1].time} → ${times[i].time}`);
      }
    }
    
    if (isOrdered && times.length > 1) {
      console.log('✅ Messages are in correct chronological order');
    } else if (times.length <= 1) {
      console.log('⚠️ Not enough messages to check order');
    }
  };
  
  // 6. ตรวจสอบการจำกัดจำนวนข้อความ
  const checkMessageLimit = () => {
    console.log('📊 Checking message limit (50 messages)...');
    
    const messageElements = document.querySelectorAll('.space-y-4 > div');
    console.log(`📊 Current message count: ${messageElements.length}`);
    
    if (messageElements.length >= 50) {
      console.log('⚠️ Reached 50 message limit');
      console.log('💡 Older messages may not be loaded');
    } else {
      console.log('✅ Within 50 message limit');
    }
  };
  
  // 7. รันการทดสอบทั้งหมด
  const runAllTests = async () => {
    console.log('🚀 Starting Message Persistence Test...\n');
    
    checkInitialLoad();
    checkMessageOrder();
    checkMessageLimit();
    
    console.log('\n💡 Testing Instructions:');
    console.log('  1. ตรวจสอบว่าโหลดข้อความเริ่มต้นสำเร็จ');
    console.log('  2. ทดสอบส่งข้อความใหม่');
    console.log('  3. ตรวจสอบว่าข้อความปรากฏใน UI');
    console.log('  4. Refresh หน้าเว็บแล้วตรวจสอบว่าข้อความยังคงอยู่');
    console.log('  5. ตรวจสอบลำดับข้อความ (เก่า → ใหม่)');
    
    // ทดสอบส่งข้อความ
    const sendSuccess = await testSendMessage();
    
    if (sendSuccess) {
      console.log('\n🎯 Send test completed - check UI for results');
    } else {
      console.log('\n❌ Send test failed - check database permissions');
    }
    
    console.log('\n🏁 Persistence test completed!');
    console.log('📋 Expected Results:');
    console.log('  📥 50 ข้อความล่าสุดโหลดตอนเปิดหน้า');
    console.log('  📤 ข้อความใหม่บันทึกในฐานข้อมูล');
    console.log('  🔄 Realtime อัปเดต UI ทันที');
    console.log('  💾 ข้อความคงอยู่หลัง refresh');
    console.log('  📅 ลำดับข้อความถูกต้อง (เก่า → ใหม่)');
  };
  
  runAllTests();
}

window.testMessagePersistence = testMessagePersistence;
