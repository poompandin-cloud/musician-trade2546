// Test script สำหรับ debug ปัญหา Realtime Chat
function testRealtimeDebug() {
  console.log('🔍 Debugging Realtime Chat issues...');
  
  // 1. ตรวจสอบสถานะการเชื่อมต่อ Supabase
  console.log('📡 Checking Supabase connection...');
  if (typeof supabase !== 'undefined') {
    console.log('✅ Supabase client available');
  } else {
    console.log('❌ Supabase client not available');
    return;
  }
  
  // 2. ตรวจสอบว่า Realtime ถูกเปิดใช้งานหรือไม่
  console.log('🔄 Checking Realtime capabilities...');
  const realtimeEnabled = supabase.realtime && typeof supabase.realtime.connect === 'function';
  console.log(`  📡 Realtime enabled: ${realtimeEnabled}`);
  
  // 3. ตรวจสอบตาราง public_chats
  const checkTableStructure = async () => {
    console.log('🗃️ Checking public_chats table structure...');
    
    try {
      // ลองดึงข้อมูล 1 แถวเพื่อตรวจสอบโครงสร้าง
      const { data, error } = await supabase
        .from('public_chats')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Error accessing public_chats:', error);
        console.log('  💡 อาจจำเป็นต้องตรวจสอบ RLS policies');
        return false;
      }
      
      console.log('✅ public_chats table accessible');
      if (data && data.length > 0) {
        console.log('📋 Sample record:', data[0]);
        console.log('  🔑 Fields:', Object.keys(data[0]));
      } else {
        console.log('📭 Table is empty');
      }
      return true;
    } catch (err) {
      console.log('❌ Exception checking table:', err);
      return false;
    }
  };
  
  // 4. ตรวจสอบการเชื่อมต่อ Realtime channel
  const testRealtimeChannel = () => {
    console.log('📡 Testing Realtime channel connection...');
    
    const testChannel = supabase
      .channel('debug-public-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'public_chats'
      }, (payload) => {
        console.log('🔔 Debug: Received Realtime event:', payload);
      })
      .subscribe((status) => {
        console.log('🔄 Debug: Channel status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Debug: Channel subscribed successfully');
          
          // ทดสอบส่งข้อความจาก API โดยตรง
          setTimeout(() => {
            testDirectInsert();
          }, 2000);
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Debug: Channel error occurred');
        }
      });
    
    // ทำความสะอาดหลัง 30 วินาที
    setTimeout(() => {
      supabase.removeChannel(testChannel);
      console.log('🧹 Debug: Test channel cleaned up');
    }, 30000);
  };
  
  // 5. ทดสอบการ INSERT โดยตรง
  const testDirectInsert = async () => {
    console.log('🧪 Testing direct database insert...');
    
    try {
      // ดึงข้อมูลผู้ใช้ปัจจุบัน
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ No user logged in - cannot test insert');
        return;
      }
      
      const testMessage = `🧪 Debug message - ${new Date().toLocaleTimeString()}`;
      
      console.log('📤 Inserting test message:', testMessage);
      console.log('🆔 Using user_id:', user.id);
      
      const { data, error } = await supabase
        .from('public_chats')
        .insert({
          content: testMessage,
          user_id: user.id
        })
        .select()
        .single();
      
      if (error) {
        console.log('❌ Direct insert failed:', error);
        console.log('  💡 Check RLS policies on public_chats table');
      } else {
        console.log('✅ Direct insert successful:', data);
        console.log('🔔 Should trigger Realtime event in 2-3 seconds...');
      }
    } catch (err) {
      console.log('❌ Exception during direct insert:', err);
    }
  };
  
  // 6. ตรวจสอบ RLS policies
  const checkRLSPolicies = async () => {
    console.log('🔐 Checking RLS policies...');
    
    try {
      // ลอง SELECT โดยไม่มีการ auth
      const { data, error } = await supabase.auth.setSession(null);
      
      if (error) {
        console.log('❌ Cannot clear session for RLS test');
        return;
      }
      
      const { data: selectData, error: selectError } = await supabase
        .from('public_chats')
        .select('id, content, user_id, created_at')
        .limit(1);
      
      if (selectError) {
        console.log('❌ RLS blocking anonymous SELECT:', selectError);
        console.log('  💡 RLS may be too restrictive for Realtime');
      } else {
        console.log('✅ Anonymous SELECT allowed - RLS is permissive');
      }
      
      // Restore session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.setSession(session);
      }
    } catch (err) {
      console.log('❌ Exception checking RLS:', err);
    }
  };
  
  // 7. ตรวจสอบสถานะ Realtime ใน Supabase Dashboard
  const checkRealtimeStatus = () => {
    console.log('📊 Realtime Status Check:');
    console.log('  🔧 ตรวจสอบใน Supabase Dashboard:');
    console.log('    1. Database → Replication');
    console.log('    2. ตรวจสอบว่า public_chats ถูกเปิด Realtime');
    console.log('    3. ตรวจสอบว่า Insert ถูกเลือก');
    console.log('    4. ตรวจสอบว่า Publication ถูกสร้าง');
  };
  
  // รันการทดสอบทั้งหมด
  const runAllTests = async () => {
    console.log('🚀 Starting comprehensive Realtime debug...\n');
    
    const tableOk = await checkTableStructure();
    if (tableOk) {
      testRealtimeChannel();
      await checkRLSPolicies();
    }
    
    checkRealtimeStatus();
    
    console.log('\n🏁 Debug tests completed!');
    console.log('💡 Next steps:');
    console.log('  1. ตรวจสอบ Console logs สำหรับ Realtime events');
    console.log('  2. เปิด 2 browser tabs และทดสอบส่งข้อความ');
    console.log('  3. ตรวจสอบ Supabase Dashboard → Replication');
    console.log('  4. ตรวจสอบ RLS policies บน public_chats');
  };
  
  runAllTests();
}

window.testRealtimeDebug = testRealtimeDebug;
