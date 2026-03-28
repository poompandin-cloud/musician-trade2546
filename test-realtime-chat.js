// Test script สำหรับทดสอบ Realtime Chat
function testRealtimeChat() {
  console.log('🔄 Testing Realtime Chat functionality...');
  
  // 1. ตรวจสอบว่ามีการเชื่อมต่อ Supabase
  if (typeof supabase !== 'undefined') {
    console.log('✅ Supabase client พร้อมใช้งาน');
  } else {
    console.log('❌ Supabase client ไม่พร้อมใช้งาน');
    return;
  }
  
  // 2. ตรวจสอบข้อมูลผู้ใช้
  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('✅ ผู้ใช้ login แล้ว:', user.email);
        console.log('🆔 User ID:', user.id);
        return true;
      } else {
        console.log('⚠️ ยังไม่ได้ login - สามารถดูข้อความแต่ไม่สามารถส่งได้');
        return false;
      }
    } catch (error) {
      console.log('❌ ตรวจสอบผู้ใช้ล้มเหลว:', error);
      return false;
    }
  };
  
  // 3. ตรวจสอบการดึงข้อมูลแชท
  const checkFetchMessages = async () => {
    try {
      console.log('📥 กำลังทดสอบดึงข้อมูลแชท...');
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
        .limit(5);

      if (error) {
        console.log('❌ ดึงข้อมูลล้มเหลว:', error);
        return false;
      }

      console.log('✅ ดึงข้อมูลสำเร็จ');
      console.log(`📊 พบข้อความ ${data.length} ข้อความ`);
      
      data.forEach((msg, index) => {
        console.log(`  💬 ${index + 1}. ${msg.profiles?.full_name || 'ผู้ใช้ทั่วไป'}: ${msg.content.substring(0, 50)}...`);
      });
      
      return true;
    } catch (error) {
      console.log('❌ ทดสอบดึงข้อมูลล้มเหลว:', error);
      return false;
    }
  };
  
  // 4. ตรวจสอบการส่งข้อความ (ถ้า login)
  const testSendMessage = async (isLoggedIn) => {
    if (!isLoggedIn) {
      console.log('⚠️ ข้ามการทดสอบส่งข้อความ - ยังไม่ได้ login');
      return;
    }

    try {
      console.log('📤 กำลังทดสอบส่งข้อความ...');
      
      const testMessage = `ทดสอบ Realtime Chat - ${new Date().toLocaleTimeString()}`;
      
      const { data, error } = await supabase
        .from('public_chats')
        .insert({
          content: testMessage,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.log('❌ ส่งข้อความล้มเหลว:', error);
        return false;
      }

      console.log('✅ ส่งข้อความสำเร็จ');
      console.log(`📝 ข้อความทดสอบ: ${testMessage}`);
      console.log(`🆔 Message ID: ${data.id}`);
      
      return true;
    } catch (error) {
      console.log('❌ ทดสอบส่งข้อความล้มเหลว:', error);
      return false;
    }
  };
  
  // 5. ตรวจสอบ Realtime subscription
  const checkRealtimeSubscription = () => {
    console.log('🔄 กำลังทดสอบ Realtime subscription...');
    
    const channel = supabase
      .channel('test-public-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'public_chats'
        },
        (payload) => {
          console.log('🔔 Real: ได้รับข้อความใหม่:', payload.new.content);
          console.log('👤 จากผู้ใช้ ID:', payload.new.user_id);
          console.log('⏰ เวลา:', new Date(payload.new.created_at).toLocaleTimeString());
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime subscription เชื่อมต่อสำเร็จ');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Realtime subscription ผิดพลาด');
        }
      });

    // ทำความสะอาดหลัง 10 วินาที
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 ทำความสะอาด Realtime subscription');
    }, 10000);
  };
  
  // รันการทดสอบ
  const runTests = async () => {
    console.log('🚀 เริ่มการทดสอบ Realtime Chat...');
    
    const isLoggedIn = await checkCurrentUser();
    await checkFetchMessages();
    await testSendMessage(isLoggedIn);
    checkRealtimeSubscription();
    
    console.log('🏁 การทดสอบเสร็จสิ้น!');
    console.log('💡 คำแนะนำ:');
    console.log('  1. เปิดอีก browser เพื่อทดสอบ Realtime');
    console.log('  2. ส่งข้อความใน browser หนึ่ง ควรขึ้นในอีก browser ทันที');
    console.log('  3. ตรวจสอบ Console Log สำหรับข้อความใหม่');
  };
  
  runTests();
}

window.testRealtimeChat = testRealtimeChat;
